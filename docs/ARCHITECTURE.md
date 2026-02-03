# Architecture Documentation

## Overview

The Angular Dynamic Plugin System is built on a layered architecture that separates concerns between plugin management, state tracking, dependency injection, and lifecycle coordination.

## Core Principles

1. **Isolation**: Each plugin runs in an isolated Angular injector
2. **Defensive**: Plugin failures never crash the host application
3. **Observable**: All state changes are observable via RxJS
4. **Type-Safe**: Full TypeScript strict mode compliance
5. **Stateless**: No global mutable state
6. **Explicit**: Services must be explicitly allowed for plugin access

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                       │
│                  (Host Application Code)                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                              │
│  PluginManager │ PluginOutletComponent │ providePluginSystem│
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Core Services Layer                      │
│          PluginRegistry │ PluginContext                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Utilities Layer                         │
│      PluginInjectorFactory │ Error Classes                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Types Layer                            │
│     Interfaces │ Enums │ Type Definitions                   │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

### PluginManager (Orchestrator)

**Purpose**: High-level orchestration of plugin lifecycle

**Responsibilities**:
- Plugin registration and validation
- Asynchronous plugin loading
- Lifecycle hook execution
- Concurrent load management
- Timeout handling
- Error propagation
- Component creation

**Key Methods**:
```typescript
register(config: PluginRegistration): void
load(pluginName: string): Promise<PluginMetadata>
loadMany(pluginNames: string[]): Promise<PluginMetadata[]>
unregister(pluginName: string): Promise<void>
createPluginComponent(pluginName: string, viewContainer: ViewContainerRef): Promise<ComponentRef>
```

**Dependencies**:
- PluginRegistry
- Injector
- PluginSystemConfig (optional)

### PluginRegistry (State Manager)

**Purpose**: Centralized state management for all plugins

**Responsibilities**:
- Plugin metadata storage
- State tracking
- State change emission
- Query operations
- Resource cleanup

**Key Methods**:
```typescript
register(registration: PluginRegistration): void
unregister(name: string): void
updateMetadata(name: string, updates: Partial<PluginMetadata>): void
getMetadata(name: string): PluginMetadata | undefined
getPluginsByState(state: PluginState): PluginMetadata[]
```

**Data Structure**:
```typescript
Map<string, {
  registration: PluginRegistration,
  metadata: PluginMetadata,
  injector?: EnvironmentInjector,
  context?: PluginContextImpl
}>
```

### PluginInjectorFactory (Isolation Provider)

**Purpose**: Create isolated Angular injectors for plugins

**Responsibilities**:
- Environment injector creation
- Context injection
- Provider configuration
- Injector cleanup

**Key Functions**:
```typescript
createPluginInjector(config: PluginInjectorConfig): EnvironmentInjector
destroyPluginInjector(injector: EnvironmentInjector): void
```

### PluginContext (Communication Bridge)

**Purpose**: Controlled host-to-plugin communication

**Responsibilities**:
- Service access control
- Event emission and subscription
- Injector access
- Resource cleanup

**Key Methods**:
```typescript
getService<T>(token: InjectionToken<T> | Type<T>): T | null
emit(eventName: string, data?: any): void
subscribe(eventName: string, handler: (data: any) => void): () => void
```

### PluginOutletComponent (Renderer)

**Purpose**: Declarative plugin rendering in templates

**Responsibilities**:
- Automatic plugin loading
- Component instantiation
- Lifecycle management
- Cleanup on destroy

**Usage**:
```html
<plugin-outlet [plugin]="'invoice'"></plugin-outlet>
```

## Data Flow

### Plugin Registration Flow

```
Application
    │
    ├─► PluginManager.register()
    │       │
    │       ├─► PluginRegistry.register()
    │       │       │
    │       │       └─► Store registration config
    │       │
    │       └─► If autoLoad: PluginManager.load()
    │
    └─► PluginRegistry emits REGISTERED state
```

### Plugin Loading Flow

