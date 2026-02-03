import { ApplicationConfig } from '@angular/core';
import { providePluginSystem } from '@angular-dynamic/plugin-system';

export const appConfig: ApplicationConfig = {
  providers: [
    providePluginSystem({
      globalTimeout: 30000,
      maxConcurrentLoads: 3,
      enableDevMode: true,
      lifecycleHooks: {
        beforeLoad: async (pluginName) => {
          // Pre-load initialization
        },
        afterLoad: async (pluginName) => {
          // Post-load operations
        },
        beforeUnload: async (pluginName) => {
          // Pre-unload cleanup
        },
        afterUnload: async (pluginName) => {
          // Post-unload cleanup
        },
        onError: (pluginName, error) => {
          // Global error handling
        }
      },
      defaultAllowedServices: []
    })
  ]
};
