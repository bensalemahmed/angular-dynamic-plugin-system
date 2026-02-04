import { Injectable, Injector, Inject, Optional, ComponentRef, ViewContainerRef, EnvironmentInjector } from '@angular/core';
import { Observable, filter } from 'rxjs';
import {
  PluginMetadata,
  PluginState,
  PluginStateEvent,
  LoadedPluginModule
} from '../types/plugin.types';
import {
  PluginRegistration,
  PluginSystemConfig,
  PLUGIN_SYSTEM_CONFIG
} from '../types/registration.types';
import {
  PluginLoadError,
  PluginNotFoundError,
  PluginStateError,
  PluginLifecycleError,
  PluginLifecycleTimeoutError,
  PluginOperationInProgressError
} from '../types/errors.types';
import { RemotePluginConfig } from '../types/remote-plugin.types';
import { PluginRegistry } from './plugin-registry.service';
import { RemotePluginLoader } from './remote-plugin-loader.service';
import { PluginContextImpl } from '../utils/plugin-context.impl';
import { createPluginInjector } from '../utils/plugin-injector.factory';
import { PluginLifecycle } from '../types/lifecycle.types';

@Injectable({ providedIn: 'root' })
export class PluginManager {
  private readonly loadingPromises = new Map<string, Promise<PluginMetadata>>();
  private readonly unloadingPromises = new Map<string, Promise<void>>(); // v1.1.0: Fix #4

  readonly pluginState$: Observable<PluginStateEvent>;

  constructor(
    private readonly registry: PluginRegistry,
    private readonly injector: Injector,
    private readonly remoteLoader: RemotePluginLoader,
    @Optional() @Inject(PLUGIN_SYSTEM_CONFIG) private readonly config?: PluginSystemConfig
  ) {
    this.pluginState$ = this.registry.state$.pipe(
      filter((event): event is PluginStateEvent => event !== null)
    );
  }

  register(registration: PluginRegistration): void {
    try {
      this.registry.register(registration);

      if (registration.config?.autoLoad) {
        this.load(registration.name).catch(() => {
          // Defensive: auto-load errors are emitted via pluginState$
        });
      }
    } catch (error) {
      this.handleError(registration.name, error as Error);
      throw error;
    }
  }

  async load(pluginName: string): Promise<PluginMetadata> {
    const existingPromise = this.loadingPromises.get(pluginName);
    if (existingPromise) {
      return existingPromise;
    }

    const loadPromise = this.executeLoad(pluginName);
    this.loadingPromises.set(pluginName, loadPromise);

    try {
      const result = await loadPromise;
      return result;
    } finally {
      this.loadingPromises.delete(pluginName);
    }
  }

  async loadMany(pluginNames: string[]): Promise<PluginMetadata[]> {
    const maxConcurrent = this.config?.maxConcurrentLoads || pluginNames.length;
    const results: PluginMetadata[] = [];

    for (let i = 0; i < pluginNames.length; i += maxConcurrent) {
      const batch = pluginNames.slice(i, i + maxConcurrent);
      const batchResults = await Promise.allSettled(
        batch.map(name => this.load(name))
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        }
      }
    }

