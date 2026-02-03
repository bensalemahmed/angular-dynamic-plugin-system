# API Reference

Complete API documentation for the Angular Dynamic Plugin System.

## Table of Contents

- [Core Services](#core-services)
  - [PluginManager](#pluginmanager)
  - [PluginRegistry](#pluginregistry)
- [Components](#components)
  - [PluginOutletComponent](#pluginoutletcomponent)
- [Configuration](#configuration)
  - [providePluginSystem](#providepluginsystem)
  - [PluginSystemConfig](#pluginsystemconfig)
- [Types & Interfaces](#types--interfaces)
  - [PluginManifest](#pluginmanifest)
  - [PluginLifecycle](#pluginlifecycle)
  - [PluginContext](#plugincontext)
  - [PluginState](#pluginstate)
  - [PluginRegistration](#pluginregistration)
  - [PluginConfig](#pluginconfig)
- [Error Classes](#error-classes)
- [Utilities](#utilities)

---

## Core Services

### PluginManager

Main orchestrator for plugin lifecycle management. This is the primary service you'll interact with.

```typescript
@Injectable({ providedIn: 'root' })
export class PluginManager {
  readonly pluginState$: Observable<PluginStateEvent>;

  register(registration: PluginRegistration): void;
  load(pluginName: string): Promise<PluginMetadata>;
  loadMany(pluginNames: string[]): Promise<PluginMetadata[]>;
  unregister(pluginName: string): Promise<void>;
  getPluginState(pluginName: string): PluginState | undefined;
  isReady(pluginName: string): boolean;
  createPluginComponent(pluginName: string, viewContainer: ViewContainerRef): Promise<ComponentRef<any>>;
}
```

#### Methods

##### `register(registration: PluginRegistration): void`

Registers a plugin with the system.

**Parameters:**
- `registration`: Configuration object containing plugin name, load function, and optional config

**Throws:**
- `PluginAlreadyRegisteredError`: If a plugin with the same name is already registered

**Example:**
```typescript
pluginManager.register({
  name: 'invoice',
  loadFn: () => import('./plugins/invoice-plugin'),
  config: {
    autoLoad: true,
    timeout: 5000,
    allowedServices: [HttpClient, Router]
  }
});
```

##### `load(pluginName: string): Promise<PluginMetadata>`

Asynchronously loads a registered plugin.

**Parameters:**
- `pluginName`: Name of the plugin to load

**Returns:**
- `Promise<PluginMetadata>`: Metadata of the loaded plugin

**Throws:**
- `PluginNotFoundError`: If plugin is not registered
- `PluginLoadError`: If loading fails
- `PluginStateError`: If plugin is in invalid state for loading

**Example:**
```typescript
try {
  const metadata = await pluginManager.load('invoice');
  console.log('Plugin loaded:', metadata.manifest.displayName);
} catch (error) {
  if (error instanceof PluginLoadError) {
    console.error('Failed to load plugin:', error.message);
  }
}
```

##### `loadMany(pluginNames: string[]): Promise<PluginMetadata[]>`

Loads multiple plugins with concurrent control.

**Parameters:**
- `pluginNames`: Array of plugin names to load

**Returns:**
- `Promise<PluginMetadata[]>`: Array of successfully loaded plugin metadata

**Example:**
```typescript
const loaded = await pluginManager.loadMany(['invoice', 'reports', 'analytics']);
console.log(`Loaded ${loaded.length} plugins`);
```

##### `unregister(pluginName: string): Promise<void>`

Unregisters and cleans up a plugin.

**Parameters:**
- `pluginName`: Name of the plugin to unregister

**Throws:**
- `PluginNotFoundError`: If plugin is not registered

**Example:**
```typescript
await pluginManager.unregister('invoice');
```

##### `getPluginState(pluginName: string): PluginState | undefined`

Gets the current state of a plugin.

**Parameters:**
- `pluginName`: Name of the plugin

**Returns:**
- `PluginState | undefined`: Current state or undefined if not registered

**Example:**
```typescript
const state = pluginManager.getPluginState('invoice');
if (state === PluginState.LOADED) {
  console.log('Plugin is ready to use');
}
```

##### `isReady(pluginName: string): boolean`

Checks if a plugin is ready for rendering.

**Parameters:**
- `pluginName`: Name of the plugin

**Returns:**
- `boolean`: True if plugin is in LOADED or ACTIVE state

**Example:**
```typescript
if (pluginManager.isReady('invoice')) {
  // Render the plugin
}
```

##### `createPluginComponent(pluginName: string, viewContainer: ViewContainerRef): Promise<ComponentRef<any>>`

Creates and renders a plugin component in the specified view container.

**Parameters:**
- `pluginName`: Name of the plugin
- `viewContainer`: Angular ViewContainerRef where the plugin will be rendered

**Returns:**
- `Promise<ComponentRef<any>>`: Reference to the created component

**Throws:**
- `PluginNotFoundError`: If plugin is not registered
- `PluginStateError`: If plugin is not in LOADED state

**Example:**
```typescript
const componentRef = await pluginManager.createPluginComponent(
  'invoice',
  this.viewContainer
);
```

#### Properties

##### `pluginState$: Observable<PluginStateEvent>`

Observable stream of plugin state changes.

**Example:**
```typescript
pluginManager.pluginState$.subscribe(event => {
  console.log(`Plugin ${event.pluginName} is now ${event.state}`);
  if (event.error) {
    console.error('Error:', event.error);
  }
});
```

---

### PluginRegistry

Internal service for managing plugin state and metadata. Generally, you should use `PluginManager` instead of accessing this directly.

```typescript
@Injectable({ providedIn: 'root' })
export class PluginRegistry {
  readonly state$: Observable<PluginStateEvent | null>;

  register(registration: PluginRegistration): void;
  unregister(name: string): void;
  updateMetadata(name: string, updates: Partial<PluginMetadata>): void;
  getMetadata(name: string): PluginMetadata | undefined;
  getAllPlugins(): PluginMetadata[];
  getPluginsByState(state: PluginState): PluginMetadata[];
  get(name: string): PluginRegistryEntry | undefined;
}
```

---

## Components

### PluginOutletComponent

Declarative component for rendering plugins in templates.

```typescript
@Component({
  selector: 'plugin-outlet',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PluginOutletComponent implements OnInit, OnDestroy {
  @Input() plugin!: string;
}
```

#### Inputs

##### `plugin: string`

Name of the plugin to render.

**Example:**
```html
<plugin-outlet [plugin]="'invoice'"></plugin-outlet>
```

#### Lifecycle

- Automatically loads the plugin if not already loaded
- Creates and renders the plugin component on init
- Cleans up the component on destroy

---

## Configuration

### providePluginSystem

Provider function for configuring the plugin system globally.

```typescript
function providePluginSystem(config?: PluginSystemConfig): EnvironmentProviders
```

**Parameters:**
- `config`: Optional global configuration

**Returns:**
- `EnvironmentProviders`: Angular providers for the plugin system

**Example:**
```typescript
import { ApplicationConfig } from '@angular/core';
import { providePluginSystem } from '@angular-dynamic/plugin-system';

export const appConfig: ApplicationConfig = {
  providers: [
    providePluginSystem({
      globalTimeout: 30000,
      maxConcurrentLoads: 3,
      enableDevMode: true,
      defaultAllowedServices: [HttpClient],
      lifecycleHooks: {
        beforeLoad: async (pluginName) => {
          console.log('Loading:', pluginName);
        },
        afterLoad: async (pluginName) => {
          console.log('Loaded:', pluginName);
        },
        onError: (pluginName, error) => {
          console.error('Error in', pluginName, error);
        }
      }
    })
  ]
};
```

### PluginSystemConfig

Global configuration interface.

```typescript
interface PluginSystemConfig {
  globalTimeout?: number;
  maxConcurrentLoads?: number;
  enableDevMode?: boolean;
  lifecycleHooks?: PluginLifecycleHooks;
  defaultAllowedServices?: Array<InjectionToken<any> | Type<any>>;
}
```

#### Properties

- **globalTimeout** (`number`): Default timeout in milliseconds for plugin loading (default: 30000)
- **maxConcurrentLoads** (`number`): Maximum number of plugins to load concurrently (default: 3)
- **enableDevMode** (`boolean`): Enable development mode features (default: false)
- **lifecycleHooks** (`PluginLifecycleHooks`): Global lifecycle hooks for all plugins
- **defaultAllowedServices** (`Array`): Services accessible to all plugins by default

---

## Types & Interfaces

### PluginManifest

Plugin metadata definition.

```typescript
interface PluginManifest {
  name: string;
  version: string;
  entryComponent: Type<PluginLifecycle>;
  displayName?: string;
  description?: string;
  author?: string;
  dependencies?: Record<string, string>;
}
```

**Example:**
```typescript
export const PluginManifest = {
  name: 'invoice',
  version: '1.0.0',
  entryComponent: InvoicePluginComponent,
  displayName: 'Invoice Management',
  description: 'Manage invoices and billing',
  author: 'Your Company'
};
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

#### Hooks

- **onLoad**: Called when plugin module is loaded
- **onActivate**: Called when plugin component is rendered
- **onDeactivate**: Called before plugin component is removed
- **onDestroy**: Called during plugin cleanup

**Example:**
```typescript
@Component({
  selector: 'invoice-plugin',
  standalone: true,
  template: `<h1>Invoice Plugin</h1>`
})
export class InvoicePluginComponent implements PluginLifecycle {
  async onLoad(context: PluginContext): Promise<void> {
    const http = context.getService(HttpClient);
    // Initialize plugin
  }

  async onActivate(context: PluginContext): Promise<void> {
    // Component is now rendered
  }

  async onDeactivate(): Promise<void> {
    // Component will be removed
  }

  async onDestroy(): Promise<void> {
    // Cleanup resources
  }
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

#### Methods

##### `getService<T>(token: InjectionToken<T> | Type<T>): T | null`

Gets a service from the host application (if allowed).

**Returns:**
- Service instance or `null` if not allowed or not found

**Example:**
```typescript
const http = context.getService(HttpClient);
if (http) {
  http.get('/api/data').subscribe(data => {
    // Use data
  });
}
```

##### `emit(eventName: string, data?: any): void`

Emits an event that the host can subscribe to.

**Example:**
```typescript
context.emit('invoice-created', { id: 123 });
```

##### `subscribe(eventName: string, handler: (data: any) => void): () => void`

Subscribes to events from the host.

**Returns:**
- Unsubscribe function

**Example:**
```typescript
const unsubscribe = context.subscribe('refresh', () => {
  this.loadData();
});

// Later...
unsubscribe();
```

### PluginState

Enumeration of plugin lifecycle states.

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

**State Flow:**
```
REGISTERED → LOADING → LOADED → ACTIVE → UNLOADING → UNLOADED
                ↓
              ERROR
```

### PluginRegistration

Configuration for registering a plugin.

```typescript
interface PluginRegistration {
  name: string;
  loadFn: () => Promise<LoadedPluginModule>;
  config?: PluginConfig;
}
```

**Example:**
```typescript
const registration: PluginRegistration = {
  name: 'invoice',
  loadFn: () => import('./plugins/invoice-plugin'),
  config: {
    autoLoad: true,
    timeout: 5000
  }
};
```

### PluginConfig

Per-plugin configuration.

```typescript
interface PluginConfig {
  autoLoad?: boolean;
  retryOnError?: boolean;
  maxRetries?: number;
  timeout?: number;
  allowedServices?: Array<InjectionToken<any> | Type<any>>;
  metadata?: Record<string, any>;
}
```

#### Properties

- **autoLoad** (`boolean`): Load immediately after registration
- **retryOnError** (`boolean`): Retry on load failure
- **maxRetries** (`number`): Maximum retry attempts
- **timeout** (`number`): Plugin-specific timeout (overrides global)
- **allowedServices** (`Array`): Services this plugin can access
- **metadata** (`Record<string, any>`): Custom plugin metadata

---

## Error Classes

All errors extend from `PluginError`.

### PluginError

Base error class for all plugin-related errors.

```typescript
class PluginError extends Error {
  constructor(message: string, public readonly cause?: Error)
}
```

### PluginLoadError

Thrown when plugin loading fails.

```typescript
class PluginLoadError extends PluginError {
  constructor(pluginName: string, cause?: Error)
}
```

### PluginNotFoundError

Thrown when referencing a non-existent plugin.

```typescript
class PluginNotFoundError extends PluginError {
  constructor(pluginName: string)
}
```

### PluginAlreadyRegisteredError

Thrown when attempting to register a plugin that already exists.

```typescript
class PluginAlreadyRegisteredError extends PluginError {
  constructor(pluginName: string)
}
```

### PluginStateError

Thrown when plugin is in invalid state for an operation.

```typescript
class PluginStateError extends PluginError {
  constructor(pluginName: string, currentState: PluginState, expectedState: PluginState)
}
```

### PluginLifecycleError

Thrown when a lifecycle hook fails.

```typescript
class PluginLifecycleError extends PluginError {
  constructor(pluginName: string, hookName: string, cause?: Error)
}
```

**Example:**
```typescript
try {
  await pluginManager.load('invoice');
} catch (error) {
  if (error instanceof PluginLoadError) {
    console.error('Load failed:', error.message);
  } else if (error instanceof PluginNotFoundError) {
    console.error('Plugin not found:', error.message);
  }
}
```

---

## Utilities

### createPluginInjector

Factory function for creating isolated Angular injectors.

```typescript
function createPluginInjector(config: PluginInjectorConfig): EnvironmentInjector
```

**Note:** This is typically used internally by `PluginManager`.

### PluginContextImpl

Implementation of the `PluginContext` interface.

```typescript
class PluginContextImpl implements PluginContext {
  constructor(config: PluginContextConfig)

  readonly pluginName: string;
  readonly hostInjector: Injector;
  getService<T>(token: InjectionToken<T> | Type<T>): T | null;
  emit(eventName: string, data?: any): void;
  subscribe(eventName: string, handler: (data: any) => void): () => void;
  destroy(): void;
}
```

**Note:** This is typically instantiated internally by `PluginManager`.

---

## Usage Patterns

### Basic Plugin Setup

```typescript
// 1. Configure system
bootstrapApplication(AppComponent, {
  providers: [providePluginSystem()]
});

// 2. Register plugin
pluginManager.register({
  name: 'invoice',
  loadFn: () => import('./plugins/invoice')
});

// 3. Render plugin
<plugin-outlet [plugin]="'invoice'"></plugin-outlet>
```

### Monitoring Plugin State

```typescript
pluginManager.pluginState$
  .pipe(
    filter(event => event.state === PluginState.ERROR)
  )
  .subscribe(event => {
    console.error(`Plugin ${event.pluginName} failed:`, event.error);
  });
```

### Service Access Control

```typescript
pluginManager.register({
  name: 'invoice',
  loadFn: () => import('./plugins/invoice'),
  config: {
    allowedServices: [HttpClient, Router]
  }
});
```

### Event Communication

```typescript
// In plugin
context.emit('invoice-created', { id: 123 });

// In host
pluginManager.pluginState$.subscribe(event => {
  // Handle plugin events
});
```

---

## TypeScript Support

All APIs are fully typed with TypeScript strict mode compliance. IntelliSense will provide complete type information and documentation.

```typescript
import {
  PluginManager,
  PluginState,
  PluginLifecycle,
  PluginContext,
  providePluginSystem
} from '@angular-dynamic/plugin-system';
```

---

## Version Compatibility

- Angular >= 16.0.0
- TypeScript >= 5.0.0
- RxJS >= 7.5.0

---

For more information, see:
- [Architecture Guide](./ARCHITECTURE.md)
- [Migration Guide](./MIGRATION_GUIDE.md)
- [Main README](../README.md)
