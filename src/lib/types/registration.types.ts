import { InjectionToken, Type } from '@angular/core';
import { LoadedPluginModule } from './plugin.types';
import { PluginLifecycleHooks } from './lifecycle.types';

export interface PluginRegistration {
  name: string;
  loadFn: () => Promise<LoadedPluginModule>;
  config?: PluginConfig;
}

export interface PluginConfig {
  autoLoad?: boolean;
  retryOnError?: boolean;
  maxRetries?: number;
  timeout?: number;
  allowedServices?: Array<InjectionToken<any> | Type<any>>;
  metadata?: Record<string, any>;
}

export interface PluginSystemConfig {
  globalTimeout?: number;
  maxConcurrentLoads?: number;
  enableDevMode?: boolean;
  lifecycleHooks?: PluginLifecycleHooks;
  defaultAllowedServices?: Array<InjectionToken<any> | Type<any>>;
}

export const PLUGIN_SYSTEM_CONFIG = new InjectionToken<PluginSystemConfig>(
  'PLUGIN_SYSTEM_CONFIG'
);
