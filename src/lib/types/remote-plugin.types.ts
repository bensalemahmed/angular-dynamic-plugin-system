/**
 * Types for remote plugin loading support
 * v1.2.0: Remote plugin loading from external URLs
 */

export interface RemotePluginConfig {
  /**
   * Unique name for the remote plugin
   */
  name: string;

  /**
   * URL to the remote plugin bundle
   * Example: 'https://cdn.example.com/plugins/analytics.js'
   */
  remoteUrl: string;

  /**
   * Name of the global variable exposed by the remote plugin
   * Example: 'AnalyticsPlugin'
   */
  exposedModule: string;

  /**
   * Version of the remote plugin (optional)
   */
  version?: string;

  /**
   * Timeout for loading the remote script (ms)
   * Default: 30000 (30 seconds)
   */
  timeout?: number;

  /**
   * Enable retry on failure
   * Default: true
   */
  retry?: boolean;

  /**
   * Number of retry attempts
   * Default: 3
   */
  retryAttempts?: number;

  /**
   * Custom metadata for the remote plugin
   */
  metadata?: Record<string, any>;
}

export interface RemotePluginLoadResult {
  /**
   * The loaded module from the remote URL
   */
  module: any;

  /**
   * Time taken to load (ms)
   */
  loadTime: number;

  /**
   * Whether the plugin was loaded from cache
   */
  fromCache: boolean;
}

export interface RemotePluginError extends Error {
  code: 'TIMEOUT' | 'NETWORK_ERROR' | 'MODULE_NOT_FOUND' | 'INVALID_MODULE';
  url: string;
  pluginName: string;
}

/**
 * Cache entry for loaded remote scripts
 */
export interface RemotePluginCacheEntry {
  url: string;
  module: any;
  loadedAt: Date;
  scriptElement: HTMLScriptElement;
}
