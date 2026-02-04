import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { PluginSystemConfig, PLUGIN_SYSTEM_CONFIG } from '../types/registration.types';

export function providePluginSystem(config?: PluginSystemConfig): EnvironmentProviders {
  const defaultConfig: PluginSystemConfig = {
    globalTimeout: 30000,
    maxConcurrentLoads: 3,
    enableDevMode: false,
    lifecycleHooks: {},
    defaultAllowedServices: [],
    lifecycleHookTimeout: 5000, // v1.1.0: Fix #1 - 5 second default timeout
    // v1.1.0: Enhancement #2 - Debug options (all opt-in, no logging by default)
    debugOptions: {
      logLifecycleHooks: false,
      logStateTransitions: false,
      validateManifests: false,
      throwOnWarnings: false
    }
  };

  const mergedConfig: PluginSystemConfig = {
    ...defaultConfig,
    ...config,
    lifecycleHooks: {
      ...defaultConfig.lifecycleHooks,
      ...config?.lifecycleHooks
    },
    defaultAllowedServices: [
      ...(defaultConfig.defaultAllowedServices || []),
      ...(config?.defaultAllowedServices || [])
    ],
    // v1.1.0: Enhancement #2 - Merge debug options
    debugOptions: {
      ...defaultConfig.debugOptions,
      ...config?.debugOptions
    }
  };

  return makeEnvironmentProviders([
    {
      provide: PLUGIN_SYSTEM_CONFIG,
      useValue: mergedConfig
    }
  ]);
}
