# Plugin Development Guide

This guide explains how to create plugins for the Angular Dynamic Plugin System.

## Plugin Structure

A plugin consists of:

1. A standalone Angular component implementing `PluginLifecycle`
2. A `PluginManifest` export containing metadata
3. Optional services and utilities

## Minimal Plugin Example

```typescript
import { Component } from '@angular/core';
import { PluginLifecycle, PluginContext } from '@angular-dynamic/plugin-system';

@Component({
  selector: 'my-plugin',
  standalone: true,
  template: `<h1>My Plugin</h1>`
})
export class MyPluginComponent implements PluginLifecycle {
  async onLoad(context: PluginContext): Promise<void> {
    // Initialize plugin
  }
}

export const PluginManifest = {
  name: 'my-plugin',
  version: '1.0.0',
  entryComponent: MyPluginComponent
};
```

## Lifecycle Hooks

### onLoad(context: PluginContext)

Called when the plugin module is loaded but before component instantiation.

```typescript
async onLoad(context: PluginContext): Promise<void> {
  // Initialize data
  // Subscribe to host events
  // Configure plugin state
}
```

### onActivate(context: PluginContext)

Called when the plugin component is created and rendered.

```typescript
async onActivate(context: PluginContext): Promise<void> {
  // Start background tasks
  // Connect to services
  // Begin data fetching
}
```

### onDeactivate()

Called before the plugin component is destroyed.

```typescript
async onDeactivate(): Promise<void> {
  // Stop background tasks
  // Save state
  // Disconnect from services
}
```

### onDestroy()

Called during final cleanup when plugin is unloaded.

```typescript
async onDestroy(): Promise<void> {
  // Release resources
  // Clear caches
  // Final cleanup
}
```

## Using PluginContext

The `PluginContext` provides controlled access to host application features.

### Accessing Services

```typescript
async onLoad(context: PluginContext): Promise<void> {
  const httpClient = context.getService(HttpClient);
  if (httpClient) {
    // Use the service
  }
}
```

### Event Communication

```typescript
async onLoad(context: PluginContext): Promise<void> {
  // Subscribe to host events
  const unsubscribe = context.subscribe('data:updated', (data) => {
    // Handle event
  });

  // Emit events to host
  context.emit('plugin:ready', { pluginName: context.pluginName });
}
```

## Plugin Manifest

The manifest provides metadata about your plugin:

```typescript
export const PluginManifest = {
  name: 'my-plugin',                    // Required: unique identifier
  version: '1.0.0',                     // Required: semver version
  entryComponent: MyPluginComponent,    // Required: component class
  displayName: 'My Awesome Plugin',     // Optional: display name
  description: 'Does amazing things',   // Optional: description
  author: 'Your Name',                  // Optional: author info
  dependencies: {                       // Optional: dependencies
    '@angular/core': '^16.0.0'
  }
};
```

## Best Practices

### 1. Error Handling

Always handle errors gracefully:

```typescript
async onLoad(context: PluginContext): Promise<void> {
  try {
    await this.initialize();
  } catch (error) {
    // Log error but don't crash
    // Provide fallback behavior
  }
}
```

### 2. Resource Cleanup

Clean up resources in lifecycle hooks:

```typescript
private subscriptions: (() => void)[] = [];

async onLoad(context: PluginContext): Promise<void> {
  const unsubscribe = context.subscribe('event', this.handler);
  this.subscriptions.push(unsubscribe);
}

async onDestroy(): Promise<void> {
  this.subscriptions.forEach(unsub => unsub());
  this.subscriptions = [];
}
```

### 3. Defensive Service Access

Check if services are available:

```typescript
async onLoad(context: PluginContext): Promise<void> {
  const router = context.getService(Router);
  if (!router) {
    // Fallback behavior
    return;
  }
  // Use router
}
```

### 4. State Management

Keep plugin state isolated:

