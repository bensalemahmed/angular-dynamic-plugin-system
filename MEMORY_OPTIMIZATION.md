# Memory Optimization Guide

## v1.1.2 - Memory Optimizations for Lazy Loading

### Overview

Version 1.1.2 introduces significant memory management improvements to optimize plugin lifecycle and reduce memory footprint when plugins are unloaded.

### Key Improvements

#### 1. **Module Reference Tracking**
The system now tracks loaded module references in `PluginMetadata`:
```typescript
interface PluginMetadata {
  // ... existing fields
  moduleReference?: any;      // Tracks loaded module for cleanup
  injectorReference?: any;    // Tracks injector for proper cleanup
}
```

#### 2. **Enhanced Memory Cleanup**
When a plugin is unregistered, the system now:

1. **Destroys Component** - Properly destroys Angular component instances
2. **Destroys Injector** - Explicitly destroys the plugin's injector
3. **Clears References** - Sets all references to `null` to help garbage collection
4. **Destroys Context** - Cleans up the plugin context

```typescript
// Cleanup sequence in unregister():
1. Call onDeactivate() lifecycle hook
2. Destroy componentRef
3. Destroy injectorReference
4. Clear moduleReference
5. Destroy context
6. Remove from registry
```

#### 3. **Garbage Collection Assistance**
By explicitly clearing all references, we help the JavaScript garbage collector:
- Module references are nullified
- Injector references are destroyed and nullified
- Component references are destroyed and nullified
- Context is destroyed

### Lazy Loading with Dynamic Imports

#### Best Practice Example

```typescript
// In your app component
pluginManager.register({
  name: 'analytics',
  loadFn: async () => {
    // Dynamic import - code only loaded when called
    const module = await import('./plugins/analytics-plugin.component');
    return {
      PluginManifest: {
        name: 'analytics',
        version: '1.0.0',
        entryComponent: module.AnalyticsPluginComponent,
        displayName: 'Analytics Dashboard',
        description: 'Real-time analytics and insights'
      }
    };
  }
});
```

#### Bundle Size Impact

With dynamic imports, you get true code splitting:

**Before (without dynamic imports):**
```
main.js: 128 KB (includes all plugin code)
```

**After (with dynamic imports):**
```
main.js: 113 KB (base app code)
analytics-plugin.chunk.js: 7.27 KB (loaded on demand)
reports-plugin.chunk.js: 7.72 KB (loaded on demand)
```

**FREE tier users save ~15 KB** by never downloading plugin code!

### Memory Lifecycle

#### When Plugin is Loaded
1. `loadFn()` is called → Module is imported and cached by browser
2. Module reference stored in `moduleReference`
3. Injector created and stored in `injectorReference`
4. Component can be created from the loaded module

#### When Plugin is Unloaded
1. Component destroyed (if exists)
2. Injector destroyed and reference cleared
3. Module reference cleared
4. Context destroyed
5. Plugin removed from registry

### Important Notes

#### JavaScript Module Cache Limitation

**Note:** JavaScript/TypeScript modules loaded via `import()` remain in the browser's module cache until page reload. The memory optimizations help by:

1. **Clearing all Angular-specific references** (components, injectors, contexts)
2. **Allowing garbage collection** of Angular objects
3. **Reducing active memory footprint**

However, the raw module code itself remains cached. This is a browser limitation, not a library limitation.

#### What Gets Cleaned Up
✅ Angular component instances
✅ Dependency injection containers
✅ Plugin contexts and metadata
✅ Event listeners and subscriptions

#### What Remains Cached
❌ JavaScript module code (browser cache)
❌ TypeScript class definitions

This is actually GOOD for performance - if user switches tiers frequently, plugins reload instantly without network requests!

### Memory Profiling

To verify memory improvements:

1. Open Chrome DevTools → Memory tab
2. Take heap snapshot before loading plugin
3. Load plugin (e.g., switch to PRO tier)
4. Take heap snapshot after loading
5. Unload plugin (switch to FREE tier)
6. Force garbage collection (DevTools → Memory → 🗑️ icon)
7. Take final heap snapshot

You should see:
- Angular components removed
- Injectors destroyed
- Context objects cleaned up
- Significant reduction in "Detached DOM nodes"

### Comparison with v1.1.1

| Aspect | v1.1.1 | v1.1.2 |
|--------|--------|--------|
| Component cleanup | ✅ Yes | ✅ Yes |
| Injector cleanup | ⚠️ Partial | ✅ Explicit |
| Module reference tracking | ❌ No | ✅ Yes |
| Context cleanup | ⚠️ Implicit | ✅ Explicit |
| Reference nullification | ⚠️ Partial | ✅ Complete |
| Garbage collection hints | ❌ No | ✅ Yes |

### Migration from v1.1.1 to v1.1.2

No breaking changes! Simply update:

```bash
npm install @angular-dynamic/plugin-system@1.1.2
```

All existing code continues to work. Memory improvements are automatic.

### Best Practices for Memory Management

1. **Use Dynamic Imports**
   ```typescript
   loadFn: async () => await import('./my-plugin')
   ```

2. **Implement Cleanup in Lifecycle Hooks**
   ```typescript
   class MyPlugin implements PluginLifecycle {
     private subscriptions: Subscription[] = [];

     async onDestroy(): Promise<void> {
       // Clean up subscriptions
       this.subscriptions.forEach(sub => sub.unsubscribe());
       this.subscriptions = [];
     }
   }
   ```

3. **Avoid Global State**
   - Don't store plugin data in global variables
   - Use plugin context for state management
   - Clean up in `onDestroy()` hook

4. **Monitor Memory in Development**
   - Use Chrome DevTools Memory profiler
   - Take snapshots before/after plugin operations
   - Look for memory leaks in your plugin code

### Technical Implementation Details

#### PluginMetadata Interface Changes

```typescript
// v1.1.1
interface PluginMetadata {
  manifest: PluginManifest;
  state: PluginState;
  componentRef?: any;
  // ...
}

// v1.1.2 (new fields)
interface PluginMetadata {
  manifest: PluginManifest;
  state: PluginState;
  componentRef?: any;
  moduleReference?: any;      // NEW
  injectorReference?: any;    // NEW
  // ...
}
```

#### Enhanced Unregister Flow

```typescript
// v1.1.2 implementation
private async executeUnregister(pluginName: string): Promise<void> {
  // ... existing checks ...

  // Destroy component
  if (metadata.componentRef) {
    await this.destroyComponent(metadata.componentRef, pluginName);
  }

  // NEW: Destroy injector
  if (metadata.injectorReference) {
    metadata.injectorReference.destroy();
  }

  // NEW: Clear all references
  this.registry.updateMetadata(pluginName, {
    moduleReference: null,
    injectorReference: null,
    componentRef: null,
    error: undefined
  });

  // NEW: Destroy context
  const context = this.registry.getContext(pluginName);
  if (context) {
    context.destroy();
  }

  // Remove from registry
  this.registry.unregister(pluginName);
}
```

### Conclusion

v1.1.2 provides the best possible memory management within JavaScript/Angular constraints:

✅ Explicit cleanup of all Angular resources
✅ Reference nullification for garbage collection
✅ True lazy loading with code splitting
✅ Optimal memory footprint

While module code remains cached (browser limitation), all active objects are properly cleaned up, resulting in minimal memory overhead for inactive plugins.
