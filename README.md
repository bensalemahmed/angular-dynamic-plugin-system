# Angular Dynamic Plugin System

[![npm version](https://img.shields.io/npm/v/@angular-dynamic/plugin-system.svg)](https://www.npmjs.com/package/@angular-dynamic/plugin-system)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/angular-dynamic/plugin-system)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Angular](https://img.shields.io/badge/Angular-16+-red.svg)](https://angular.io/)

A production-ready, type-safe plugin system for Angular 16+ applications that enables runtime loading, isolated execution, and lifecycle management of plugins.

## What's New in v1.2.0

**Remote Plugin Loading** - Load plugins from external URLs at runtime!

```typescript
// Load plugin from CDN
await pluginManager.registerRemotePlugin({
  name: 'analytics',
  remoteUrl: 'https://cdn.yourapp.com/plugins/analytics.js',
  exposedModule: 'AnalyticsPlugin'
});

// Hot reload - update plugin without page refresh
await pluginManager.unregisterRemotePlugin('analytics');
await pluginManager.registerRemotePlugin({ /* new version */ });
```

**Key Features:**
- ✅ Load plugins from CDNs or remote servers
- ✅ True plugin unloading with script tag removal
- ✅ Hot reload plugins without app restart
- ✅ Cache management and statistics
- ✅ Helper methods: `loadAndActivate()`, `loadRemoteAndActivate()`
- ✅ Perfect for SaaS multi-tenant and plugin marketplaces

**Previous Releases:**
- v1.1.2: Memory optimization with complete cleanup
- v1.1.0: Critical stability fixes (timeouts, race conditions, memory leaks)

**No Migration Required:** Fully backward compatible with v1.1.x

## What Problem Does This Solve?

Modern Angular applications, especially SaaS platforms, multi-tenant systems, and extensible applications, often need to:

- Load features dynamically at runtime without rebuilding the application
- Enable/disable functionality for specific users or tenants
- Support third-party extensions and plugins
- Reduce initial bundle size by lazy-loading optional features
- Provide isolated execution environments for untrusted code

This library provides a **standard, production-ready solution** for dynamic plugin architecture in Angular applications.

## Features

### Core Capabilities
- Runtime plugin loading via dynamic imports
- Isolated injector per plugin for dependency isolation
- Type-safe plugin lifecycle hooks
- Defensive error handling (plugin failures don't crash host)
- Observable-based state management
- Concurrent plugin loading with configurable limits
- Timeout support with automatic cleanup
- Compatible with standalone components
- TypeScript strict mode compliant

### Remote Loading (v1.2.0)
- **Remote plugin loading**: Load from CDN, remote servers, or any HTTPS URL
- **Hot reload support**: Update plugins without page refresh
- **Script tag management**: Automatic injection and cleanup
- **Cache control**: Built-in caching with statistics and manual cache clearing
- **Helper methods**: `loadAndActivate()`, `loadRemoteAndActivate()` for common patterns

### Stability & Safety
- **Lifecycle hook timeout protection**: Prevents infinite hangs (default: 5s)
- **Memory leak prevention**: Complete cleanup including script tags and references
- **Race condition protection**: Safe concurrent operations on plugin lifecycle
- **Enhanced error handling**: Actionable error messages with troubleshooting guidance
- **Debug mode**: Granular logging for development and troubleshooting

## Installation

```bash
npm install @angular-dynamic/plugin-system
```

## Quick Start

### 1. Configure the Plugin System

```typescript
import { ApplicationConfig } from '@angular/core';
import { providePluginSystem } from '@angular-dynamic/plugin-system';

export const appConfig: ApplicationConfig = {
  providers: [
    providePluginSystem({
      globalTimeout: 30000,
      maxConcurrentLoads: 3,
      enableDevMode: false,
      // v1.1.0: Lifecycle hook timeout protection
      lifecycleHookTimeout: 5000 // Default: 5000ms, set to 0 to disable
    })
  ]
};
```

### 2. Create a Plugin

```typescript
import { Component } from '@angular/core';
import { PluginLifecycle, PluginContext } from '@angular-dynamic/plugin-system';

@Component({
  selector: 'invoice-plugin',
  standalone: true,
  template: `<h1>Invoice Plugin</h1>`
})
export class InvoicePluginComponent implements PluginLifecycle {
  async onLoad(context: PluginContext): Promise<void> {
    // Plugin initialization logic
  }

  async onActivate(context: PluginContext): Promise<void> {
    // Called when plugin is rendered
  }

  async onDeactivate(): Promise<void> {
    // Called before plugin is removed
  }

  async onDestroy(): Promise<void> {
    // Cleanup logic
  }
}

export const PluginManifest = {
  name: 'invoice',
  version: '1.0.0',
  entryComponent: InvoicePluginComponent,
  displayName: 'Invoice Plugin',
  description: 'Handles invoice management'
};
```

### 3. Register and Load Plugins

```typescript
import { Component, OnInit } from '@angular/core';
import { PluginManager } from '@angular-dynamic/plugin-system';

@Component({
  selector: 'app-root',
  template: `
    <plugin-outlet [plugin]="'invoice'"></plugin-outlet>
  `,
  standalone: true,
  imports: [PluginOutletComponent]
})
export class AppComponent implements OnInit {
  constructor(private pluginManager: PluginManager) {}

  ngOnInit(): void {
    this.pluginManager.register({
      name: 'invoice',
      loadFn: () => import('./plugins/invoice-plugin'),
      config: {
        autoLoad: true
      }
    });
  }
}
```

### 4. Use Plugin Outlet

```html
<plugin-outlet [plugin]="'invoice'"></plugin-outlet>
```

## API Reference

### PluginManager

Main orchestrator for plugin lifecycle management.

```typescript
@Injectable({ providedIn: 'root' })
export class PluginManager {
  // Core Methods
  register(config: PluginRegistration): void;
  load(pluginName: string): Promise<PluginMetadata>;
  loadMany(pluginNames: string[]): Promise<PluginMetadata[]>;
  unregister(pluginName: string): Promise<void>;
  getPluginState(pluginName: string): PluginState | undefined;
  isReady(pluginName: string): boolean;

  // v1.2.0: Remote Loading
  registerRemotePlugin(config: RemotePluginConfig): Promise<PluginMetadata>;
  unregisterRemotePlugin(pluginName: string): Promise<void>;
  getRemoteCacheStats(): { size: number; entries: Array<{url: string; loadedAt: Date}> };
  clearRemoteCache(): void;

  // v1.2.0: Helper Methods
  loadAndActivate(pluginName: string, viewContainer: ViewContainerRef): Promise<ComponentRef>;
  loadRemoteAndActivate(config: RemotePluginConfig, viewContainer: ViewContainerRef): Promise<ComponentRef>;

  // v1.3.0: Bulk Operations
  unloadAll(): Promise<void>;
  loadAndActivateMany(plugins: Array<{name: string, container: ViewContainerRef}>): Promise<ComponentRef[]>;
  getPluginsByMetadata(filter: Record<string, any>): PluginMetadata[];

  // v1.1.0: Monitoring
  isUnloading(pluginName: string): boolean;
  getPluginInfo(pluginName: string): PluginInfo | undefined;

  // Observables
  readonly pluginState$: Observable<PluginStateEvent>;
}
```

### PluginRegistration

Configuration for registering a plugin.

```typescript
interface PluginRegistration {
  name: string;
  loadFn: () => Promise<LoadedPluginModule>;
  config?: {
    autoLoad?: boolean;
    retryOnError?: boolean;
    maxRetries?: number;
    timeout?: number;
    allowedServices?: Array<InjectionToken<any> | Type<any>>;
    metadata?: Record<string, any>;
  };
}
```

### PluginLifecycle

Interface for plugin components to implement lifecycle hooks.

```typescript
interface PluginLifecycle {
  onLoad?(context: PluginContext): void | Promise<void>;
  onActivate?(context: PluginContext): void | Promise<void>;
  onDeactivate?(): void | Promise<void>;
  onDestroy?(): void | Promise<void>;
}
```

### PluginContext

Bridge between host and plugin for controlled communication.

```typescript
interface PluginContext {
  readonly pluginName: string;
  readonly hostInjector: Injector;
  getService<T>(token: InjectionToken<T> | Type<T>): T | null;
  emit(eventName: string, data?: any): void;
  subscribe(eventName: string, handler: (data: any) => void): () => void;
}
```

### PluginState

Enum representing plugin lifecycle states.

```typescript
enum PluginState {
  REGISTERED = 'REGISTERED',
  LOADING = 'LOADING',
  LOADED = 'LOADED',
  ACTIVE = 'ACTIVE',
  ERROR = 'ERROR',
  UNLOADING = 'UNLOADING',
  UNLOADED = 'UNLOADED'
}
```

## Advanced Usage

### Service Access Control

```typescript
pluginManager.register({
  name: 'invoice',
  loadFn: () => import('./plugins/invoice-plugin'),
  config: {
    allowedServices: [HttpClient, Router]
  }
});
```

### Lifecycle Hooks

```typescript
providePluginSystem({
  lifecycleHooks: {
    beforeLoad: async (pluginName) => {
      // Pre-load logic
    },
    afterLoad: async (pluginName) => {
      // Post-load logic
    },
    onError: (pluginName, error) => {
      // Error handling
    }
  }
})
```

### Debug Mode (v1.1.0)

```typescript
providePluginSystem({
  enableDevMode: true,
  debugOptions: {
    logLifecycleHooks: true,      // Log hook calls and timing
    logStateTransitions: true,     // Log state changes
    validateManifests: true,       // Strict manifest validation
    throwOnWarnings: false         // Treat warnings as errors
  },
  lifecycleHookTimeout: 10000     // Custom timeout (default: 5000ms)
})
```

### Plugin Health Monitoring (v1.1.0)

```typescript
// Get detailed plugin information
const info = pluginManager.getPluginInfo('invoice');
if (info) {
  console.log(`State: ${info.state}`);
  console.log(`Loaded at: ${info.loadedAt}`);
  console.log(`Error count: ${info.errorCount}`);
  if (info.lastError) {
    console.error(`Last error: ${info.lastError.message}`);
  }
}

// Check if plugin is unloading
if (pluginManager.isUnloading('invoice')) {
  console.log('Plugin is currently being unloaded');
}
```

### Plugin State Monitoring

```typescript
pluginManager.pluginState$.subscribe(event => {
  console.log(`Plugin ${event.pluginName} is now ${event.state}`);
});
```

### Concurrent Loading

```typescript
await pluginManager.loadMany(['invoice', 'reports', 'analytics']);
```

## Error Handling

All plugin errors are defensive and will not crash the host application.

```typescript
try {
  await pluginManager.load('invoice');
} catch (error) {
  if (error instanceof PluginLoadError) {
    // Handle load failure
  }
}
```

## Architecture

The plugin system consists of:

- **PluginManager**: Orchestrates plugin lifecycle
- **PluginRegistry**: Manages plugin state and metadata
- **PluginInjector**: Creates isolated Angular injectors
- **PluginContext**: Provides controlled host-plugin communication
- **PluginOutlet**: Component for rendering plugins in templates

## Plugin Lifecycle

Each plugin progresses through a well-defined lifecycle:

```
REGISTERED → LOADING → LOADED → ACTIVE → UNLOADING → UNLOADED
```

### Lifecycle Hooks

Plugins can implement optional lifecycle hooks:

- **onLoad(context)**: Called when the plugin module is loaded
- **onActivate(context)**: Called when the plugin component is rendered
- **onDeactivate()**: Called before the plugin component is removed
- **onDestroy()**: Called during plugin cleanup

All hooks support both synchronous and asynchronous execution.

## Production Considerations

### Lifecycle Hook Timeouts (v1.1.0)

Plugin lifecycle hooks (onLoad, onActivate, onDeactivate, onDestroy) have a default timeout of **5 seconds** to prevent infinite hangs. If a hook doesn't complete within this time, a `PluginLifecycleTimeoutError` is thrown.

**Best Practices:**
- Keep lifecycle hooks lightweight
- Move heavy operations to background tasks
- Increase timeout for plugins with legitimate long initialization: `lifecycleHookTimeout: 10000`
- Disable timeout only for trusted plugins: `lifecycleHookTimeout: 0`

```typescript
// Example: Plugin with long initialization
providePluginSystem({
  lifecycleHookTimeout: 15000 // 15 seconds for data-intensive plugins
})
```

### Memory Management (v1.1.0)

Version 1.1.0 includes automatic memory leak prevention:
- Component references cleared after destruction
- Plugin contexts destroyed on unload and load failures
- Injectors properly cleaned up
- Event handlers removed when plugin unloads

**For long-running applications:**
- Monitor plugin load/unload cycles
- Avoid excessive rapid reloading
- Use `getPluginInfo()` to track error counts

### Known Limitations

The current version has the following intentional limitations:

- **No Plugin Dependencies**: Plugins cannot declare dependencies on other plugins (planned for v2)
- **No Version Checking**: No automatic compatibility validation between plugins (planned for v2)
- **No Router Integration**: Plugins cannot register routes dynamically (planned for v2)
- **No Advanced Sandboxing**: Isolation is via injector only, not iframe-based security sandbox (planned for v3)
- **No Marketplace Integration**: No built-in plugin discovery or installation system (planned for v3)
- **Basic Remote Loading**: v1.2 supports remote loading via script tags; advanced features like plugin signing, CDN trust verification, and SRI (Subresource Integrity) are planned for v2

**⚠️ Security Note:** Remote loading executes external code in your application context. See [SECURITY.md](./SECURITY.md) for critical security practices including CSP configuration, allowlisting, and source verification.

These limitations keep v1.x focused, stable, and production-ready while maintaining a clear roadmap for future enhancements.

## Roadmap

### v2.0 - Enhanced Plugin Management
- Plugin dependency resolution and loading order
- Version compatibility checking
- Dynamic route registration for plugins
- **Advanced remote loading**: Plugin signing, CDN trust verification, SRI support
- Configuration management system
- Enhanced debugging and dev tools

### v3.0 - Enterprise Features
- Advanced sandboxing with iframe-based security isolation
- Plugin marketplace integration
- Permissions and security policies
- Analytics and telemetry hooks
- Multi-version plugin support

**Note:** Roadmap features are subject to community feedback and real-world adoption patterns.

## Requirements

- Angular >= 16.0.0
- TypeScript >= 5.0.0
- RxJS >= 7.5.0

## Documentation

- [Architecture Guide](./docs/ARCHITECTURE.md) - Deep dive into system design
- [API Reference](./docs/API_REFERENCE.md) - Complete API documentation
- [Migration Guide](./docs/MIGRATION_GUIDE.md) - Upgrading between versions
- [Contributing Guide](./CONTRIBUTING.md) - How to contribute

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT - See [LICENSE](./LICENSE) for details.
