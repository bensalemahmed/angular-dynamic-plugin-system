import { Injector, InjectionToken } from '@angular/core';

export interface PluginContext {
  readonly pluginName: string;
  readonly hostInjector: Injector;
  getService<T>(token: InjectionToken<T> | Type<T>): T | null;
  emit(eventName: string, data?: any): void;
  subscribe(eventName: string, handler: (data: any) => void): () => void;
}

export interface PluginContextConfig {
  pluginName: string;
  hostInjector: Injector;
  allowedServices?: Array<InjectionToken<any> | Type<any>>;
}

type Type<T> = new (...args: any[]) => T;
