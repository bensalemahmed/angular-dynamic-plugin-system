# Angular Dynamic Plugin System

[![npm version](https://img.shields.io/npm/v/@angular-dynamic/plugin-system.svg)](https://www.npmjs.com/package/@angular-dynamic/plugin-system)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/angular-dynamic/plugin-system)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Angular](https://img.shields.io/badge/Angular-16+-red.svg)](https://angular.io/)

A production-ready, type-safe plugin system for Angular 16+ applications that enables runtime loading, isolated execution, and lifecycle management of plugins.

## What Problem Does This Solve?

Modern Angular applications, especially SaaS platforms, multi-tenant systems, and extensible applications, often need to:

- Load features dynamically at runtime without rebuilding the application
- Enable/disable functionality for specific users or tenants
- Support third-party extensions and plugins
- Reduce initial bundle size by lazy-loading optional features
- Provide isolated execution environments for untrusted code

This library provides a **standard, production-ready solution** for dynamic plugin architecture in Angular applications.

## Features

- Runtime plugin loading via dynamic imports
- Isolated injector per plugin for dependency isolation
- Type-safe plugin lifecycle hooks
- Defensive error handling (plugin failures don't crash host)
- Observable-based state management
- Concurrent plugin loading with configurable limits
- Timeout support with automatic cleanup
- Compatible with standalone components
- TypeScript strict mode compliant

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
      enableDevMode: false
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
  register(config: PluginRegistration): void;
  load(pluginName: string): Promise<PluginMetadata>;
  loadMany(pluginNames: string[]): Promise<PluginMetadata[]>;
  unregister(pluginName: string): Promise<void>;
  getPluginState(pluginName: string): PluginState | undefined;
  readonly pluginState$: Observable<PluginStateEvent>;
  isReady(pluginName: string): boolean;
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

## Limitations (v1.0.0)

The current version has the following intentional limitations:

- **No Plugin Dependencies**: Plugins cannot declare dependencies on other plugins (planned for v2)
- **No Version Checking**: No automatic compatibility validation between plugins (planned for v2)
- **No Hot Reload**: Plugin updates require reloading (HMR support planned for v2)
- **No Router Integration**: Plugins cannot register routes dynamically (planned for v2)
- **No Advanced Sandboxing**: Isolation is via injector only, not iframe-based (planned for v3)
- **No Remote Loading**: Plugins must be bundled with the application (planned for v2)
- **No Marketplace**: No built-in plugin discovery or installation system (planned for v3)

These limitations keep v1 focused, stable, and production-ready while maintaining a clear roadmap for future enhancements.

## Roadmap

### v2.0 - Enhanced Plugin Management
- Plugin dependency resolution and loading order
- Version compatibility checking
- Dynamic route registration for plugins
- Remote plugin loading from CDN/server
- Configuration management system
- Enhanced debugging and dev tools

### v3.0 - Enterprise Features
- Advanced sandboxing with iframe isolation
- Plugin marketplace integration
- Permissions and security policies
- Analytics and telemetry hooks
- Plugin signing and verification
- Multi-version plugin support

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
