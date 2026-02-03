import { PluginContext } from './context.types';

export interface PluginLifecycle {
  onLoad?(context: PluginContext): void | Promise<void>;
  onActivate?(context: PluginContext): void | Promise<void>;
  onDeactivate?(): void | Promise<void>;
  onDestroy?(): void | Promise<void>;
}

export interface PluginLifecycleHooks {
  beforeLoad?: (pluginName: string) => void | Promise<void>;
  afterLoad?: (pluginName: string) => void | Promise<void>;
  beforeUnload?: (pluginName: string) => void | Promise<void>;
  afterUnload?: (pluginName: string) => void | Promise<void>;
  onError?: (pluginName: string, error: Error) => void;
}
