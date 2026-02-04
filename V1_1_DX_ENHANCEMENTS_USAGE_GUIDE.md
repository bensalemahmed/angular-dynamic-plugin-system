# Angular Dynamic Plugin System v1.1.0
# DX Enhancements - Developer Usage Guide

Quick reference for developers using the new v1.1.0 DX features.

---

## 🎯 Quick Start

All v1.1.0 DX features are **optional** and **disabled by default**. Your existing v1.0.0 code works unchanged.

---

## 📊 Feature #1: Plugin Info API

Get detailed information about any plugin's current state.

### Basic Usage

```typescript
import { PluginManager, PluginInfo } from '@angular-dynamic/plugin-system';

const pluginManager = inject(PluginManager);

// Get plugin information
const info: PluginInfo | undefined = pluginManager.getPluginInfo('invoice');

if (info) {
  console.log('Plugin Name:', info.name);
  console.log('Current State:', info.state);
  console.log('Loaded At:', info.loadedAt);
  console.log('Has Component:', info.hasComponent);
  console.log('Error Count:', info.errorCount);

  if (info.lastError) {
    console.error('Last Error:', info.lastError.message);
  }
}
```

### Monitoring Plugin Health

```typescript
function checkPluginHealth(pluginName: string): boolean {
  const info = pluginManager.getPluginInfo(pluginName);

  if (!info) {
    console.warn(`Plugin '${pluginName}' not found`);
    return false;
  }

  // Check if plugin is in error state
  if (info.state === PluginState.ERROR) {
    console.error(`Plugin '${pluginName}' is in error state`);
    if (info.lastError) {
      console.error('Error:', info.lastError.message);
    }
    return false;
  }

  // Check for excessive errors
  if (info.errorCount > 3) {
    console.warn(`Plugin '${pluginName}' has ${info.errorCount} errors`);
    return false;
  }

  return true;
}
```

### Tracking Plugin Uptime

```typescript
function getPluginUptime(pluginName: string): string {
  const info = pluginManager.getPluginInfo(pluginName);

  if (!info?.activatedAt) {
    return 'Not activated';
  }

  const uptime = Date.now() - info.activatedAt.getTime();
  const seconds = Math.floor(uptime / 1000);
  const minutes = Math.floor(seconds / 60);

  return `${minutes}m ${seconds % 60}s`;
}
```

### Dashboard Example

```typescript
@Component({
  selector: 'app-plugin-dashboard',
  template: `
    <div class="plugin-dashboard">
      <div *ngFor="let plugin of pluginInfoList" class="plugin-card">
        <h3>{{ plugin.name }}</h3>
        <span [class]="'badge badge-' + plugin.state.toLowerCase()">
          {{ plugin.state }}
        </span>
        <p>Loaded: {{ plugin.loadedAt | date:'short' }}</p>
        <p *ngIf="plugin.activatedAt">
          Active: {{ plugin.activatedAt | date:'short' }}
        </p>
        <p>Errors: {{ plugin.errorCount }}</p>
        <div *ngIf="plugin.lastError" class="error">
          {{ plugin.lastError.message }}
        </div>
      </div>
    </div>
  `
})
export class PluginDashboardComponent implements OnInit {
  pluginInfoList: PluginInfo[] = [];

  constructor(private pluginManager: PluginManager) {}

  ngOnInit() {
    // Get all plugins
    const allPlugins = this.pluginManager.getAllPlugins();

    // Get detailed info for each
    this.pluginInfoList = allPlugins
      .map(p => this.pluginManager.getPluginInfo(p.manifest.name))
      .filter((info): info is PluginInfo => info !== undefined);
  }
}
```

---

## 🚨 Feature #2: Enhanced Error Messages

All errors now include actionable suggestions and documentation links.

### Basic Error Handling

