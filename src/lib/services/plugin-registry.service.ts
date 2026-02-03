import { Injectable, EnvironmentInjector } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  PluginMetadata,
  PluginState,
  PluginStateEvent,
  PluginManifest
} from '../types/plugin.types';
import { PluginRegistration } from '../types/registration.types';
import { PluginAlreadyRegisteredError, PluginNotFoundError } from '../types/errors.types';
import { PluginContextImpl } from '../utils/plugin-context.impl';

interface RegistryEntry {
  registration: PluginRegistration;
  metadata: PluginMetadata;
  injector?: EnvironmentInjector;
  context?: PluginContextImpl;
}

@Injectable({ providedIn: 'root' })
export class PluginRegistry {
  private readonly registry = new Map<string, RegistryEntry>();
  private readonly stateSubject = new BehaviorSubject<PluginStateEvent | null>(null);

  readonly state$: Observable<PluginStateEvent | null> = this.stateSubject.asObservable();

  register(registration: PluginRegistration): void {
    if (this.registry.has(registration.name)) {
      throw new PluginAlreadyRegisteredError(registration.name);
    }

    const metadata: PluginMetadata = {
      manifest: {
        name: registration.name,
        version: '0.0.0',
        entryComponent: null as any
      },
      state: PluginState.REGISTERED
    };

    this.registry.set(registration.name, {
      registration,
      metadata
    });

    this.emitStateChange(registration.name, PluginState.REGISTERED);
  }

  unregister(name: string): void {
    const entry = this.registry.get(name);
    if (!entry) {
      throw new PluginNotFoundError(name);
    }

    if (entry.context) {
      entry.context.destroy();
    }

    if (entry.injector) {
      try {
        entry.injector.destroy();
      } catch {
        // Defensive: ignore injector destruction errors
      }
    }

    this.registry.delete(name);
    this.emitStateChange(name, PluginState.UNLOADED);
  }

  has(name: string): boolean {
    return this.registry.has(name);
  }

  get(name: string): RegistryEntry | undefined {
    return this.registry.get(name);
  }

  getMetadata(name: string): PluginMetadata | undefined {
    return this.registry.get(name)?.metadata;
  }

  updateMetadata(name: string, updates: Partial<PluginMetadata>): void {
    const entry = this.registry.get(name);
    if (!entry) {
      throw new PluginNotFoundError(name);
    }

    entry.metadata = { ...entry.metadata, ...updates };

    if (updates.state) {
      this.emitStateChange(name, updates.state, updates.error);
    }
  }

  setManifest(name: string, manifest: PluginManifest): void {
    const entry = this.registry.get(name);
    if (!entry) {
      throw new PluginNotFoundError(name);
    }

    entry.metadata.manifest = manifest;
  }

  setInjector(name: string, injector: EnvironmentInjector): void {
    const entry = this.registry.get(name);
    if (!entry) {
      throw new PluginNotFoundError(name);
    }

    entry.injector = injector;
  }

  getInjector(name: string): EnvironmentInjector | undefined {
    return this.registry.get(name)?.injector;
  }

  setContext(name: string, context: PluginContextImpl): void {
    const entry = this.registry.get(name);
    if (!entry) {
      throw new PluginNotFoundError(name);
    }

    entry.context = context;
  }

  getContext(name: string): PluginContextImpl | undefined {
    return this.registry.get(name)?.context;
  }

  getAllMetadata(): PluginMetadata[] {
    return Array.from(this.registry.values()).map(entry => entry.metadata);
  }

  getPluginsByState(state: PluginState): PluginMetadata[] {
    return Array.from(this.registry.values())
      .filter(entry => entry.metadata.state === state)
      .map(entry => entry.metadata);
  }

  clear(): void {
    const entries = Array.from(this.registry.values());

    for (const entry of entries) {
      if (entry.context) {
        entry.context.destroy();
      }

      if (entry.injector) {
        try {
          entry.injector.destroy();
        } catch {
          // Defensive: ignore injector destruction errors
        }
      }
    }

    this.registry.clear();
  }

  private emitStateChange(pluginName: string, state: PluginState, error?: Error): void {
    this.stateSubject.next({
      pluginName,
      state,
      timestamp: new Date(),
      error
    });
  }
}
