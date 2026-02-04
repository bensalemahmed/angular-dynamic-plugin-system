import { Injectable } from '@angular/core';
import {
  RemotePluginConfig,
  RemotePluginLoadResult,
  RemotePluginError,
  RemotePluginCacheEntry
} from '../types/remote-plugin.types';

/**
 * Service for loading plugins from remote URLs
 * v1.2.0: Enables true dynamic plugin loading from external sources
 */
@Injectable({ providedIn: 'root' })
export class RemotePluginLoader {
  private readonly cache = new Map<string, RemotePluginCacheEntry>();
  private readonly loadingPromises = new Map<string, Promise<RemotePluginLoadResult>>();

  /**
   * Load a plugin from a remote URL
   */
  async loadRemotePlugin(config: RemotePluginConfig): Promise<RemotePluginLoadResult> {
    // Check if already loading
    const existingPromise = this.loadingPromises.get(config.name);
    if (existingPromise) {
      return existingPromise;
    }

    // Check cache first
    const cached = this.cache.get(config.remoteUrl);
    if (cached) {
      return {
        module: cached.module,
        loadTime: 0,
        fromCache: true
      };
    }

    // Start loading
    const loadPromise = this.executeLoad(config);
    this.loadingPromises.set(config.name, loadPromise);

    try {
      const result = await loadPromise;
      return result;
    } finally {
      this.loadingPromises.delete(config.name);
    }
  }

  /**
   * Unload a remote plugin and clean up resources
   */
  unloadRemotePlugin(urlOrName: string): void {
    // Find by URL or name
    let entry: RemotePluginCacheEntry | undefined;

    if (urlOrName.startsWith('http://') || urlOrName.startsWith('https://')) {
      entry = this.cache.get(urlOrName);
    } else {
      // Search by plugin name in cache
      for (const [url, cacheEntry] of this.cache.entries()) {
        if (url.includes(urlOrName)) {
          entry = cacheEntry;
          break;
        }
      }
    }

    if (!entry) {
      return;
    }

    // Remove script element from DOM
    if (entry.scriptElement && entry.scriptElement.parentNode) {
      entry.scriptElement.parentNode.removeChild(entry.scriptElement);
    }

    // Clear from cache
    this.cache.delete(entry.url);

    // Try to delete the global variable (best effort)
    const globalVar = this.extractGlobalVarName(entry.url);
    if (globalVar && (window as any)[globalVar]) {
      try {
        delete (window as any)[globalVar];
      } catch (error) {
        // Some properties might not be configurable
        console.warn(`Could not delete global variable: ${globalVar}`);
      }
    }
  }

  /**
   * Clear all cached remote plugins
   */
  clearCache(): void {
    for (const [url] of this.cache.entries()) {
      this.unloadRemotePlugin(url);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: Array<{ url: string; loadedAt: Date }> } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([url, entry]) => ({
        url,
        loadedAt: entry.loadedAt
      }))
    };
  }

  private async executeLoad(config: RemotePluginConfig): Promise<RemotePluginLoadResult> {
    const startTime = Date.now();
    const timeout = config.timeout || 30000;
    const retryAttempts = config.retryAttempts ?? 3;
    const shouldRetry = config.retry ?? true;

    let lastError: Error | null = null;
    let attempts = 0;

    while (attempts < (shouldRetry ? retryAttempts : 1)) {
      attempts++;

      try {
        const module = await this.loadScript(
          config.remoteUrl,
          config.exposedModule,
          timeout
        );

        const loadTime = Date.now() - startTime;

        // Cache the result
        const scriptElement = document.querySelector(
          `script[src="${config.remoteUrl}"]`
        ) as HTMLScriptElement;

        if (scriptElement) {
          this.cache.set(config.remoteUrl, {
            url: config.remoteUrl,
            module,
            loadedAt: new Date(),
            scriptElement
          });
        }

        return {
          module,
          loadTime,
          fromCache: false
        };
      } catch (error) {
        lastError = error as Error;

        if (attempts < retryAttempts && shouldRetry) {
          // Wait before retry (exponential backoff)
          await this.delay(Math.min(1000 * Math.pow(2, attempts - 1), 5000));
        }
      }
    }

    // All attempts failed
    const pluginError: RemotePluginError = Object.assign(
      new Error(`Failed to load remote plugin '${config.name}' after ${attempts} attempts: ${lastError?.message}`),
      {
        code: this.classifyError(lastError!),
        url: config.remoteUrl,
        pluginName: config.name
      }
    );

    throw pluginError;
  }

  private loadScript(url: string, exposedModule: string, timeout: number): Promise<any> {
    return new Promise((resolve, reject) => {
      // Check if script already exists
      const existing = document.querySelector(`script[src="${url}"]`);
      if (existing) {
        // Script already loaded, try to get the module
        const module = this.getModuleFromWindow(exposedModule);
        if (module) {
          resolve(module);
          return;
        }
      }

      const script = document.createElement('script');
      script.src = url;
      script.type = 'text/javascript';
      script.async = true;

      let timeoutId: any;
      let resolved = false;

      const cleanup = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        script.removeEventListener('load', onLoad);
        script.removeEventListener('error', onError);
      };

      const onLoad = () => {
        if (resolved) return;
        resolved = true;
        cleanup();

        // Try to get the exposed module from window
        const module = this.getModuleFromWindow(exposedModule);

        if (!module) {
          reject(new Error(`Module '${exposedModule}' not found in window after loading ${url}`));
          return;
        }

        resolve(module);
      };

      const onError = (error: any) => {
        if (resolved) return;
        resolved = true;
        cleanup();

        // Remove failed script
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }

        reject(new Error(`Failed to load script from ${url}: ${error?.message || 'Network error'}`));
      };

      // Set timeout
      timeoutId = setTimeout(() => {
        if (resolved) return;
        resolved = true;
        cleanup();

        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }

        reject(new Error(`Timeout loading script from ${url}`));
      }, timeout);

      script.addEventListener('load', onLoad);
      script.addEventListener('error', onError);

      document.head.appendChild(script);
    });
  }

  private getModuleFromWindow(moduleName: string): any {
    // Support nested paths like 'MyApp.Plugins.Analytics'
    const parts = moduleName.split('.');
    let obj: any = window;

    for (const part of parts) {
      obj = obj?.[part];
      if (obj === undefined) {
        return null;
      }
    }

    return obj;
  }

  private extractGlobalVarName(url: string): string | null {
    // Try to extract variable name from URL
    // This is a best-effort heuristic
    const match = url.match(/\/([^/]+)\.(js|mjs)$/);
    return match ? match[1] : null;
  }

  private classifyError(error: Error): RemotePluginError['code'] {
    const message = error.message.toLowerCase();

    if (message.includes('timeout')) {
      return 'TIMEOUT';
    }
    if (message.includes('not found')) {
      return 'MODULE_NOT_FOUND';
    }
    if (message.includes('network') || message.includes('failed to load')) {
      return 'NETWORK_ERROR';
    }

    return 'INVALID_MODULE';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
