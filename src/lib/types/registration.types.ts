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

// v1.1.0: Enhancement #2 - Debug mode options
export interface PluginDebugOptions {
  logLifecycleHooks?: boolean;
  logStateTransitions?: boolean;
  validateManifests?: boolean;
  throwOnWarnings?: boolean;
}

export interface PluginSystemConfig {
  globalTimeout?: number;
  maxConcurrentLoads?: number;
  enableDevMode?: boolean;
  lifecycleHooks?: PluginLifecycleHooks;
  defaultAllowedServices?: Array<InjectionToken<any> | Type<any>>;
  lifecycleHookTimeout?: number; // v1.1.0: Fix #1 - Default: 5000ms
  debugOptions?: PluginDebugOptions; // v1.1.0: Enhancement #2 - Debug mode enhancements
}

export const PLUGIN_SYSTEM_CONFIG = new InjectionToken<PluginSystemConfig>(
  'PLUGIN_SYSTEM_CONFIG'
);
