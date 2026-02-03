import {
  Injector,
  EnvironmentInjector,
  createEnvironmentInjector,
  Provider,
  InjectionToken
} from '@angular/core';
import { PluginContext } from '../types/context.types';

export const PLUGIN_CONTEXT = new InjectionToken<PluginContext>('PLUGIN_CONTEXT');

export interface PluginInjectorConfig {
  parent: Injector;
  context: PluginContext;
  providers?: Provider[];
}

export function createPluginInjector(config: PluginInjectorConfig): EnvironmentInjector {
  const providers: Provider[] = [
    {
      provide: PLUGIN_CONTEXT,
      useValue: config.context
    },
    ...(config.providers || [])
  ];

  return createEnvironmentInjector(providers, config.parent);
}

export function destroyPluginInjector(injector: EnvironmentInjector): void {
  try {
    injector.destroy();
  } catch (error) {
    // Defensive: do not propagate injector destruction errors
  }
}