```typescript
try {
  await pluginManager.load('myPlugin');
} catch (error) {
  if (error instanceof PluginError) {
    // Standard error message
    console.error('Error:', error.message);

    // NEW: Actionable suggestion
    if (error.suggestion) {
      console.warn('💡 Suggestion:', error.suggestion);
    }

    // NEW: Documentation link
    if (error.docs) {
      console.info('📖 Documentation:', error.docs);
    }

    // Original cause (if any)
    if (error.cause) {
      console.error('Caused by:', error.cause);
    }
  }
}
```

### User-Friendly Error Display

```typescript
@Component({
  selector: 'app-plugin-loader',
  template: `
    <div *ngIf="error" class="error-container">
      <h3>{{ error.message }}</h3>
      <p class="suggestion">{{ error.suggestion }}</p>
      <a [href]="error.docs" target="_blank">View Documentation</a>
    </div>
  `
})
export class PluginLoaderComponent {
  error?: PluginError;

  async loadPlugin(name: string) {
    try {
      await this.pluginManager.load(name);
      this.error = undefined;
    } catch (e) {
      if (e instanceof PluginError) {
        this.error = e;
      }
    }
  }
}
```

### Error Types with Enhanced Messages

```typescript
// PluginNotFoundError
// Message: "Plugin not found: invoice"
// Suggestion: "Ensure the plugin is registered before attempting to load..."
// Docs: "https://github.com/.../plugin-registration"

// PluginLoadError
// Message: "Failed to load plugin: invoice"
// Suggestion: "Check that the plugin file exists and is accessible..."
// Docs: "https://github.com/.../troubleshooting"

// PluginLifecycleTimeoutError
// Message: "Lifecycle hook 'onLoad' timed out after 5000ms for plugin invoice"
// Suggestion: "Optimize the hook implementation or increase lifecycleHookTimeout..."
// Docs: "https://github.com/.../lifecycle-timeouts"

// PluginStateError
// Message: "Plugin invoice is in LOADING state, expected LOADED"
// Suggestion: "Wait for the plugin to reach LOADED state..."
// Docs: "https://github.com/.../plugin-states"
```

---

## 🐛 Feature #3: Debug Mode

Enable detailed logging to troubleshoot plugin issues.

### Enable All Debug Features

```typescript
import { providePluginSystem } from '@angular-dynamic/plugin-system';

export const appConfig: ApplicationConfig = {
  providers: [
    providePluginSystem({
      enableDevMode: true,
      debugOptions: {
        logLifecycleHooks: true,      // Log hook execution with timing
        logStateTransitions: true,    // Log state changes
        validateManifests: true,      // Strict manifest validation
        throwOnWarnings: false        // Log warnings without throwing
      }
    })
  ]
};
```

### Selective Debug Logging

```typescript
// Enable only lifecycle logging
providePluginSystem({
  enableDevMode: true,
  debugOptions: {
    logLifecycleHooks: true
  }
})

// Enable only state transitions
providePluginSystem({
  enableDevMode: true,
  debugOptions: {
    logStateTransitions: true
  }
})

// Enable manifest validation
providePluginSystem({
  enableDevMode: true,
  debugOptions: {
    validateManifests: true,
    throwOnWarnings: true  // Throw on validation warnings
  }
})
```

### Console Output Examples

**With `logLifecycleHooks: true`:**
```
[PluginSystem] Loading module for plugin 'invoice'
[PluginSystem] Module loaded in 234ms for plugin 'invoice'
[PluginSystem] Calling onLoad() for plugin 'invoice'
[PluginSystem] onLoad() completed in 45ms for plugin 'invoice'
[PluginSystem] Creating component for plugin 'invoice'
[PluginSystem] Calling onActivate() for plugin 'invoice'
[PluginSystem] onActivate() completed in 12ms for plugin 'invoice'
```