```
PluginManager.load()
    │
    ├─► Check if already loading/loaded
    │
    ├─► Update state to LOADING
    │
    ├─► Execute lifecycle hook: beforeLoad
    │
    ├─► Dynamic import via loadFn()
    │       │
    │       └─► Returns LoadedPluginModule with PluginManifest
    │
    ├─► Create PluginContext
    │       │
    │       └─► Configure allowed services
    │
    ├─► Create isolated EnvironmentInjector
    │       │
    │       └─► Inject PluginContext
    │
    ├─► Instantiate plugin component class
    │       │
    │       └─► Call onLoad(context)
    │
    ├─► Update state to LOADED
    │
    └─► Execute lifecycle hook: afterLoad
```

### Plugin Activation Flow

```
PluginOutletComponent.ngOnInit()
    │
    ├─► Check plugin state
    │
    ├─► If not loaded: PluginManager.load()
    │
    ├─► PluginManager.createPluginComponent()
    │       │
    │       ├─► Get plugin metadata
    │       ├─► Get plugin injector
    │       ├─► ViewContainerRef.createComponent()
    │       │
    │       └─► Call component.onActivate(context)
    │
    └─► Update state to ACTIVE
```

### Plugin Unload Flow

```
PluginManager.unregister()
    │
    ├─► Update state to UNLOADING
    │
    ├─► Execute lifecycle hook: beforeUnload
    │
    ├─► If component exists:
    │       │
    │       ├─► Call onDeactivate()
    │       ├─► Call onDestroy()
    │       └─► ComponentRef.destroy()
    │
    ├─► Execute lifecycle hook: afterUnload
    │
    ├─► PluginRegistry.unregister()
    │       │
    │       ├─► Destroy context
    │       ├─► Destroy injector
    │       └─► Remove from registry
    │
    └─► Update state to UNLOADED
```

## State Machine

```
    ┌──────────────┐
    │              │
    │  [Initial]   │
    │              │
    └──────┬───────┘
           │ register()
           ▼
    ┌──────────────┐
    │              │
    │ REGISTERED   │
    │              │
    └──────┬───────┘
           │ load()
           ▼
    ┌──────────────┐
    │              │
    │   LOADING    │◄─────────┐
    │              │          │
    └──────┬───────┘          │
           │                  │ retry
           ├─────────┐        │
           │         │        │
           │         ▼        │
           │    ┌─────────┐   │
           │    │  ERROR  │───┘
           │    └─────────┘
           ▼
    ┌──────────────┐
    │              │
    │    LOADED    │
    │              │
    └──────┬───────┘
           │ createComponent()
           ▼
    ┌──────────────┐
    │              │
    │    ACTIVE    │
    │              │
    └──────┬───────┘
           │ unregister()
           ▼
    ┌──────────────┐
    │              │
    │  UNLOADING   │
    │              │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │              │
    │  UNLOADED    │
    │              │
    └──────────────┘
```

## Error Handling Strategy

### Defensive Error Boundaries

1. **Plugin Load Errors**: Caught, logged, state set to ERROR
2. **Lifecycle Hook Errors**: Caught, logged, state set to ERROR
3. **Component Errors**: Isolated to plugin, don't crash host
4. **Injector Errors**: Graceful degradation
5. **Service Access Errors**: Return null, don't throw

### Error Classes Hierarchy

```
Error
  └─► PluginError
       ├─► PluginLoadError
       ├─► PluginNotFoundError
       ├─► PluginAlreadyRegisteredError
       ├─► PluginStateError
       └─► PluginLifecycleError
```

## Concurrency Control

### Concurrent Load Prevention

```typescript
private readonly loadingPromises = new Map<string, Promise<PluginMetadata>>();

async load(pluginName: string): Promise<PluginMetadata> {
  const existingPromise = this.loadingPromises.get(pluginName);
  if (existingPromise) {
    return existingPromise; // Reuse in-flight request
  }

  const loadPromise = this.executeLoad(pluginName);
  this.loadingPromises.set(pluginName, loadPromise);

  try {
    return await loadPromise;
  } finally {
    this.loadingPromises.delete(pluginName);
  }
}
```

### Batch Loading