```typescript
@Component({
  selector: 'my-plugin',
  standalone: true,
  template: `...`
})
export class MyPluginComponent implements PluginLifecycle {
  private state = {
    data: [],
    loading: false
  };

  async onLoad(context: PluginContext): Promise<void> {
    this.loadData();
  }

  private async loadData(): Promise<void> {
    this.state.loading = true;
    try {
      // Load data
    } finally {
      this.state.loading = false;
    }
  }
}
```

### 5. Async Initialization

Use async/await for initialization:

```typescript
async onLoad(context: PluginContext): Promise<void> {
  const config = await this.loadConfig();
  const data = await this.fetchInitialData(config);
  this.initialize(data);
}
```

## Plugin Configuration

Plugins can be configured during registration:

```typescript
pluginManager.register({
  name: 'my-plugin',
  loadFn: () => import('./my-plugin'),
  config: {
    autoLoad: true,
    timeout: 5000,
    allowedServices: [HttpClient, Router],
    metadata: {
      apiUrl: 'https://api.example.com',
      theme: 'dark'
    }
  }
});
```

## Testing Plugins

### Unit Testing

```typescript
import { TestBed } from '@angular/core/testing';
import { MyPluginComponent } from './my-plugin.component';
import { PluginContext } from '@angular-dynamic/plugin-system';

describe('MyPluginComponent', () => {
  let component: MyPluginComponent;
  let mockContext: PluginContext;

  beforeEach(() => {
    mockContext = {
      pluginName: 'my-plugin',
      hostInjector: TestBed.inject(Injector),
      getService: jasmine.createSpy('getService'),
      emit: jasmine.createSpy('emit'),
      subscribe: jasmine.createSpy('subscribe')
    } as any;

    component = new MyPluginComponent();
  });

  it('should initialize on load', async () => {
    await component.onLoad(mockContext);
    expect(component).toBeDefined();
  });
});
```

## Common Patterns

### Lazy Loading Data

```typescript
private data$ = new BehaviorSubject<any[]>([]);

async onActivate(context: PluginContext): Promise<void> {
  const httpClient = context.getService(HttpClient);
  if (httpClient) {
    const data = await firstValueFrom(httpClient.get('/api/data'));
    this.data$.next(data);
  }
}
```

### Communication with Host

```typescript
async onLoad(context: PluginContext): Promise<void> {
  context.subscribe('app:theme-changed', (theme) => {
    this.applyTheme(theme);
  });

  context.emit('plugin:status', {
    ready: true,
    features: ['feature1', 'feature2']
  });
}
```

### Dynamic UI Updates

```typescript
@Component({
  selector: 'my-plugin',
  standalone: true,
  template: `
    <div *ngIf="data$ | async as data">
      <div *ngFor="let item of data">{{ item.name }}</div>
    </div>
  `,
  imports: [CommonModule]
})
export class MyPluginComponent implements PluginLifecycle {
  data$ = new BehaviorSubject<any[]>([]);

  async onActivate(context: PluginContext): Promise<void> {
    this.startPolling();
  }

  async onDeactivate(): Promise<void> {
    this.stopPolling();
  }
}
```

## Troubleshooting

### Plugin Not Loading

1. Check manifest export name is exactly `PluginManifest`
2. Verify entry component is a valid Angular component
3. Check browser console for errors
4. Verify timeout configuration

### Services Not Available

1. Check if service is in `allowedServices` configuration
2. Verify service is provided in host application
3. Use defensive checks when accessing services

### Memory Leaks

1. Unsubscribe from all subscriptions in `onDestroy`
2. Clear timers and intervals
3. Remove event listeners
4. Clean up DOM references

## Distribution

Package your plugin as an npm module:

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "peerDependencies": {
    "@angular/core": ">=16.0.0",
    "@angular-dynamic/plugin-system": ">=1.0.0"
  }
}
```

## Example Plugins

See the `examples/` directory for complete plugin implementations:

- `invoice-plugin/` - Complete invoice management plugin
- More examples coming soon

## Support

For issues and questions:
- GitHub Issues: [link]
- Documentation: [link]
- Community: [link]