**With `logStateTransitions: true`:**
```
[PluginSystem] Plugin 'invoice' → LOADING { from: 'REGISTERED', to: 'LOADING' }
[PluginSystem] Plugin 'invoice' → LOADED { from: 'LOADING', to: 'LOADED' }
[PluginSystem] Plugin 'invoice' → ACTIVE { from: 'LOADED', to: 'ACTIVE' }
```

**With `validateManifests: true`:**
```
[PluginSystem] Plugin 'invoice' manifest validation warnings:
Manifest version '1.0' does not follow semver format
```

### Production vs Development

```typescript
// development.ts
export const environment = {
  production: false,
  pluginDebug: {
    logLifecycleHooks: true,
    logStateTransitions: true,
    validateManifests: true
  }
};

// production.ts
export const environment = {
  production: true,
  pluginDebug: {
    logLifecycleHooks: false,  // Disabled in production
    logStateTransitions: false,
    validateManifests: false
  }
};

// app.config.ts
providePluginSystem({
  enableDevMode: !environment.production,
  debugOptions: environment.pluginDebug
})
```

---

## 🔒 Feature #4: isUnloading() Method

Check if a plugin is currently being unloaded to avoid race conditions.

### Basic Usage

```typescript
// Check before attempting to unload
if (!pluginManager.isUnloading('invoice')) {
  await pluginManager.unregister('invoice');
} else {
  console.log('Plugin is already being unloaded');
}
```

### Safe Unload Pattern

```typescript
async function safeUnloadPlugin(pluginName: string): Promise<boolean> {
  // Check if already unloading
  if (pluginManager.isUnloading(pluginName)) {
    console.warn(`Plugin '${pluginName}' is already unloading`);
    return false;
  }

  // Check if plugin exists
  const state = pluginManager.getPluginState(pluginName);
  if (!state) {
    console.warn(`Plugin '${pluginName}' not found`);
    return false;
  }

  try {
    await pluginManager.unregister(pluginName);
    return true;
  } catch (error) {
    console.error(`Failed to unload plugin '${pluginName}'`, error);
    return false;
  }
}
```

### Unload Queue Manager

```typescript
class PluginUnloadQueue {
  private queue: string[] = [];
  private processing = false;

  constructor(private pluginManager: PluginManager) {}

  async unloadPlugin(pluginName: string): Promise<void> {
    // Add to queue
    this.queue.push(pluginName);

    // Start processing if not already
    if (!this.processing) {
      await this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    this.processing = true;

    while (this.queue.length > 0) {
      const pluginName = this.queue.shift()!;

      // Skip if already unloading
      if (this.pluginManager.isUnloading(pluginName)) {
        console.log(`Skipping ${pluginName} - already unloading`);
        continue;
      }

      try {
        await this.pluginManager.unregister(pluginName);
        console.log(`Successfully unloaded ${pluginName}`);
      } catch (error) {
        console.error(`Failed to unload ${pluginName}`, error);
      }
    }

    this.processing = false;
  }
}
```

---

## 🎨 Complete Example

Here's a complete example using all v1.1.0 DX features:

