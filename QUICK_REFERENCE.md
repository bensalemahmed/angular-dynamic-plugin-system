# Quick Reference Card

## Installation

```bash
npm install @angular-dynamic/plugin-system
```

## Setup (3 Steps)

### 1. Configure Provider

```typescript
// app.config.ts
import { providePluginSystem } from '@angular-dynamic/plugin-system';

export const appConfig: ApplicationConfig = {
  providers: [
    providePluginSystem({
      globalTimeout: 30000,
      maxConcurrentLoads: 3
    })
  ]
};
```

### 2. Create Plugin

```typescript
// my-plugin.component.ts
import { Component } from '@angular/core';
import { PluginLifecycle, PluginContext } from '@angular-dynamic/plugin-system';

@Component({
  selector: 'my-plugin',
  standalone: true,
  template: `<h1>My Plugin</h1>`
})
export class MyPluginComponent implements PluginLifecycle {
  async onLoad(context: PluginContext) {
    // Initialize
  }
}

export const PluginManifest = {
  name: 'my-plugin',
  version: '1.0.0',
  entryComponent: MyPluginComponent
};
```

### 3. Register & Use

```typescript
// app.component.ts
import { PluginManager, PluginOutletComponent } from '@angular-dynamic/plugin-system';

@Component({
  template: `<plugin-outlet [plugin]="'my-plugin'"></plugin-outlet>`,
  imports: [PluginOutletComponent]
})
export class AppComponent {
  constructor(private pluginManager: PluginManager) {
    this.pluginManager.register({
      name: 'my-plugin',
      loadFn: () => import('./my-plugin.component')
    });
  }
}
```

## API Cheat Sheet

### PluginManager

```typescript
// Register
pluginManager.register({
  name: string,
  loadFn: () => Promise<LoadedPluginModule>,
  config?: { autoLoad, timeout, allowedServices, ... }
});

// Load
await pluginManager.load('plugin-name');
await pluginManager.loadMany(['plugin1', 'plugin2']);

// Unload
await pluginManager.unregister('plugin-name');

// Query
pluginManager.getPluginState('plugin-name');
pluginManager.isReady('plugin-name');
pluginManager.getPluginMetadata('plugin-name');
pluginManager.getAllPlugins();
pluginManager.getPluginsByState(PluginState.LOADED);

// Monitor
pluginManager.pluginState$.subscribe(event => {
  console.log(event.pluginName, event.state);
});
```

### PluginLifecycle Hooks

```typescript
interface PluginLifecycle {
  onLoad?(context: PluginContext): void | Promise<void>;
  onActivate?(context: PluginContext): void | Promise<void>;
  onDeactivate?(): void | Promise<void>;
  onDestroy?(): void | Promise<void>;
}
```

### PluginContext

```typescript
// Get service
const service = context.getService(HttpClient);

// Events
context.emit('event-name', data);
const unsubscribe = context.subscribe('event-name', (data) => {});

// Info
context.pluginName;
context.hostInjector;
```

## Plugin States

```
REGISTERED → LOADING → LOADED → ACTIVE
                 ↓
              ERROR
```

## Component Template

```html
<plugin-outlet [plugin]="'plugin-name'"></plugin-outlet>
```

## Configuration Options

```typescript
providePluginSystem({
  globalTimeout: 30000,              // Default load timeout
  maxConcurrentLoads: 3,             // Concurrent load limit
  enableDevMode: false,              // Error propagation
  defaultAllowedServices: [...],     // Default service whitelist
  lifecycleHooks: {
    beforeLoad: async (name) => {},
    afterLoad: async (name) => {},
    beforeUnload: async (name) => {},
    afterUnload: async (name) => {},
    onError: (name, error) => {}
  }
})
```

## Plugin Registration Options

```typescript
{
  name: 'plugin-name',
  loadFn: () => import('./plugin'),
  config: {
    autoLoad: true,                  // Load on registration
    retryOnError: false,             // Retry on failure
    maxRetries: 3,                   // Max retry attempts
    timeout: 5000,                   // Load timeout (ms)
    allowedServices: [HttpClient],   // Service whitelist
    metadata: { key: 'value' }       // Custom metadata
  }
}
```

## Error Handling

```typescript
try {
  await pluginManager.load('plugin-name');
} catch (error) {
  if (error instanceof PluginLoadError) {
    // Handle load failure
  }
  if (error instanceof PluginNotFoundError) {
    // Plugin not registered
  }
  if (error instanceof PluginStateError) {
    // Invalid state transition
  }
}
```

## Common Patterns

### Auto-load on Registration

```typescript
pluginManager.register({
  name: 'my-plugin',
  loadFn: () => import('./my-plugin'),
  config: { autoLoad: true }
});
```

### Service Whitelist

```typescript
pluginManager.register({
  name: 'my-plugin',
  loadFn: () => import('./my-plugin'),
  config: {
    allowedServices: [HttpClient, Router]
  }
});
```

### State Monitoring

```typescript
pluginManager.pluginState$
  .pipe(filter(e => e.pluginName === 'my-plugin'))
  .subscribe(event => {
    console.log('State:', event.state);
  });
```

### Event Communication

```typescript
// In plugin
async onLoad(context: PluginContext) {
  context.subscribe('refresh', () => this.refresh());
  context.emit('ready', { version: '1.0.0' });
}
```

### Conditional Rendering

```html
<plugin-outlet
  *ngIf="pluginManager.isReady('my-plugin')"
  [plugin]="'my-plugin'">
</plugin-outlet>
```

## TypeScript Types

```typescript
import {
  PluginManager,
  PluginRegistry,
  PluginLifecycle,
  PluginContext,
  PluginState,
  PluginMetadata,
  PluginManifest,
  PluginRegistration,
  PluginSystemConfig,
  PluginError,
  PluginLoadError,
  PluginNotFoundError,
  providePluginSystem,
  PluginOutletComponent
} from '@angular-dynamic/plugin-system';
```

## Testing

```typescript
import { TestBed } from '@angular/core/testing';
import { PluginManager } from '@angular-dynamic/plugin-system';

TestBed.configureTestingModule({
  providers: [PluginManager]
});

const manager = TestBed.inject(PluginManager);
```

## Build & Publish

```bash
# Install
npm install

# Build
npm run build

# Test
npm test

# Publish
npm publish --access public
```

## Resources

- **README.md** - Getting started guide
- **ARCHITECTURE.md** - Detailed architecture
- **PLUGIN_GUIDE.md** - Plugin development guide
- **examples/** - Working examples

## Support

- GitHub Issues: [Report bugs]
- Documentation: [Read docs]
- Examples: Check `examples/` directory
