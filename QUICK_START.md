# Quick Start Guide

Get your Angular Dynamic Plugin System up and running in 5 minutes.

---

## Installation

```bash
npm install angular-dynamic-plugin-system
```

---

## Step 1: Configure Your Application (2 minutes)

### Add Provider to Bootstrap

```typescript
// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { providePluginSystem } from 'angular-dynamic-plugin-system';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    providePluginSystem({
      globalTimeout: 30000,
      maxConcurrentLoads: 3,
      enableDevMode: false
    })
  ]
});
```

**That's it!** The plugin system is now available throughout your application.

---

## Step 2: Create Your First Plugin (2 minutes)

### Create Plugin Component

```typescript
// plugins/hello-world/hello-world.component.ts
import { Component } from '@angular/core';
import {
  PluginLifecycle,
  PluginContext
} from 'angular-dynamic-plugin-system';

@Component({
  standalone: true,
  selector: 'hello-world-plugin',
  template: `
    <div class="plugin-container">
      <h2>Hello World Plugin</h2>
      <p>This is my first plugin!</p>
    </div>
  `,
  styles: [`
    .plugin-container {
      padding: 20px;
      border: 2px solid #4caf50;
      border-radius: 8px;
    }
  `]
})
export class HelloWorldPluginComponent implements PluginLifecycle {
  async onLoad(context: PluginContext): Promise<void> {
    console.log('Plugin loaded:', context.pluginName);
  }

  async onActivate(context: PluginContext): Promise<void> {
    console.log('Plugin activated');
  }
}
```

### Create Plugin Manifest

```typescript
// plugins/hello-world/manifest.ts
import { PluginManifest } from 'angular-dynamic-plugin-system';
import { HelloWorldPluginComponent } from './hello-world.component';

export const HelloWorldPluginManifest: PluginManifest = {
  name: 'hello-world',
  version: '1.0.0',
  entryComponent: HelloWorldPluginComponent,
  displayName: 'Hello World Plugin',
  description: 'My first plugin'
};
```

---

## Step 3: Register and Display Plugin (1 minute)

### Register in App Component

```typescript
// app.component.ts
import { Component, OnInit } from '@angular/core';
import { PluginManager, PluginOutletComponent } from 'angular-dynamic-plugin-system';

@Component({
  standalone: true,
  imports: [PluginOutletComponent],
  selector: 'app-root',
  template: `
    <div class="app">
      <h1>My Application</h1>
      <plugin-outlet plugin="hello-world"></plugin-outlet>
    </div>
  `
})
export class AppComponent implements OnInit {
  constructor(private pluginManager: PluginManager) {}

  ngOnInit(): void {
    this.pluginManager.register({
      name: 'hello-world',
      loadFn: () => import('./plugins/hello-world/manifest').then(m => ({
        PluginManifest: m.HelloWorldPluginManifest
      }))
    });
  }
}
```

**Done!** Your plugin is now loaded and displayed. 🎉

---

## Common Patterns

### Pattern 1: Multiple Plugins

```typescript
ngOnInit(): void {
  const plugins = [
    {
      name: 'analytics',
      path: './plugins/analytics/manifest'
    },
    {
      name: 'dashboard',
      path: './plugins/dashboard/manifest'
    },
    {
      name: 'settings',
      path: './plugins/settings/manifest'
    }
  ];

  plugins.forEach(plugin => {
    this.pluginManager.register({
      name: plugin.name,
      loadFn: () => import(plugin.path).then(m => ({
        PluginManifest: m.PluginManifest
      }))
    });
  });
}
```

### Pattern 2: Auto-Load Plugin

```typescript
this.pluginManager.register({
  name: 'my-plugin',
  loadFn: () => import('./my-plugin'),
  config: {
    autoLoad: true  // Loads immediately after registration
  }
});
```

### Pattern 3: Plugin with Service Access

#### Define Host Service

```typescript
// services/notification.service.ts
import { Injectable, InjectionToken } from '@angular/core';

export interface NotificationService {
  showMessage(message: string): void;
}

@Injectable({ providedIn: 'root' })
export class NotificationServiceImpl implements NotificationService {
  showMessage(message: string): void {
    alert(message);
  }
}

export const NOTIFICATION_SERVICE = new InjectionToken<NotificationService>(
  'NOTIFICATION_SERVICE'
);
```

#### Register Provider

```typescript
// main.ts
import { NOTIFICATION_SERVICE, NotificationServiceImpl } from './services/notification.service';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: NOTIFICATION_SERVICE, useClass: NotificationServiceImpl },
    providePluginSystem({
      defaultAllowedServices: [NOTIFICATION_SERVICE]
    })
  ]
});
```

#### Use in Plugin

```typescript
// plugin.component.ts
import { Component, Inject } from '@angular/core';
import {
  PluginLifecycle,
  PluginContext,
  PLUGIN_CONTEXT
} from 'angular-dynamic-plugin-system';
import { NOTIFICATION_SERVICE, NotificationService } from '../services/notification.service';

@Component({
  standalone: true,
  selector: 'my-plugin',
  template: `<button (click)="notify()">Click Me</button>`
})
export class MyPluginComponent implements PluginLifecycle {
  private notificationService?: NotificationService;

  constructor(@Inject(PLUGIN_CONTEXT) private context: PluginContext) {}

  async onLoad(context: PluginContext): Promise<void> {
    this.notificationService = context.getService(NOTIFICATION_SERVICE);
  }

  notify(): void {
    this.notificationService?.showMessage('Hello from plugin!');
  }
}
```

### Pattern 4: Error Handling