    return results;
  }

  async unregister(pluginName: string): Promise<void> {
    // v1.1.0: Fix #4 - Prevent concurrent unload operations
    const existingUnloadPromise = this.unloadingPromises.get(pluginName);
    if (existingUnloadPromise) {
      return existingUnloadPromise;
    }

    const unloadPromise = this.executeUnregister(pluginName);
    this.unloadingPromises.set(pluginName, unloadPromise);

    try {
      await unloadPromise;
    } finally {
      this.unloadingPromises.delete(pluginName);
    }
  }

  // v1.1.0: Fix #4 - Check if plugin is currently unloading
  isUnloading(pluginName: string): boolean {
    return this.unloadingPromises.has(pluginName);
  }

  private async executeUnregister(pluginName: string): Promise<void> {
    const entry = this.registry.get(pluginName);
    if (!entry) {
      throw new PluginNotFoundError(pluginName);
    }

    const metadata = entry.metadata;

    if (metadata.state === PluginState.LOADING) {
      throw new PluginStateError(pluginName, 'not LOADING', metadata.state);
    }

    // v1.1.0: Fix #3 - Prevent unload during component creation
    if (metadata.isCreatingComponent) {
      throw new PluginOperationInProgressError(pluginName, 'creating');
    }

    try {
      // v1.1.0: Enhancement #2 - Debug logging
      this.logStateTransition(pluginName, metadata.state, PluginState.UNLOADING);

      this.registry.updateMetadata(pluginName, { state: PluginState.UNLOADING });

      await this.callLifecycleHook(pluginName, 'beforeUnload');

      if (metadata.componentRef) {
        // v1.1.0: Enhancement #2 - Debug logging
        this.debugLog(`Destroying component for plugin '${pluginName}'`);

        await this.destroyComponent(metadata.componentRef, pluginName);
        // v1.1.0: Fix #2 - Clear componentRef to prevent memory leak
        this.registry.updateMetadata(pluginName, { componentRef: undefined });
      }

      // v1.1.1: Memory optimization - Clear module and injector references
      if (metadata.injectorReference) {
        this.debugLog(`Destroying injector for plugin '${pluginName}'`);
        try {
          metadata.injectorReference.destroy();
        } catch (error) {
          // Defensive: continue cleanup even if injector destruction fails
          this.debugLog(`Warning: Injector destruction failed for '${pluginName}': ${error}`);
        }
      }

      // v1.1.1: Memory optimization - Clear all references to help garbage collection
      this.registry.updateMetadata(pluginName, {
        moduleReference: null,
        injectorReference: null,
        componentRef: null,
        error: undefined
      });

      // v1.1.1: Memory optimization - Clear context
      const context = this.registry.getContext(pluginName);
      if (context) {
        try {
          context.destroy();
        } catch (error) {
          this.debugLog(`Warning: Context destruction failed for '${pluginName}': ${error}`);
        }
      }

      await this.callLifecycleHook(pluginName, 'afterUnload');

      // v1.1.0: Enhancement #2 - Debug logging
      this.debugLog(`Plugin '${pluginName}' unregistered successfully`);

      this.registry.unregister(pluginName);
    } catch (error) {
      this.handleError(pluginName, error as Error);
      throw error;
    }
  }

  getPluginState(pluginName: string): PluginState | undefined {
    return this.registry.getMetadata(pluginName)?.state;
  }

  isReady(pluginName: string): boolean {
    const state = this.getPluginState(pluginName);
    return state === PluginState.LOADED || state === PluginState.ACTIVE;
  }

  getPluginMetadata(pluginName: string): PluginMetadata | undefined {
    return this.registry.getMetadata(pluginName);
  }

  getAllPlugins(): PluginMetadata[] {
    return this.registry.getAllMetadata();
  }

  getPluginsByState(state: PluginState): PluginMetadata[] {
    return this.registry.getPluginsByState(state);
  }

  /**
   * v1.2.0: Register and load a plugin from a remote URL
   * This enables true dynamic plugin loading from external sources
   */
  async registerRemotePlugin(config: RemotePluginConfig): Promise<PluginMetadata> {
    // Use RemotePluginLoader to fetch the remote module
    const result = await this.remoteLoader.loadRemotePlugin(config);

    // Register the plugin with the fetched module
    this.register({
      name: config.name,
      loadFn: async () => {
        // Module is already loaded, just return it
        return result.module;
      },
      config: {
        metadata: {
          ...config.metadata,
          remote: true,
          remoteUrl: config.remoteUrl,
          loadTime: result.loadTime,
          fromCache: result.fromCache
        }
      }
    });

    // Load the plugin immediately
    return this.load(config.name);
  }

  /**
   * v1.2.0: Unregister a remote plugin and clean up remote resources
   */
  async unregisterRemotePlugin(pluginName: string): Promise<void> {
    // Get plugin metadata to find the remote URL
    const metadata = this.registry.getMetadata(pluginName);
    const remoteUrl = metadata?.componentRef ? (metadata as any).remoteUrl : null;

    // Unregister the plugin normally
    await this.unregister(pluginName);

    // Clean up remote loader cache
    if (remoteUrl) {
      this.remoteLoader.unloadRemotePlugin(remoteUrl);
    } else {
      // Try by plugin name
      this.remoteLoader.unloadRemotePlugin(pluginName);
    }
  }

  /**
   * v1.2.0: Get remote plugin loader cache statistics
   */
  getRemoteCacheStats() {
    return this.remoteLoader.getCacheStats();
  }

  /**
   * v1.2.0: Clear all remote plugin cache
   */
  clearRemoteCache(): void {
    this.remoteLoader.clearCache();
  }

  /**
   * v1.2.0: Helper - Load and activate a plugin in one call
   * Combines load() + createPluginComponent() for convenience
   */
  async loadAndActivate(
    pluginName: string,
    viewContainer: ViewContainerRef
  ): Promise<ComponentRef<PluginLifecycle>> {
    // Load if not already loaded
    if (!this.isReady(pluginName)) {
      await this.load(pluginName);
    }

    // Create component
    return this.createPluginComponent(pluginName, viewContainer);
  }

  /**
   * v1.2.0: Helper - Load remote plugin and activate it
   */
  async loadRemoteAndActivate(
    config: RemotePluginConfig,
    viewContainer: ViewContainerRef
  ): Promise<ComponentRef<PluginLifecycle>> {
    await this.registerRemotePlugin(config);
    return this.createPluginComponent(config.name, viewContainer);
  }

  async createPluginComponent(
    pluginName: string,
    viewContainer: ViewContainerRef
  ): Promise<ComponentRef<PluginLifecycle>> {
    const metadata = this.registry.getMetadata(pluginName);
    if (!metadata) {
      throw new PluginNotFoundError(pluginName);
    }

    // v1.1.0: Fix #3 - Prevent concurrent component creation
    if (metadata.isCreatingComponent) {
      throw new PluginOperationInProgressError(pluginName, 'creating');
    }

    if (!this.isReady(pluginName)) {
      throw new PluginStateError(pluginName, 'LOADED or ACTIVE', metadata.state);
    }

    const injector = this.registry.getInjector(pluginName);
    if (!injector) {
      throw new PluginLoadError(pluginName);
    }

    const context = this.registry.getContext(pluginName);
    if (!context) {
      throw new PluginLoadError(pluginName);
    }

    try {
      // v1.1.0: Fix #3 - Set flag to prevent concurrent operations
      this.registry.updateMetadata(pluginName, { isCreatingComponent: true });

      // v1.1.0: Enhancement #2 - Debug logging
      this.debugLog(`Creating component for plugin '${pluginName}'`);

      // v1.1.0: Fix #2 - Check for existing componentRef and destroy it first
      if (metadata.componentRef) {
        await this.destroyComponent(metadata.componentRef, pluginName);
        this.registry.updateMetadata(pluginName, { componentRef: undefined });
      }

      const componentRef = viewContainer.createComponent(
        metadata.manifest.entryComponent,
        { injector }
      );

      // v1.1.0: Enhancement #3 - Track activation time
      this.logStateTransition(pluginName, metadata.state, PluginState.ACTIVE);

      this.registry.updateMetadata(pluginName, {
        componentRef,
        state: PluginState.ACTIVE,
        activatedAt: new Date(), // v1.1.0: Enhancement #3
        isCreatingComponent: false
      });

      if (componentRef.instance.onActivate) {
        // v1.1.0: Enhancement #2 - Debug logging
        this.debugLog(`Calling onActivate() for plugin '${pluginName}'`);
        const hookStartTime = Date.now();

        await this.callPluginLifecycleHookWithTimeout(
          Promise.resolve(componentRef.instance.onActivate(context)),
          pluginName,
          'onActivate'
        );

        // v1.1.0: Enhancement #2 - Debug logging
        this.debugLog(`onActivate() completed in ${Date.now() - hookStartTime}ms for plugin '${pluginName}'`);
      }

      return componentRef;
    } catch (error) {
      // v1.1.0: Fix #3 - Clear flag on error
      this.registry.updateMetadata(pluginName, { isCreatingComponent: false });
      this.handleError(pluginName, error as Error);
      throw new PluginLoadError(pluginName, error as Error);
    }
  }

  private async executeLoad(pluginName: string): Promise<PluginMetadata> {
    const entry = this.registry.get(pluginName);
    if (!entry) {
      throw new PluginNotFoundError(pluginName);
    }

    const { registration } = entry;
    const currentState = entry.metadata.state;

    if (currentState === PluginState.LOADED || currentState === PluginState.ACTIVE) {
      return entry.metadata;
    }

    if (currentState === PluginState.LOADING) {
      throw new PluginStateError(pluginName, 'not LOADING', currentState);
    }

    try {
      // v1.1.0: Enhancement #2 - Debug logging
      this.logStateTransition(pluginName, currentState, PluginState.LOADING);

      this.registry.updateMetadata(pluginName, {
        state: PluginState.LOADING,
        error: undefined
      });

      await this.callLifecycleHook(pluginName, 'beforeLoad');

      // v1.1.0: Enhancement #2 - Debug logging
      this.debugLog(`Loading module for plugin '${pluginName}'`);
      const loadStartTime = Date.now();

      const module = await this.loadPluginModule(registration, pluginName);

      // v1.1.0: Enhancement #2 - Validate manifest in debug mode
      if (this.config?.enableDevMode && this.config?.debugOptions?.validateManifests) {
        this.validatePluginManifest(module.PluginManifest, pluginName);
      }

      // v1.1.0: Enhancement #2 - Debug logging
      this.debugLog(`Module loaded in ${Date.now() - loadStartTime}ms for plugin '${pluginName}'`);

      this.registry.setManifest(pluginName, module.PluginManifest);

      const context = this.createPluginContext(pluginName, registration);
      this.registry.setContext(pluginName, context);

      const pluginInjector = createPluginInjector({
        parent: this.injector as EnvironmentInjector,
        context,
        providers: []
      });

      this.registry.setInjector(pluginName, pluginInjector);

      const instance = new module.PluginManifest.entryComponent();
      if (instance.onLoad) {
        // v1.1.0: Enhancement #2 - Debug logging
        this.debugLog(`Calling onLoad() for plugin '${pluginName}'`);
        const hookStartTime = Date.now();

        // v1.1.0: Fix #1 - Add timeout protection to onLoad
        await this.callPluginLifecycleHookWithTimeout(
          Promise.resolve(instance.onLoad(context)),
          pluginName,
          'onLoad'
        );

        // v1.1.0: Enhancement #2 - Debug logging
        this.debugLog(`onLoad() completed in ${Date.now() - hookStartTime}ms for plugin '${pluginName}'`);
      }

      // v1.1.0: Enhancement #2 - Log state transition
      this.logStateTransition(pluginName, PluginState.LOADING, PluginState.LOADED);

      // v1.1.1: Memory optimization - Store module and injector references for cleanup
      this.registry.updateMetadata(pluginName, {
        state: PluginState.LOADED,
        loadedAt: new Date(),
        moduleReference: module,
        injectorReference: pluginInjector
      });

      await this.callLifecycleHook(pluginName, 'afterLoad');

      return this.registry.getMetadata(pluginName)!;
    } catch (error) {
      // v1.1.0: Fix #5 - Destroy context if plugin load fails after context creation
      const context = this.registry.getContext(pluginName);
      if (context) {
        try {
          context.destroy();
        } catch {
          // Defensive: ignore context destruction errors during error handling
        }
      }
      this.handleError(pluginName, error as Error);
      throw new PluginLoadError(pluginName, error as Error);
    }
  }

  private async loadPluginModule(
    registration: PluginRegistration,
    pluginName: string
  ): Promise<LoadedPluginModule> {
    const timeout = registration.config?.timeout || this.config?.globalTimeout;

    if (timeout) {
      return this.loadWithTimeout(registration.loadFn, timeout, pluginName);
    }

    return registration.loadFn();
  }

  private async loadWithTimeout(
    loadFn: () => Promise<LoadedPluginModule>,
    timeout: number,
    pluginName: string
  ): Promise<LoadedPluginModule> {
    return Promise.race([
      loadFn(),
      new Promise<LoadedPluginModule>((_, reject) =>
        setTimeout(() => reject(new Error(`Plugin load timeout: ${pluginName}`)), timeout)
      )
    ]);
  }

  private createPluginContext(
    pluginName: string,
    registration: PluginRegistration
  ): PluginContextImpl {
    const allowedServices =
      registration.config?.allowedServices ||
      this.config?.defaultAllowedServices ||
      [];

    return new PluginContextImpl({
      pluginName,
      hostInjector: this.injector,
      allowedServices
    });
  }

  private async destroyComponent(
    componentRef: ComponentRef<PluginLifecycle>,
    pluginName: string
  ): Promise<void> {
    try {
      if (componentRef.instance.onDeactivate) {
        // v1.1.0: Enhancement #2 - Debug logging
        this.debugLog(`Calling onDeactivate() for plugin '${pluginName}'`);
        const hookStartTime = Date.now();

        await this.callPluginLifecycleHookWithTimeout(
          Promise.resolve(componentRef.instance.onDeactivate()),
          pluginName,
          'onDeactivate'
        );

        // v1.1.0: Enhancement #2 - Debug logging
        this.debugLog(`onDeactivate() completed in ${Date.now() - hookStartTime}ms for plugin '${pluginName}'`);
      }

      if (componentRef.instance.onDestroy) {
        // v1.1.0: Enhancement #2 - Debug logging
        this.debugLog(`Calling onDestroy() for plugin '${pluginName}'`);
        const hookStartTime = Date.now();

        await this.callPluginLifecycleHookWithTimeout(
          Promise.resolve(componentRef.instance.onDestroy()),
          pluginName,
          'onDestroy'
        );

        // v1.1.0: Enhancement #2 - Debug logging
        this.debugLog(`onDestroy() completed in ${Date.now() - hookStartTime}ms for plugin '${pluginName}'`);
      }

      componentRef.destroy();
    } catch (error) {
      throw new PluginLifecycleError(pluginName, 'onDestroy', error as Error);
    }
  }

  // v1.1.0: Fix #1 - Lifecycle hook timeout protection
  private async callPluginLifecycleHookWithTimeout<T>(
    promise: Promise<T>,
    pluginName: string,
    hookName: string
  ): Promise<T> {
    const timeout = this.config?.lifecycleHookTimeout ?? 5000;

    // If timeout is 0 or Infinity, don't apply timeout
    if (timeout === 0 || timeout === Infinity) {
      return promise;
    }

    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => {
          reject(new PluginLifecycleTimeoutError(pluginName, hookName, timeout));
        }, timeout)
      )
    ]);
  }

  private async callLifecycleHook(
    pluginName: string,
    hook: keyof Required<PluginSystemConfig>['lifecycleHooks']
  ): Promise<void> {
    const hookFn = this.config?.lifecycleHooks?.[hook];
    if (hookFn && hook !== 'onError') {
      try {
        await (hookFn as (pluginName: string) => void | Promise<void>)(pluginName);
      } catch (error) {
        if (this.config?.enableDevMode) {
          throw error;
        }
      }
    }
  }

  // v1.1.0: Enhancement #3 - Get detailed plugin information
  getPluginInfo(pluginName: string): import('../types/plugin.types').PluginInfo | undefined {
    const metadata = this.registry.getMetadata(pluginName);
    if (!metadata) {
      return undefined;
    }

    return {
      name: pluginName,
      state: metadata.state,
      loadedAt: metadata.loadedAt,
      activatedAt: metadata.activatedAt,
      manifest: metadata.manifest,
      hasComponent: !!metadata.componentRef,
      errorCount: metadata.errorCount || 0,
      lastError: metadata.error
    };
  }

  private handleError(pluginName: string, error: Error): void {
    const currentMetadata = this.registry.getMetadata(pluginName);
    const errorCount = (currentMetadata?.errorCount || 0) + 1;

    this.registry.updateMetadata(pluginName, {
      state: PluginState.ERROR,
      error,
      errorCount // v1.1.0: Enhancement #3 - Track error count
    });

    const onError = this.config?.lifecycleHooks?.onError;
    if (onError) {
      try {
        onError(pluginName, error);
      } catch {
        // Defensive: do not propagate error handler errors
      }
    }
  }

  // v1.1.0: Enhancement #2 - Debug logging helper (tree-shakeable, opt-in only)
  private debugLog(message: string, ...args: any[]): void {
    if (this.config?.enableDevMode && this.config?.debugOptions?.logLifecycleHooks) {
      console.log(`[PluginSystem] ${message}`, ...args);
    }
  }

  // v1.1.0: Enhancement #2 - Log state transitions
  private logStateTransition(pluginName: string, fromState: PluginState, toState: PluginState): void {
    if (this.config?.enableDevMode && this.config?.debugOptions?.logStateTransitions) {
      console.log(`[PluginSystem] Plugin '${pluginName}' → ${toState}`, { from: fromState, to: toState });
    }
  }

  // v1.1.0: Enhancement #2 - Validate plugin manifest in debug mode
  private validatePluginManifest(manifest: import('../types/plugin.types').PluginManifest, pluginName: string): void {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!manifest.name) {
      errors.push('Manifest missing required field: name');
    } else if (manifest.name !== pluginName) {
      warnings.push(`Manifest name '${manifest.name}' does not match plugin name '${pluginName}'`);
    }

    if (!manifest.version) {
      errors.push('Manifest missing required field: version');
    } else if (!/^\d+\.\d+\.\d+/.test(manifest.version)) {
      warnings.push(`Manifest version '${manifest.version}' does not follow semver format`);
    }

    if (!manifest.entryComponent) {
      errors.push('Manifest missing required field: entryComponent');
    }

    if (errors.length > 0) {
      const errorMessage = `Plugin '${pluginName}' manifest validation failed:\n${errors.join('\n')}`;
      console.error(`[PluginSystem] ${errorMessage}`);
      if (this.config?.debugOptions?.throwOnWarnings) {
        throw new Error(errorMessage);
      }
    }

    if (warnings.length > 0) {
      const warningMessage = `Plugin '${pluginName}' manifest validation warnings:\n${warnings.join('\n')}`;
      console.warn(`[PluginSystem] ${warningMessage}`);
      if (this.config?.debugOptions?.throwOnWarnings) {
        throw new Error(warningMessage);
      }
    }
  }
}
