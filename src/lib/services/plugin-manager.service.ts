import { Injectable, Injector, Inject, Optional, ComponentRef, ViewContainerRef } from '@angular/core';
import { Observable, filter, map } from 'rxjs';
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
  PluginLifecycleError
} from '../types/errors.types';
import { PluginRegistry } from './plugin-registry.service';
import { PluginContextImpl } from '../utils/plugin-context.impl';
import { createPluginInjector } from '../utils/plugin-injector.factory';
import { PluginLifecycle } from '../types/lifecycle.types';

@Injectable({ providedIn: 'root' })
export class PluginManager {
  private readonly loadingPromises = new Map<string, Promise<PluginMetadata>>();

  readonly pluginState$: Observable<PluginStateEvent>;

  constructor(
    private readonly registry: PluginRegistry,
    private readonly injector: Injector,
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
    const entry = this.registry.get(pluginName);
    if (!entry) {
      throw new PluginNotFoundError(pluginName);
    }

    const metadata = entry.metadata;

    if (metadata.state === PluginState.LOADING) {
      throw new PluginStateError(pluginName, 'not LOADING', metadata.state);
    }

    try {
      this.registry.updateMetadata(pluginName, { state: PluginState.UNLOADING });

      await this.callLifecycleHook(pluginName, 'beforeUnload');

      if (metadata.componentRef) {
        await this.destroyComponent(metadata.componentRef, pluginName);
      }

      await this.callLifecycleHook(pluginName, 'afterUnload');

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

  async createPluginComponent(
    pluginName: string,
    viewContainer: ViewContainerRef
  ): Promise<ComponentRef<PluginLifecycle>> {
    const metadata = this.registry.getMetadata(pluginName);
    if (!metadata) {
      throw new PluginNotFoundError(pluginName);
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
      const componentRef = viewContainer.createComponent(
        metadata.manifest.entryComponent,
        { injector }
      );

      this.registry.updateMetadata(pluginName, {
        componentRef,
        state: PluginState.ACTIVE
      });

      if (componentRef.instance.onActivate) {
        await componentRef.instance.onActivate(context);
      }

      return componentRef;
    } catch (error) {
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
      this.registry.updateMetadata(pluginName, {
        state: PluginState.LOADING,
        error: undefined
      });

      await this.callLifecycleHook(pluginName, 'beforeLoad');

      const module = await this.loadPluginModule(registration, pluginName);

      this.registry.setManifest(pluginName, module.PluginManifest);

      const context = this.createPluginContext(pluginName, registration);
      this.registry.setContext(pluginName, context);

      const pluginInjector = createPluginInjector({
        parent: this.injector,
        context,
        providers: []
      });

      this.registry.setInjector(pluginName, pluginInjector);

      const instance = new module.PluginManifest.entryComponent();
      if (instance.onLoad) {
        await instance.onLoad(context);
      }

      this.registry.updateMetadata(pluginName, {
        state: PluginState.LOADED,
        loadedAt: new Date()
      });

      await this.callLifecycleHook(pluginName, 'afterLoad');

      return this.registry.getMetadata(pluginName)!;
    } catch (error) {
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
        await componentRef.instance.onDeactivate();
      }

      if (componentRef.instance.onDestroy) {
        await componentRef.instance.onDestroy();
      }

      componentRef.destroy();
    } catch (error) {
      throw new PluginLifecycleError(pluginName, 'onDestroy', error as Error);
    }
  }

  private async callLifecycleHook(
    pluginName: string,
    hook: keyof Required<PluginSystemConfig>['lifecycleHooks']
  ): Promise<void> {
    const hookFn = this.config?.lifecycleHooks?.[hook];
    if (hookFn) {
      try {
        await hookFn(pluginName);
      } catch (error) {
        if (this.config?.enableDevMode) {
          throw error;
        }
      }
    }
  }

  private handleError(pluginName: string, error: Error): void {
    this.registry.updateMetadata(pluginName, {
      state: PluginState.ERROR,
      error
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
}
