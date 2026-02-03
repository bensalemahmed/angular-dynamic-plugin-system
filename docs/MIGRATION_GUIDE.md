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

Version 1.0.0 is the initial release. There are no previous versions to migrate from.

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

**Last Updated:** 2026-02-03
**Current Version:** 1.0.0