```typescript
import { PluginState } from 'angular-dynamic-plugin-system';

constructor(private pluginManager: PluginManager) {
  // Subscribe to plugin state changes
  this.pluginManager.pluginState$.subscribe(event => {
    if (event?.state === PluginState.ERROR) {
      console.error(`Plugin ${event.pluginName} failed:`, event.error);

      // Optional: retry loading
      setTimeout(() => {
        this.pluginManager.load(event.pluginName);
      }, 2000);
    }
  });
}
```

### Pattern 5: Plugin Communication

#### Emitting Events

```typescript
// In plugin component
async onActivate(context: PluginContext): Promise<void> {
  context.emit('user-action', {
    action: 'button-clicked',
    timestamp: new Date()
  });
}
```

#### Subscribing to Events

```typescript
// In plugin component
async onLoad(context: PluginContext): Promise<void> {
  context.subscribe('global-event', (data) => {
    console.log('Received event:', data);
  });
}
```

---

## Common Pitfalls and Solutions

### Pitfall 1: Plugin Not Loading

**Problem:**
```typescript
<plugin-outlet plugin="my-plugin"></plugin-outlet>
// Nothing appears
```

**Solution:** Check that you registered the plugin:
```typescript
ngOnInit(): void {
  this.pluginManager.register({
    name: 'my-plugin',  // Must match plugin-outlet plugin attribute
    loadFn: () => import('./plugins/my-plugin')
  });
}
```

### Pitfall 2: Service Access Returns Null

**Problem:**
```typescript
const httpClient = context.getService(HttpClient);
// httpClient is null
```

**Solution:** Add service to allowed list:
```typescript
this.pluginManager.register({
  name: 'my-plugin',
  loadFn: () => import('./my-plugin'),
  config: {
    allowedServices: [HttpClient]  // Whitelist the service
  }
});
```

### Pitfall 3: Plugin Load Timeout

**Problem:**
```
Error: Plugin load timeout: my-plugin
```

**Solution:** Increase timeout:
```typescript
this.pluginManager.register({
  name: 'my-plugin',
  loadFn: () => import('./my-plugin'),
  config: {
    timeout: 10000  // 10 seconds instead of default
  }
});
```

### Pitfall 4: Manifest Not Exported

**Problem:**
```
Error: module has no exported member 'PluginManifest'
```

**Solution:** Ensure manifest is exported:
```typescript
// manifest.ts
export const PluginManifest: PluginManifest = {  // Must use 'export'
  name: 'my-plugin',
  version: '1.0.0',
  entryComponent: MyPluginComponent
};
```

### Pitfall 5: Component Not Standalone

**Problem:**
```
Error: Component must be standalone
```

**Solution:** Add standalone flag:
```typescript
@Component({
  standalone: true,  // Required for dynamic loading
  selector: 'my-plugin',
  template: '<div>Plugin</div>'
})
export class MyPluginComponent implements PluginLifecycle {
  // ...
}
```

---

## Debugging Tips

### Enable Dev Mode

```typescript
providePluginSystem({
  enableDevMode: true  // More detailed error messages
})
```

### Monitor Plugin States

```typescript
this.pluginManager.pluginState$.subscribe(event => {
  console.log(`Plugin: ${event?.pluginName}, State: ${event?.state}`);
});
```

### Check Plugin Metadata

```typescript
const metadata = this.pluginManager.getPluginMetadata('my-plugin');
console.log('State:', metadata?.state);
console.log('Loaded at:', metadata?.loadedAt);
console.log('Error:', metadata?.error);
```

### List All Plugins

```typescript
const allPlugins = this.pluginManager.getAllPlugins();
console.log('Registered plugins:', allPlugins.map(p => p.manifest.name));
```

---

## Next Steps

### Explore Advanced Features

- **Lifecycle Hooks:** Intercept plugin load/unload events
- **Concurrent Loading:** Control parallel plugin loads
- **Error Recovery:** Implement retry strategies
- **Plugin Communication:** Use event system for cross-plugin communication

### Read Full Documentation

- [API Validation Report](./API_VALIDATION.md)
- [Usage Examples](./examples/usage/)
- [Architecture Documentation](./ARCHITECTURE.md)

---

## Need Help?

### Quick Reference

| Task | Code |
|------|------|
| Register plugin | `pluginManager.register({ name, loadFn })` |
| Load plugin | `await pluginManager.load('plugin-name')` |
| Unload plugin | `await pluginManager.unregister('plugin-name')` |
| Display plugin | `<plugin-outlet plugin="plugin-name"></plugin-outlet>` |
| Check state | `pluginManager.getPluginState('plugin-name')` |
| Get service | `context.getService(SERVICE_TOKEN)` |
| Emit event | `context.emit('event-name', data)` |
| Subscribe to event | `context.subscribe('event-name', handler)` |

### TypeScript Template

```typescript
import { Component, Inject } from '@angular/core';
import {
  PluginManifest,
  PluginLifecycle,
  PluginContext,
  PLUGIN_CONTEXT
} from 'angular-dynamic-plugin-system';

@Component({
  standalone: true,
  selector: 'my-plugin',
  template: '<div>{{ title }}</div>'
})
export class MyPluginComponent implements PluginLifecycle {
  title = 'My Plugin';

  constructor(@Inject(PLUGIN_CONTEXT) private context: PluginContext) {}

  async onLoad(context: PluginContext): Promise<void> {
    // Initialize plugin
  }

  async onActivate(context: PluginContext): Promise<void> {
    // Plugin is now visible
  }

  async onDeactivate(): Promise<void> {
    // Plugin is being hidden
  }

  async onDestroy(): Promise<void> {
    // Clean up resources
  }
}

export const PluginManifest: PluginManifest = {
  name: 'my-plugin',
  version: '1.0.0',
  entryComponent: MyPluginComponent,
  displayName: 'My Plugin',
  description: 'Plugin description'
};
```

---

**Happy Plugin Development!** 🚀
