import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { PluginSystemConfig, PLUGIN_SYSTEM_CONFIG } from '../types/registration.types';

export function providePluginSystem(config?: PluginSystemConfig): EnvironmentProviders {
  const defaultConfig: PluginSystemConfig = {
    globalTimeout: 30000,
    maxConcurrentLoads: 3,
    enableDevMode: false,
    lifecycleHooks: {},
    defaultAllowedServices: []
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
    ]
  };

  return makeEnvironmentProviders([
    {
      provide: PLUGIN_SYSTEM_CONFIG,
      useValue: mergedConfig
    }
  ]);
}
