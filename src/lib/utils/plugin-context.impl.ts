import { Injector, InjectionToken, Type } from '@angular/core';
import { PluginContext, PluginContextConfig } from '../types/context.types';

export class PluginContextImpl implements PluginContext {
  readonly pluginName: string;
  readonly hostInjector: Injector;
  private readonly allowedServices: Set<InjectionToken<any> | Type<any>>;
  private readonly eventHandlers: Map<string, Set<(data: any) => void>>;

  constructor(config: PluginContextConfig) {
    this.pluginName = config.pluginName;
    this.hostInjector = config.hostInjector;
    this.allowedServices = new Set(config.allowedServices || []);
    this.eventHandlers = new Map();
  }

  getService<T>(token: InjectionToken<T> | Type<T>): T | null {
    if (this.allowedServices.size > 0 && !this.allowedServices.has(token)) {
      return null;
    }

    try {
      return this.hostInjector.get(token, null);
    } catch {
      return null;
    }
  }

  emit(eventName: string, data?: any): void {
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          // Defensive: do not propagate plugin handler errors
        }
      });
    }
  }

  subscribe(eventName: string, handler: (data: any) => void): () => void {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, new Set());
    }

    const handlers = this.eventHandlers.get(eventName)!;
    handlers.add(handler);

    return () => {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.eventHandlers.delete(eventName);
      }
    };
  }

  destroy(): void {
    this.eventHandlers.clear();
  }
}