```typescript
async loadMany(pluginNames: string[]): Promise<PluginMetadata[]> {
  const maxConcurrent = this.config?.maxConcurrentLoads || pluginNames.length;

  for (let i = 0; i < pluginNames.length; i += maxConcurrent) {
    const batch = pluginNames.slice(i, i + maxConcurrent);
    await Promise.allSettled(batch.map(name => this.load(name)));
  }
}
```

## Memory Management

### Plugin Cleanup

```typescript
unregister(name: string): void {
  const entry = this.registry.get(name);

  // 1. Clean up context
  if (entry.context) {
    entry.context.destroy(); // Clears event handlers
  }

  // 2. Destroy injector
  if (entry.injector) {
    entry.injector.destroy(); // Releases providers
  }

  // 3. Remove from registry
  this.registry.delete(name);
}
```

### Event Handler Cleanup

```typescript
subscribe(eventName: string, handler: Function): () => void {
  const handlers = this.eventHandlers.get(eventName) || new Set();
  handlers.add(handler);
  this.eventHandlers.set(eventName, handlers);

  return () => {
    handlers.delete(handler);
    if (handlers.size === 0) {
      this.eventHandlers.delete(eventName); // Auto-cleanup
    }
  };
}
```

## Dependency Injection

### Isolated Injector Hierarchy

```
Root Injector (Host Application)
    │
    └─► Environment Injector (Plugin)
            │
            ├─► PLUGIN_CONTEXT (provided)
            └─► Custom Providers (optional)
```

### Service Access Control

```typescript
getService<T>(token: InjectionToken<T> | Type<T>): T | null {
  // Check whitelist
  if (this.allowedServices.size > 0 && !this.allowedServices.has(token)) {
    return null; // Access denied
  }

  try {
    return this.hostInjector.get(token, null);
  } catch {
    return null; // Graceful degradation
  }
}
```

## Configuration System

### Provider Function

```typescript
export function providePluginSystem(config?: PluginSystemConfig): EnvironmentProviders {
  const defaultConfig: PluginSystemConfig = {
    globalTimeout: 30000,
    maxConcurrentLoads: 3,
    enableDevMode: false,
    lifecycleHooks: {},
    defaultAllowedServices: []
  };

  const mergedConfig = { ...defaultConfig, ...config };

  return makeEnvironmentProviders([
    { provide: PLUGIN_SYSTEM_CONFIG, useValue: mergedConfig }
  ]);
}
```

### Configuration Hierarchy

```
Global Config (providePluginSystem)
    │
    └─► Plugin Config (PluginRegistration.config)
            │
            └─► Runtime Overrides (method parameters)
```

## Observable Architecture

### State Stream

```typescript
readonly state$: Observable<PluginStateEvent>;

// Usage
pluginManager.pluginState$.subscribe(event => {
  console.log(`${event.pluginName} -> ${event.state}`);
});
```

### Event Flow

```
State Change
    │
    ├─► BehaviorSubject emits
    │
    ├─► Filtered to non-null events
    │
    └─► Subscribers notified
```

## Testing Strategy

### Unit Testing

- Isolated service testing with mocks
- Lifecycle hook verification
- State transition validation
- Error handling verification

### Integration Testing

- Full plugin load cycle
- Component rendering
- Event communication
- Service access control

## Performance Considerations

1. **Lazy Loading**: Plugins loaded on-demand
2. **Bundle Splitting**: Each plugin in separate chunk
3. **Concurrent Limits**: Prevent resource exhaustion
4. **Timeout Protection**: Prevent hanging loads
5. **Memory Cleanup**: Aggressive resource release

## Security Considerations

1. **Service Whitelisting**: Explicit service access
2. **Injector Isolation**: No implicit service access
3. **Event Scoping**: Plugin events don't leak
4. **Error Isolation**: Plugin errors contained
5. **Context Binding**: Controlled host access

## Extension Points

1. **Lifecycle Hooks**: Global hooks for all plugins
2. **Custom Providers**: Plugin-specific services
3. **Metadata**: Arbitrary plugin metadata
4. **Configuration**: Per-plugin configuration

## Future Enhancements

1. Plugin dependency resolution
2. Version compatibility checking
3. Hot module replacement
4. Advanced sandboxing (iframe)
5. Remote plugin loading
6. Plugin marketplace integration
7. Router integration
8. Permissions system