```typescript
import { Component, inject, OnInit } from '@angular/core';
import {
  PluginManager,
  PluginInfo,
  PluginState,
  PluginError
} from '@angular-dynamic/plugin-system';

@Component({
  selector: 'app-plugin-manager',
  template: `
    <div class="plugin-manager">
      <!-- Plugin List -->
      <div class="plugin-list">
        <h2>Installed Plugins</h2>
        <div *ngFor="let plugin of plugins" class="plugin-item">
          <div class="plugin-header">
            <h3>{{ plugin.name }}</h3>
            <span class="badge" [class.error]="plugin.state === 'ERROR'">
              {{ plugin.state }}
            </span>
          </div>

          <div class="plugin-details">
            <p *ngIf="plugin.loadedAt">
              Loaded: {{ plugin.loadedAt | date:'short' }}
            </p>
            <p *ngIf="plugin.activatedAt">
              Active: {{ plugin.activatedAt | date:'short' }}
            </p>
            <p *ngIf="plugin.errorCount > 0" class="error-count">
              Errors: {{ plugin.errorCount }}
            </p>
          </div>

          <div class="plugin-actions">
            <button
              (click)="loadPlugin(plugin.name)"
              [disabled]="plugin.state === 'LOADED' || plugin.state === 'ACTIVE'">
              Load
            </button>
            <button
              (click)="unloadPlugin(plugin.name)"
              [disabled]="plugin.state !== 'LOADED' && plugin.state !== 'ACTIVE'"
              [class.loading]="isPluginUnloading(plugin.name)">
              {{ isPluginUnloading(plugin.name) ? 'Unloading...' : 'Unload' }}
            </button>
          </div>

          <div *ngIf="plugin.lastError" class="error-message">
            <strong>Error:</strong> {{ plugin.lastError.message }}
            <p *ngIf="getErrorSuggestion(plugin.name)" class="suggestion">
              💡 {{ getErrorSuggestion(plugin.name) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Status Messages -->
      <div class="status-messages">
        <div *ngFor="let msg of messages"
             [class]="'message message-' + msg.type">
          {{ msg.text }}
        </div>
      </div>
    </div>
  `
})
export class PluginManagerComponent implements OnInit {
  private pluginManager = inject(PluginManager);

  plugins: PluginInfo[] = [];
  messages: Array<{type: string, text: string}> = [];

  ngOnInit() {
    this.refreshPluginList();

    // Subscribe to plugin state changes
    this.pluginManager.pluginState$.subscribe(event => {
      this.refreshPluginList();
      this.addMessage('info', `Plugin '${event.pluginName}' → ${event.state}`);
    });
  }

  refreshPluginList() {
    const allPlugins = this.pluginManager.getAllPlugins();
    this.plugins = allPlugins
      .map(p => this.pluginManager.getPluginInfo(p.manifest.name))
      .filter((info): info is PluginInfo => info !== undefined);
  }

  async loadPlugin(pluginName: string) {
    try {
      await this.pluginManager.load(pluginName);
      this.addMessage('success', `Plugin '${pluginName}' loaded successfully`);
    } catch (error) {
      this.handleError(pluginName, error);
    }
  }

  async unloadPlugin(pluginName: string) {
    // Check if already unloading (v1.1.0 feature)
    if (this.isPluginUnloading(pluginName)) {
      this.addMessage('warning', `Plugin '${pluginName}' is already unloading`);
      return;
    }

    try {
      await this.pluginManager.unregister(pluginName);
      this.addMessage('success', `Plugin '${pluginName}' unloaded successfully`);
    } catch (error) {
      this.handleError(pluginName, error);
    }
  }

  isPluginUnloading(pluginName: string): boolean {
    return this.pluginManager.isUnloading(pluginName);
  }

  getErrorSuggestion(pluginName: string): string | undefined {
    const info = this.pluginManager.getPluginInfo(pluginName);
    if (info?.lastError && info.lastError instanceof PluginError) {
      return info.lastError.suggestion;
    }
    return undefined;
  }

  private handleError(pluginName: string, error: unknown) {
    if (error instanceof PluginError) {
      // Enhanced error handling (v1.1.0 feature)
      this.addMessage('error', error.message);

      if (error.suggestion) {
        this.addMessage('info', `💡 ${error.suggestion}`);
      }

      if (error.docs) {
        this.addMessage('info', `📖 See: ${error.docs}`);
      }
    } else {
      this.addMessage('error', `Unknown error in plugin '${pluginName}'`);
    }
  }

  private addMessage(type: string, text: string) {
    this.messages.push({ type, text });

    // Auto-remove after 5 seconds
    setTimeout(() => {
      const index = this.messages.findIndex(m => m.text === text);
      if (index >= 0) {
        this.messages.splice(index, 1);
      }
    }, 5000);
  }
}
```

---

## 🚀 Performance Tips

### 1. Use Debug Mode Only in Development

```typescript
// Don't enable debug in production
providePluginSystem({
  enableDevMode: !environment.production,
  debugOptions: {
    logLifecycleHooks: !environment.production,
    logStateTransitions: !environment.production
  }
})
```

### 2. Cache Plugin Info Results

```typescript
// Instead of calling getPluginInfo() repeatedly
const info = this.pluginManager.getPluginInfo(pluginName); // ❌ Called every change detection

// Cache the result
private pluginInfoCache = new Map<string, PluginInfo>();

getPluginInfo(pluginName: string): PluginInfo | undefined {
  if (!this.pluginInfoCache.has(pluginName)) {
    const info = this.pluginManager.getPluginInfo(pluginName);
    if (info) {
      this.pluginInfoCache.set(pluginName, info);
    }
  }
  return this.pluginInfoCache.get(pluginName);
}
```

### 3. Use isUnloading() Before State Checks

```typescript
// Efficient check
if (this.pluginManager.isUnloading(pluginName)) {
  return; // Fast return
}

// Then do more expensive checks
const info = this.pluginManager.getPluginInfo(pluginName);
```

---

## 📚 API Reference

### PluginInfo Interface

```typescript
interface PluginInfo {
  name: string;              // Plugin name
  state: PluginState;        // Current state
  loadedAt?: Date;           // When plugin was loaded
  activatedAt?: Date;        // When component was activated
  manifest?: PluginManifest; // Plugin manifest
  hasComponent: boolean;     // Whether component is mounted
  errorCount: number;        // Total error count
  lastError?: Error;         // Most recent error
}
```

### PluginDebugOptions Interface

```typescript
interface PluginDebugOptions {
  logLifecycleHooks?: boolean;   // Log hook execution with timing
  logStateTransitions?: boolean; // Log state changes
  validateManifests?: boolean;   // Strict manifest validation
  throwOnWarnings?: boolean;     // Treat warnings as errors
}
```

### Enhanced Methods

```typescript
class PluginManager {
  // NEW: Get detailed plugin information
  getPluginInfo(pluginName: string): PluginInfo | undefined;

  // NEW: Check if plugin is unloading
  isUnloading(pluginName: string): boolean;
}
```

### Enhanced Error Properties

```typescript
class PluginError extends Error {
  readonly suggestion?: string;  // Actionable guidance
  readonly docs?: string;        // Documentation URL
}
```

---

## 🤝 Migration from v1.0.0

**No migration needed!** All v1.0.0 code works unchanged.

To use new features, simply opt-in:

```typescript
// v1.0.0 (still works)
providePluginSystem()

// v1.1.0 (with new features)
providePluginSystem({
  enableDevMode: true,
  debugOptions: {
    logLifecycleHooks: true
  }
})
```

---

## 📝 Best Practices

1. **Enable debug mode in development** for better troubleshooting
2. **Check error.suggestion** for actionable guidance
3. **Use getPluginInfo()** for plugin health monitoring
4. **Use isUnloading()** to prevent race conditions
5. **Disable debug in production** for performance
6. **Cache plugin info** when displaying in UI

---

## 🐛 Troubleshooting

### Debug Mode Not Working

Make sure both flags are enabled:
```typescript
providePluginSystem({
  enableDevMode: true,        // Required
  debugOptions: {
    logLifecycleHooks: true   // Must also be enabled
  }
})
```

### getPluginInfo Returns Undefined

The plugin must be registered first:
```typescript
// Register first
pluginManager.register({ name: 'test', loadFn: () => import('./test') });

// Then you can get info
const info = pluginManager.getPluginInfo('test'); // Now works
```

### Error Suggestions Not Showing

Check if error is a PluginError:
```typescript
if (error instanceof PluginError) {
  console.log(error.suggestion); // Only PluginError has this
}
```

---

**Ready to use v1.1.0 DX features!** 🎉
