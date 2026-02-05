import { Type } from '@angular/core';
import { PluginLifecycle } from './lifecycle.types';

export interface PluginManifest {
  name: string;
  version: string;
  entryComponent: Type<PluginLifecycle>;
  /** Optional NgModule to bootstrap with the plugin (v1.4.0) */
  entryModule?: Type<any>;
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
  activatedAt?: Date; // v1.1.0: Enhancement #3 - Track activation time
  error?: Error;
  errorCount?: number; // v1.1.0: Enhancement #3 - Track error history
  componentRef?: any;
  isCreatingComponent?: boolean; // v1.1.0: Fix #3 - Race condition protection
  moduleReference?: any; // v1.1.1: Memory optimization - Track loaded module for cleanup
  ngModuleRef?: any; // v1.4.0: Track NgModuleRef for plugins with entryModule
  injectorReference?: any; // v1.1.1: Memory optimization - Track injector for proper cleanup
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

// v1.1.0: Enhancement #3 - Plugin metadata inspection
export interface PluginInfo {
  name: string;
  state: PluginState;
  loadedAt?: Date;
  activatedAt?: Date;
  manifest?: PluginManifest;
  hasComponent: boolean;
  errorCount: number;
  lastError?: Error;
}
