# Migration Guide

This guide helps you migrate between major versions of the Angular Dynamic Plugin System.

## Table of Contents

- [Overview](#overview)
- [Migration Path](#migration-path)
- [Version 1.x to 2.x](#version-1x-to-2x)
- [Version 2.x to 3.x](#version-2x-to-3x)
- [Breaking Changes Policy](#breaking-changes-policy)

---

## Overview

The Angular Dynamic Plugin System follows [Semantic Versioning](https://semver.org/):

- **Major versions** (e.g., 1.x → 2.x): May include breaking changes
- **Minor versions** (e.g., 1.0 → 1.1): New features, backward compatible
- **Patch versions** (e.g., 1.0.0 → 1.0.1): Bug fixes, backward compatible

This guide focuses on major version migrations that may require code changes.

---

## Migration Path

### Current Version: 1.x

The latest stable version is v1.1.0.

### Quick Links
- [v1.0.0 → v1.1.0](#version-100-to-110) (No migration required!)
- [v1.x → v2.x](#version-1x-to-2x) (Planned)

### Preparing for Future Migrations

To minimize migration effort in future versions:

1. **Use the Public API Only**
   - Avoid accessing internal services like `PluginRegistry` directly
   - Use `PluginManager` as the primary interface
   - Don't rely on undocumented behavior

2. **Follow Deprecation Warnings**
   - Future minor versions may deprecate APIs before removing them
   - Watch for console warnings in development mode
   - Update deprecated code as soon as possible

3. **Keep Dependencies Updated**
   - Maintain Angular and TypeScript at recommended versions
   - Update RxJS to latest compatible version
   - Test your plugins with new versions

4. **Pin Major Version**
   - Use `^1.0.0` in package.json to get patches and minor updates
   - Test thoroughly before upgrading to major versions

---

## Version 1.0.0 to 1.1.0

**Status:** Released (2026-02-04)
**Breaking Changes:** None
**Migration Required:** None
**Effort:** Zero - Drop-in replacement

### Summary

Version 1.1.0 is a **stability and reliability release** with **100% backward compatibility**. All v1.0.0 code works without any modifications.

### What Changed?

**Critical Fixes (Automatic):**
- Lifecycle hook timeout protection (default: 5 seconds)
- Memory leak prevention (ComponentRef and context cleanup)
- Race condition protection (safe concurrent operations)
- Better error handling and cleanup

**New Optional Features:**
- Enhanced debug mode with granular logging
- Plugin health monitoring via `getPluginInfo()`
- Unload status checking via `isUnloading()`

### Upgrade Steps

#### Step 1: Update Package

```bash
npm install @angular-dynamic/plugin-system@^1.1.0
```

#### Step 2: Test Your Application

No code changes required, but verify:
- All plugins load and unload correctly
- No new console errors
- Lifecycle hooks complete within 5 seconds (or configure longer timeout)

#### Step 3: That's It!

Your v1.0.0 code works identically in v1.1.0.

### Optional: Adopt New Features

#### Configure Lifecycle Timeout (Optional)

If your plugins have slow initialization (>5 seconds):

```typescript
// Before (v1.0.0) - No timeout
providePluginSystem({
  globalTimeout: 30000
})

// After (v1.1.0) - Add lifecycle hook timeout
providePluginSystem({
  globalTimeout: 30000,
  lifecycleHookTimeout: 10000 // 10 seconds for lifecycle hooks
})
```

To disable timeout (not recommended):
```typescript
providePluginSystem({
  lifecycleHookTimeout: 0 // or Infinity
})
```

#### Enable Enhanced Debug Mode (Optional)

```typescript
// Before (v1.0.0)
providePluginSystem({
  enableDevMode: true
})

// After (v1.1.0) - Granular debug options
providePluginSystem({
  enableDevMode: true,
  debugOptions: {
    logLifecycleHooks: true,      // Log hook timing
    logStateTransitions: true,     // Log state changes
    validateManifests: true,       // Strict validation
    throwOnWarnings: false         // Treat warnings as errors
  }
})
```

Console output example:
```
[PluginSystem] Plugin 'invoice' → LOADING
[PluginSystem] Calling onLoad() for plugin 'invoice'
[PluginSystem] onLoad() completed in 89ms for plugin 'invoice'
[PluginSystem] Plugin 'invoice' → LOADED
```

#### Use Plugin Health Monitoring (Optional)

```typescript
// New in v1.1.0
const info = pluginManager.getPluginInfo('invoice');
if (info) {
  console.log(`State: ${info.state}`);
  console.log(`Loaded at: ${info.loadedAt}`);
  console.log(`Error count: ${info.errorCount}`);

  if (info.errorCount > 3) {
    // Plugin has issues, consider reloading
    await pluginManager.unregister('invoice');
    await pluginManager.load('invoice');
  }
}
```

#### Check Unload Status (Optional)

```typescript
// New in v1.1.0
if (!pluginManager.isUnloading('invoice')) {
  await pluginManager.unregister('invoice');
}

// Or simply call unregister - concurrent calls are now safe
await pluginManager.unregister('invoice');
await pluginManager.unregister('invoice'); // Safe, returns same promise
```

### New Error Types

Handle new error types if needed:

```typescript
// New in v1.1.0: Lifecycle timeout error
try {
  await pluginManager.load('slow-plugin');
} catch (error) {
  if (error instanceof PluginLifecycleTimeoutError) {
    console.error(`Hook ${error.hookName} timed out after ${error.timeoutMs}ms`);
    // Consider increasing timeout or fixing plugin
  }
}

// New in v1.1.0: Operation in progress error
try {
  await pluginManager.createPluginComponent('invoice', viewContainer);
} catch (error) {
  if (error instanceof PluginOperationInProgressError) {
    console.error(`Cannot perform operation: ${error.operation} in progress`);
    // Wait and retry
  }
}
```

### API Additions

All additions are **optional** and **backward compatible**:

#### New Methods
```typescript
class PluginManager {
  // Check if plugin is currently being unloaded
  isUnloading(pluginName: string): boolean;

  // Get detailed plugin information
  getPluginInfo(pluginName: string): PluginInfo | undefined;
}
```

#### New Configuration Options
```typescript
interface PluginSystemConfig {
  lifecycleHookTimeout?: number; // Default: 5000ms
  debugOptions?: PluginDebugOptions;
}
```

#### New Types
```typescript
interface PluginInfo {
  name: string;
  state: PluginState;
  loadedAt?: Date;
  activatedAt?: Date;
  manifest?: PluginManifest;
  hasComponent: boolean;
  errorCount: number;
  lastError?: Error;
}

interface PluginDebugOptions {
  logLifecycleHooks?: boolean;
  logStateTransitions?: boolean;
  validateManifests?: boolean;
  throwOnWarnings?: boolean;
}
```

### What Stayed the Same?

Everything:
- All v1.0.0 APIs work identically
- All behaviors preserved
- No configuration changes required
- No performance regression

### Compatibility Verification

Run this checklist to verify compatibility:

```typescript
// 1. Basic plugin load (should work identically)
await pluginManager.load('invoice');

// 2. Plugin outlet (should work identically)
<plugin-outlet [plugin]="'invoice'"></plugin-outlet>

// 3. Error handling (should work identically)
try {
  await pluginManager.load('broken-plugin');
} catch (error) {
  if (error instanceof PluginLoadError) {
    // Handles v1.0.0 and v1.1.0 errors
  }
}

// 4. Lifecycle hooks (now have timeout protection)
// Plugins completing within 5s work identically
// Plugins taking >5s will timeout (configure lifecycleHookTimeout)
```

### Common Scenarios

#### Scenario 1: Basic Plugin System
```typescript
// v1.0.0 code
pluginManager.register({ name: 'invoice', loadFn: () => import('./invoice') });
await pluginManager.load('invoice');

// Works identically in v1.1.0 ✅
```

#### Scenario 2: Plugin with Slow Initialization
```typescript
// v1.0.0 code - could hang indefinitely
export class SlowPlugin implements PluginLifecycle {
  async onLoad(context: PluginContext) {
    await this.longInitialization(); // Takes 8 seconds
  }
}

// v1.1.0 - times out after 5 seconds by default
// Solution: Configure longer timeout
providePluginSystem({
  lifecycleHookTimeout: 10000 // 10 seconds
})
```

#### Scenario 3: Concurrent Unload
```typescript
// v1.0.0 code - could cause errors
await Promise.all([
  pluginManager.unregister('invoice'),
  pluginManager.unregister('invoice')
]);

// v1.1.0 - safe, both calls return same promise ✅
```

### Troubleshooting

#### Issue: Plugin times out during onLoad

**Cause:** Plugin's `onLoad()` takes longer than 5 seconds.

**Solution:**
```typescript
// Option 1: Increase timeout
providePluginSystem({
  lifecycleHookTimeout: 15000
})

// Option 2: Optimize plugin initialization
export class MyPlugin implements PluginLifecycle {
  async onLoad(context: PluginContext) {
    // Move slow operations to background
    this.initializeInBackground();
  }
}
```

#### Issue: New console warnings in dev mode

**Cause:** Enhanced manifest validation in debug mode.

**Solution:**
```typescript
// Review and fix manifest issues
export const PluginManifest = {
  name: 'invoice',
  version: '1.0.0', // Ensure valid semver
  entryComponent: InvoiceComponent
};
```

### Testing Your Migration

1. **Install v1.1.0**
   ```bash
   npm install @angular-dynamic/plugin-system@^1.1.0
   ```

2. **Run your test suite**
   ```bash
   npm test
   ```

3. **Test in development**
   - Load all plugins
   - Test plugin lifecycle
   - Verify no new errors

4. **Monitor production**
   - Watch for `PluginLifecycleTimeoutError`
   - Monitor plugin health with `getPluginInfo()`

### Migration Checklist

- [ ] Update package to v1.1.0
- [ ] Run test suite - verify all pass
- [ ] Test plugin load/unload in dev
- [ ] Review lifecycle hook timing (should be <5s)
- [ ] Configure `lifecycleHookTimeout` if needed
- [ ] (Optional) Enable debug mode for troubleshooting
- [ ] (Optional) Add plugin health monitoring
- [ ] Deploy to production
- [ ] Monitor for timeout errors

### Rollback Plan

If you encounter issues:

```bash
# Rollback to v1.0.0
npm install @angular-dynamic/plugin-system@^1.0.0
```

However, rollback is unnecessary - v1.1.0 is fully compatible.

### Questions?

- [RELEASE_NOTES_V1_1_0.md](../RELEASE_NOTES_V1_1_0.md) - Detailed release information
- [CHANGELOG.md](../CHANGELOG.md) - All changes
- [GitHub Issues](https://github.com/angular-dynamic/plugin-system/issues) - Ask questions

---

## Version 1.x to 2.x

**Status:** Planned (Not Yet Released)

Version 2.x will focus on enhanced plugin management and remote loading capabilities.

### Planned Breaking Changes

#### 1. Plugin Dependency Resolution

**Current (v1):**
Plugins load independently with no dependency management.

**Future (v2):**
```typescript
// Plugin manifest will support dependencies
export const PluginManifest = {
  name: 'reports',
  version: '1.0.0',
  entryComponent: ReportsComponent,
  dependencies: {
    plugins: ['data-service'], // Other plugins
    packages: {
      '@angular/common': '>=16.0.0'
    }
  }
};
```

**Migration:**
- Review plugins that depend on others
- Add explicit dependency declarations
- Test load order with new dependency resolver

#### 2. Router Integration

**Current (v1):**
Plugins cannot register routes dynamically.

**Future (v2):**
```typescript
// Plugins will be able to register routes
export const PluginManifest = {
  name: 'invoice',
  version: '1.0.0',
  entryComponent: InvoicePluginComponent,
  routes: [
    { path: 'invoice/list', component: InvoiceListComponent },
    { path: 'invoice/:id', component: InvoiceDetailComponent }
  ]
};
```

**Migration:**
- Extract route configurations from host app
- Move routes to plugin manifests
- Update navigation logic

#### 3. Configuration Management

**Current (v1):**
Configuration is passed at registration time.

**Future (v2):**
```typescript
// Centralized configuration service
@Injectable()
export class PluginConfigService {
  getConfig<T>(pluginName: string, key: string): T | null;
  setConfig(pluginName: string, key: string, value: any): void;
}
```

**Migration:**
- Move inline configs to configuration service
- Update plugins to use config service
- Test configuration persistence

#### 4. Remote Loading

**Current (v1):**
Plugins must be bundled with the application.

**Future (v2):**
```typescript
// Load plugins from remote URLs
pluginManager.register({
  name: 'invoice',
  loadFn: () => import('https://cdn.example.com/plugins/invoice.js'),
  config: {
    verifySignature: true // Security validation
  }
});
```

**Migration:**
- Host plugins on CDN or server
- Update registration to use URLs
- Implement signature verification if needed

### Expected Timeline

Version 2.0 is planned for Q3 2026.

---

## Version 2.x to 3.x

**Status:** Conceptual (Early Planning)

Version 3.x will focus on enterprise features and advanced security.

### Planned Breaking Changes

#### 1. Advanced Sandboxing

**Current (v2):**
Plugins run in isolated injectors only.

**Future (v3):**
```typescript
// iframe-based sandboxing for untrusted plugins
pluginManager.register({
  name: 'third-party-plugin',
  loadFn: () => import('https://marketplace.example.com/plugin'),
  config: {
    sandbox: {
      mode: 'iframe',
      permissions: ['http', 'storage']
    }
  }
});
```

**Migration:**
- Review security requirements for each plugin
- Enable sandbox mode for untrusted plugins
- Test cross-domain communication

#### 2. Permissions System

**Current (v2):**
Service access control via whitelist.

**Future (v3):**
```typescript
// Fine-grained permissions
pluginManager.register({
  name: 'invoice',
  loadFn: () => import('./plugins/invoice'),
  config: {
    permissions: {
      services: ['HttpClient', 'Router'],
      routes: ['/api/invoices/*'],
      storage: ['localStorage.invoices'],
      features: ['notifications', 'file-upload']
    }
  }
});
```

**Migration:**
- Audit plugin capabilities
- Define permission requirements
- Update to new permission format

#### 3. Plugin Marketplace Integration

**Current (v2):**
Manual plugin management.

**Future (v3):**
```typescript
// Discover and install from marketplace
pluginMarketplace.install('invoice-plugin', '1.2.0');
pluginMarketplace.update('invoice-plugin');
pluginMarketplace.uninstall('invoice-plugin');
```

**Migration:**
- Migrate plugin metadata to marketplace format
- Implement marketplace discovery
- Update installation workflows

### Expected Timeline

Version 3.0 is planned for Q2 2027.

---

## Breaking Changes Policy

### Communication

Breaking changes will be communicated through:

1. **Deprecation Warnings**:
   - Deprecated APIs will show console warnings in dev mode
   - Minimum 6 months notice before removal

2. **Migration Guide Updates**:
   - This guide will be updated with each major release
   - Code examples will be provided for all breaking changes

3. **Release Notes**:
   - CHANGELOG.md will detail all breaking changes
   - GitHub releases will include migration instructions

### Backward Compatibility

We strive to maintain backward compatibility:

- **Minor versions**: Always backward compatible
- **Patch versions**: Always backward compatible
- **Major versions**: May include breaking changes with migration path

### Deprecation Process

1. **Announce**: Mark API as deprecated in minor version
2. **Warn**: Show warnings in development mode
3. **Document**: Update migration guide
4. **Remove**: Remove in next major version

Example:
```typescript
// v1.5.0 - Deprecation warning
/**
 * @deprecated Use loadMany() instead. Will be removed in v2.0.0
 */
loadAll(): Promise<void> {
  console.warn('loadAll() is deprecated. Use loadMany() instead.');
  return this.loadMany(this.getAllPluginNames());
}

// v2.0.0 - Removed
// loadAll() no longer exists
```

---

## Getting Help

### Before Migrating

- Read the full CHANGELOG for the target version
- Check GitHub issues for known migration problems
- Test in a development environment first

### During Migration

- Follow this guide step by step
- Use TypeScript compiler to find breaking changes
- Run your test suite frequently

### After Migration

- Update documentation
- Train your team on new APIs
- Report any issues on GitHub

### Resources

- [GitHub Issues](https://github.com/angular-dynamic/plugin-system/issues)
- [GitHub Discussions](https://github.com/angular-dynamic/plugin-system/discussions)
- [API Reference](./API_REFERENCE.md)
- [Architecture Guide](./ARCHITECTURE.md)

---

## Version Support

### Long-Term Support (LTS)

Major versions will be supported according to this policy:

- **Current Major Version**: Full support (new features, bug fixes, security updates)
- **Previous Major Version**: Maintenance mode for 12 months (bug fixes, security updates only)
- **Older Versions**: No official support

### Example Timeline

| Version | Release Date | End of Support | Status |
|---------|--------------|----------------|--------|
| 1.x     | 2026-02-03   | 2027-08-03     | Current |
| 2.x     | 2026-08-01   | 2028-02-01     | Planned |
| 3.x     | 2027-02-01   | 2028-08-01     | Planned |

### Security Updates

Security vulnerabilities will be backported to:
- Current major version
- Previous major version (if within support window)

---

## Staying Updated

### Notification Channels

- **GitHub Releases**: Watch releases for notifications
- **npm**: Updates will appear in your package manager
- **Twitter**: Follow @AngularDynamic for announcements

### Best Practices

1. **Subscribe to Releases**
   - Watch the repository on GitHub
   - Enable notifications for new releases

2. **Review Before Updating**
   - Read CHANGELOG.md thoroughly
   - Check this migration guide
   - Review breaking changes section

3. **Test Thoroughly**
   - Test in development first
   - Run full test suite
   - Test all plugins end-to-end

4. **Update Incrementally**
   - Update one major version at a time
   - Don't skip major versions
   - Complete each migration before proceeding

---

## Questions?

If you have questions about migrating:

1. Check the [API Reference](./API_REFERENCE.md)
2. Search [GitHub Issues](https://github.com/angular-dynamic/plugin-system/issues)
3. Ask in [GitHub Discussions](https://github.com/angular-dynamic/plugin-system/discussions)
4. Open a new issue if you find a problem

---

**Last Updated:** 2026-02-04
**Current Version:** 1.1.0
