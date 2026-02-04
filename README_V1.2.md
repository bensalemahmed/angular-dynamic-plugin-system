# Angular Dynamic Plugin System

[![npm version](https://img.shields.io/npm/v/@angular-dynamic/plugin-system.svg)](https://www.npmjs.com/package/@angular-dynamic/plugin-system)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Angular](https://img.shields.io/badge/Angular-16+-red.svg)](https://angular.io/)

**Production-ready, type-safe dynamic plugin system for Angular applications with remote loading, memory optimization, and real-time plugin management.**

## 🎯 Who Is This For?

This library is built for **enterprise-grade applications**:

✅ **SaaS Multi-Tenant Platforms** - Different features per customer tier
✅ **Plugin Marketplaces** - Users install extensions dynamically
✅ **Modular Applications** - Large apps with optional features
✅ **White-Label Solutions** - Customize features per client

❌ **NOT for**: Simple apps, static content sites, or prototypes

**⚠️ Important**: Remote loading executes external code. See [SECURITY.md](./SECURITY.md) for critical security practices.

---

## 🚀 What's New in v1.2.0

**Remote Plugin Loading** - Load plugins from external URLs at runtime!

```typescript
// Load plugin from CDN
await pluginManager.registerRemotePlugin({
  name: 'analytics',
  remoteUrl: 'https://cdn.yourapp.com/plugins/analytics.js',
  exposedModule: 'AnalyticsPlugin'
});

// Update plugin in real-time without page reload
await pluginManager.unregisterRemotePlugin('analytics');
await pluginManager.registerRemotePlugin({ /* new version */ });
```

**Key Features:**
- ✅ Load plugins from CDNs or remote servers
- ✅ True plugin unloading with DOM cleanup
- ✅ Hot reload plugins without app restart
- ✅ Perfect for SaaS multi-tenant applications
- ✅ Plugin marketplaces and dynamic distribution

[See full changelog](#changelog)

---

## 📖 Table of Contents

- [Why This Library?](#why-this-library)
- [Quick Start](#quick-start)
- [Core Features](#core-features)
- [Remote Plugin Loading](#remote-plugin-loading)
- [Memory Optimization](#memory-optimization)
- [API Reference](#api-reference)
- [Best Practices](#best-practices)
- [Examples](#examples)
- [Changelog](#changelog)

---

## Why This Library?

Modern Angular applications need dynamic feature loading for:

### SaaS Applications
```typescript
// FREE tier → No plugins loaded
// PRO tier → Load analytics plugin
// ENTERPRISE → Load analytics + reports + custom integrations
```

### Plugin Marketplaces
```typescript
// Users install plugins from your marketplace
// Plugins load from CDN on demand
// Update plugins without rebuilding your app
```

### Multi-Tenant Systems
```typescript
// Each tenant gets different features
// Features load dynamically based on permissions
// Reduced bundle size for all users
```

---

## Quick Start

### Installation

```bash
npm install @angular-dynamic/plugin-system
```

### Basic Setup (Local Plugins)

**1. Configure in app.config.ts:**

```typescript
import { providePluginSystem } from '@angular-dynamic/plugin-system';

export const appConfig: ApplicationConfig = {
  providers: [
    providePluginSystem({
      lifecycleHookTimeout: 5000,
      enableDevMode: true
    })
  ]
};
```

**2. Create a plugin:**

```typescript
import { Component } from '@angular/core';
import { PluginLifecycle, PluginContext } from '@angular-dynamic/plugin-system';

@Component({
  selector: 'analytics-plugin',
  standalone: true,
  template: `<div>Analytics Dashboard</div>`
})
export class AnalyticsPluginComponent implements PluginLifecycle {
  async onLoad(context: PluginContext): Promise<void> {
    console.log('Plugin loaded!');
  }
}
```

**3. Load the plugin:**

```typescript
import { Component, inject, ViewContainerRef, ViewChild } from '@angular/core';
import { PluginManager } from '@angular-dynamic/plugin-system';

@Component({
  selector: 'app-root',
  template: `<ng-container #pluginContainer></ng-container>`
})
export class AppComponent {
  pluginManager = inject(PluginManager);
  @ViewChild('pluginContainer', { read: ViewContainerRef }) container!: ViewContainerRef;

  async ngAfterViewInit() {
    // Register plugin
    this.pluginManager.register({
      name: 'analytics',
      loadFn: async () => {
        const module = await import('./plugins/analytics-plugin.component');
        return {
          PluginManifest: {
            name: 'analytics',
            version: '1.0.0',
            entryComponent: module.AnalyticsPluginComponent
          }
        };
      }
    });

    // Load and activate in one call
    await this.pluginManager.loadAndActivate('analytics', this.container);
  }
}
```

---

## Core Features

### ✨ Feature Highlights

| Feature | Description | Since |
|---------|-------------|-------|
| **Remote Loading** | Load plugins from external URLs | v1.2.0 |
| **Memory Optimization** | Complete cleanup on unload | v1.1.2 |
| **Lazy Loading** | Code splitting with dynamic imports | v1.0.0 |
| **Lifecycle Hooks** | onLoad, onActivate, onDeactivate, onDestroy | v1.0.0 |
| **Error Handling** | Defensive with detailed error types | v1.1.0 |
| **Debug Mode** | Granular logging for development | v1.1.0 |
| **Type Safety** | Full TypeScript support | v1.0.0 |
| **Isolated Execution** | Separate injector per plugin | v1.0.0 |

### 🔒 Safety & Stability

- **Timeout Protection**: Prevents infinite hangs in lifecycle hooks
- **Memory Leak Prevention**: Automatic cleanup of all references
- **Race Condition Protection**: Safe concurrent operations
- **Defensive Error Handling**: Plugin failures don't crash the host

---

## Remote Plugin Loading

### Basic Remote Loading

```typescript
import { PluginManager } from '@angular-dynamic/plugin-system';

// Load from CDN
await pluginManager.registerRemotePlugin({
  name: 'analytics',
  remoteUrl: 'https://cdn.yourapp.com/plugins/analytics.js',
  exposedModule: 'AnalyticsPlugin',
  timeout: 30000,
  retry: true,
  retryAttempts: 3
});

// Create component
await pluginManager.createPluginComponent('analytics', viewContainer);
```

### Hot Reload Plugin

```typescript
// Unload old version
await pluginManager.unregisterRemotePlugin('analytics');

// Load new version with cache-busting
await pluginManager.registerRemotePlugin({
  name: 'analytics',
  remoteUrl: `https://cdn.yourapp.com/plugins/analytics.js?v=${Date.now()}`,
  exposedModule: 'AnalyticsPlugin'
});
```

### Building Remote Plugins

**Create plugin file (analytics-plugin.js):**

```javascript
(function(global) {
  // Your Angular component
  class AnalyticsPluginComponent {
    async onLoad(context) {
      console.log('Analytics loaded!');
    }
  }

  // Expose globally
  global.AnalyticsPlugin = {
    PluginManifest: {
      name: 'analytics',
      version: '1.0.0',
      entryComponent: AnalyticsPluginComponent,
      displayName: 'Analytics Dashboard'
    }
  };
})(window);
```

**Host on CDN and load dynamically!**

📚 **[Full Remote Loading Guide](./REMOTE_LOADING.md)**

---

## Memory Optimization

### Automatic Cleanup

v1.1.2 introduces complete memory cleanup:

```typescript
// When you unload a plugin:
await pluginManager.unregister('analytics');

// The system automatically:
// ✅ Destroys Angular component
// ✅ Destroys dependency injector
// ✅ Clears module references
// ✅ Destroys plugin context
// ✅ Nullifies all references for GC
```

### Remote Plugin Cleanup

```typescript
// Unload remote plugin
await pluginManager.unregisterRemotePlugin('analytics');

// Additionally cleans up:
// ✅ Removes <script> tag from DOM
// ✅ Clears global variable
// ✅ Removes from cache
```

📚 **[Full Memory Optimization Guide](./MEMORY_OPTIMIZATION.md)**

---

## API Reference

### PluginManager

#### Core Methods

```typescript
// Register a plugin
pluginManager.register(registration: PluginRegistration): void

// Load a plugin
pluginManager.load(pluginName: string): Promise<PluginMetadata>

// Unregister a plugin
pluginManager.unregister(pluginName: string): Promise<void>

// Create plugin component
pluginManager.createPluginComponent(
  pluginName: string,
  viewContainer: ViewContainerRef
): Promise<ComponentRef>
```

#### Helper Methods (v1.2.0)

```typescript
// Load and activate in one call
pluginManager.loadAndActivate(
  pluginName: string,
  viewContainer: ViewContainerRef
): Promise<ComponentRef>

// Load remote plugin and activate
pluginManager.loadRemoteAndActivate(
  config: RemotePluginConfig,
  viewContainer: ViewContainerRef
): Promise<ComponentRef>
```

#### Remote Plugin Methods (v1.2.0)

```typescript
// Register and load remote plugin
pluginManager.registerRemotePlugin(
  config: RemotePluginConfig
): Promise<PluginMetadata>

// Unregister remote plugin with cleanup
pluginManager.unregisterRemotePlugin(
  pluginName: string
): Promise<void>

// Get cache statistics
pluginManager.getRemoteCacheStats(): {
  size: number;
  entries: Array<{ url: string; loadedAt: Date }>
}

// Clear cache
pluginManager.clearRemoteCache(): void
```

#### State Methods

```typescript
// Get plugin state
pluginManager.getPluginState(pluginName: string): PluginState | undefined

// Check if ready
pluginManager.isReady(pluginName: string): boolean

// Get metadata
pluginManager.getPluginMetadata(pluginName: string): PluginMetadata | undefined

// Get all plugins
pluginManager.getAllPlugins(): PluginMetadata[]
```

### Types

```typescript
interface RemotePluginConfig {
  name: string;
  remoteUrl: string;
  exposedModule: string;
  version?: string;
  timeout?: number;
  retry?: boolean;
  retryAttempts?: number;
  metadata?: Record<string, any>;
}

interface PluginRegistration {
  name: string;
  loadFn: () => Promise<LoadedPluginModule>;
  config?: {
    autoLoad?: boolean;
    timeout?: number;
    metadata?: Record<string, any>;
  };
}

enum PluginState {
  REGISTERED = 'REGISTERED',
  LOADING = 'LOADING',
  LOADED = 'LOADED',
  ACTIVE = 'ACTIVE',
  ERROR = 'ERROR',
  UNLOADING = 'UNLOADING'
}
```

---

## Best Practices

### 1. Use Dynamic Imports for Local Plugins

```typescript
// ✅ GOOD - Lazy loaded
loadFn: async () => await import('./my-plugin.component')

// ❌ BAD - Bundled with main app
import { MyPlugin } from './my-plugin.component';
loadFn: async () => MyPlugin
```

### 2. Implement Lifecycle Hooks

```typescript
class MyPlugin implements PluginLifecycle {
  private subscriptions: Subscription[] = [];

  async onLoad(context: PluginContext): Promise<void> {
    // Initialize plugin
  }

  async onDestroy(): Promise<void> {
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
```

### 3. Handle Errors Gracefully

```typescript
try {
  await pluginManager.load('analytics');
} catch (error) {
  if (error instanceof PluginLoadError) {
    console.error('Failed to load plugin:', error.message);
    // Show user-friendly message
  }
}
```

### 4. Use Debug Mode in Development

```typescript
providePluginSystem({
  enableDevMode: true,
  debugOptions: {
    logLifecycleHooks: true,
    logStateTransitions: true
  }
})
```

---

## Examples

### SaaS Tier-Based Loading

```typescript
async switchTier(tier: 'FREE' | 'PRO' | 'ENTERPRISE') {
  // Unload all current plugins
  await this.unloadAllPlugins();

  // Load plugins based on tier
  switch (tier) {
    case 'PRO':
      await this.pluginManager.loadAndActivate('analytics', this.container);
      break;

    case 'ENTERPRISE':
      await this.pluginManager.loadAndActivate('analytics', this.container);
      await this.pluginManager.loadAndActivate('reports', this.container);
      break;
  }
}
```

### Real-Time Plugin Updates

```typescript
// Listen for plugin updates via WebSocket
websocket.on('plugin-updated', async (pluginName, newVersion) => {
  // Unload old version
  await this.pluginManager.unregisterRemotePlugin(pluginName);

  // Load new version
  await this.pluginManager.registerRemotePlugin({
    name: pluginName,
    remoteUrl: `https://cdn.app.com/plugins/${pluginName}-${newVersion}.js`,
    exposedModule: `${pluginName}Plugin`
  });

  // Recreate component
  await this.pluginManager.createPluginComponent(pluginName, this.container);
});
```

### Plugin Marketplace

```typescript
async installPlugin(pluginId: string) {
  // Fetch plugin info from marketplace
  const plugin = await this.api.getPluginInfo(pluginId);

  // Load from marketplace CDN
  await this.pluginManager.registerRemotePlugin({
    name: plugin.name,
    remoteUrl: plugin.cdnUrl,
    exposedModule: plugin.moduleName,
    version: plugin.version
  });

  // Save to user's installed plugins
  await this.api.saveInstalled(pluginId);
}
```

---

## Changelog

### [1.2.0] - 2026-02-04
**Remote Plugin Loading**
- Load plugins from external URLs
- Hot reload plugins without page refresh
- Script tag injection and cleanup
- Cache management
- Helper methods: `loadAndActivate()`, `loadRemoteAndActivate()`

### [1.1.2] - 2026-02-04
**Memory Optimization**
- Complete memory cleanup on unload
- Injector destruction
- Reference nullification
- Context cleanup

### [1.1.1] - 2026-02-03
**AOT Compilation Fix**
- Fixed JIT compiler error
- Proper Angular metadata
- ng-packagr build process

### [1.1.0] - 2026-02-04
**Stability & Safety**
- Lifecycle hook timeout protection
- Memory leak fixes
- Race condition protection
- Enhanced debug mode

### [1.0.0] - 2026-02-03
**Initial Release**
- Core plugin system
- Lifecycle management
- Dynamic loading
- Type safety

[Full Changelog](./CHANGELOG.md)

---

## Documentation

- **[Remote Loading Guide](./REMOTE_LOADING.md)** - Complete guide to remote plugin loading
- **[Memory Optimization](./MEMORY_OPTIMIZATION.md)** - Memory management best practices
- **[Changelog](./CHANGELOG.md)** - Detailed version history

---

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

---

## License

MIT License - see [LICENSE](./LICENSE) file for details

---

## Roadmap

### v1.x Focus (Current)
✅ Stability and reliability
✅ Memory optimization
✅ Remote loading
✅ Production-grade DX

### v2.x Vision (Future)
These are **intentionally NOT in v1.x** to keep the library focused:

- 🔮 Plugin dependency resolution
- 🔮 Permissions & sandboxing (iframe isolation)
- 🔮 Router integration
- 🔮 Backend configuration service
- 🔮 Version compatibility checking

**Philosophy**: v1.x does one thing extremely well. v2.x will expand thoughtfully.

---

## Support

- **Issues**: [GitHub Issues](https://github.com/bensalemahmed/angular-dynamic-plugin-system/issues)
- **Security**: [SECURITY.md](./SECURITY.md) - **Read before using remote loading**
- **Documentation**: See guides in repo root
- **Examples**: See demo app

---

**Made with ❤️ for the Angular community**
