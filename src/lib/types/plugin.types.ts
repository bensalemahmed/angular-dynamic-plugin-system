import { Type } from '@angular/core';
import { PluginLifecycle } from './lifecycle.types';

export interface PluginManifest {
  name: string;
  version: string;
  entryComponent: Type<PluginLifecycle>;
  displayName?: string;
  description?: string;
  author?: string;
  dependencies?: Record<string, string>;
}

export enum PluginState {
  REGISTERED = 'REGISTERED',
  LOADING = 'LOADING',
  LOADED = 'LOADED',
  ACTIVE = 'ACTIVE',
  ERROR = 'ERROR',
  UNLOADING = 'UNLOADING',
  UNLOADED = 'UNLOADED'
}

export interface PluginMetadata {
  manifest: PluginManifest;
  state: PluginState;
  loadedAt?: Date;
  error?: Error;
  componentRef?: any;
}

export interface PluginStateEvent {
  pluginName: string;
  state: PluginState;
  timestamp: Date;
  error?: Error;
}

export interface LoadedPluginModule {
  PluginManifest: PluginManifest;
}
