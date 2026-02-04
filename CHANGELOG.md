# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-02-04

### Added - Bulk Operations & Metadata Filtering

**Bulk Plugin Operations:**
- `unloadAll()` - Unload all active plugins at once
  - Properly cleans up all plugin resources
  - Parallel unloading for better performance
  - Useful for tier switching in SaaS applications

- `loadAndActivateMany()` - Load and activate multiple plugins in parallel
  - Accepts array of `{name, container}` objects
  - Parallel loading significantly faster than sequential
  - Returns array of ComponentRefs for all successfully loaded plugins

**Metadata Filtering:**
- `getPluginsByMetadata()` - Query plugins by their metadata
  - Filter plugins by tier, category, or any custom metadata
  - Enables dynamic plugin discovery
  - Perfect for organizing plugins in groups

### Benefits
- **Simplified Application Code**: Common patterns now handled by the library
- **Better Performance**: Parallel plugin loading/unloading
- **More Flexible**: Query and organize plugins dynamically
- **Less Boilerplate**: Demo app reduced from 48 to 25 lines

### Example Usage
```typescript
// Unload all plugins
await pluginManager.unloadAll();

// Load multiple plugins in parallel
await pluginManager.loadAndActivateMany([
  { name: 'analytics', container: analyticsContainer },
  { name: 'reports', container: reportsContainer }
]);

// Find all PRO tier plugins
const proPlugins = pluginManager.getPluginsByMetadata({ tier: 'PRO' });
```

### Migration from v1.2.x
No breaking changes. All v1.2.x code continues to work.

## [1.2.0] - 2026-02-04

### Added - Remote Plugin Loading
- **NEW:** Load plugins from external URLs at runtime (webpack-style dynamic loading)
  - New `RemotePluginLoader` service for loading scripts from CDNs or remote servers
  - New `registerRemotePlugin()` method in `PluginManager`
  - New `unregisterRemotePlugin()` method with full DOM and memory cleanup
  - New `getRemoteCacheStats()` and `clearRemoteCache()` for cache management
  - Automatic retry logic with exponential backoff
  - Script tag injection and removal
  - Global variable cleanup on unload
  - Support for timeout configuration per plugin
  - Error classification: TIMEOUT, NETWORK_ERROR, MODULE_NOT_FOUND, INVALID_MODULE

### Features
- Load plugins from any HTTP(S) URL
- True plugin unloading with script tag removal from DOM
- Plugin caching for performance
- Configurable timeout and retry attempts
- Support for nested global module paths (e.g., `MyApp.Plugins.Analytics`)
- Cache statistics and management
- Full TypeScript support with new types

### Benefits
- Plugins can be hosted on CDNs (CloudFlare, AWS CloudFront, etc.)
- Plugins can be updated without rebuilding the host application
- Reduced initial bundle size (plugins loaded on demand)
- True memory cleanup when plugins are unloaded (script tags removed)
- Support for plugin marketplaces and dynamic plugin distribution
- Perfect for SaaS multi-tenant applications

### New Types
- `RemotePluginConfig` - Configuration for remote plugin loading
- `RemotePluginLoadResult` - Result with load time and cache status
- `RemotePluginError` - Typed errors with error codes
- `RemotePluginCacheEntry` - Cache entry structure

### Documentation
- Added `REMOTE_LOADING.md` with complete guide and examples
- Includes security considerations (CSP, SRI, trusted sources)
- Performance optimization strategies
- Migration guide from v1.1.x

## [1.1.2] - 2026-02-04

### Added - Memory Optimization
- **Enhanced:** Memory management for plugin lifecycle
  - Track module references in `PluginMetadata.moduleReference`
  - Track injector references in `PluginMetadata.injectorReference`
  - Explicit injector destruction on plugin unload
  - Complete reference nullification for garbage collection
  - Context destruction on unload

### Improved
- Better memory cleanup in `executeUnregister()`
- Garbage collection assistance by clearing all references
- Reduced memory footprint for inactive plugins
- Defensive error handling in cleanup operations

### Documentation
- Added `MEMORY_OPTIMIZATION.md` with technical details
- Comparison table: v1.1.1 vs v1.1.2 cleanup
- Memory profiling guide using Chrome DevTools
- Best practices for plugin developers

## [1.1.1] - 2026-02-03

### Fixed - AOT Compilation
- **Critical Fix:** JIT compiler error resolved by using Angular compiler
  - Changed build process from `tsc` to `ng-packagr`
  - Added proper Angular metadata for AOT/JIT compatibility
  - Fixed TypeScript error: `Injector` → `EnvironmentInjector`
  - Now compatible with both Angular JIT and AOT compilation modes

### Changed
- Build script now uses `ng-packagr -p ng-package.json`
- `PluginInjectorConfig.parent` type changed to `EnvironmentInjector`
- Added type cast in `PluginManager` for injector compatibility

### Dependencies
- Added `ng-packagr@16.2.3` (devDependency)
- Added `@angular/compiler-cli@16.2.12` (devDependency)

## [1.1.0] - 2026-02-04

### Critical Fixes

#### Memory Management
- **Fixed:** ComponentRef memory leak after plugin unload (RISK #1, HIGH severity)
  - ComponentRef is now properly cleared from metadata after destruction
  - Prevents memory leaks in long-running applications
  - No API changes required

- **Fixed:** Context cleanup on plugin load failure (RISK #12, LOW severity)
  - Plugin context now properly destroyed when plugin load fails after context creation
  - Prevents event handler memory leaks on failed loads
  - No API changes required

#### Race Condition Protection
- **Fixed:** Component creation race condition (RISK #3, HIGH severity)
  - Added `isCreatingComponent` flag to prevent concurrent component creation/destruction
  - Prevents runtime crashes from destroyed injectors being used
  - New error type: `PluginOperationInProgressError` thrown when race condition detected

- **Fixed:** Concurrent unregister calls (RISK #4, MEDIUM severity)
  - Added `unloadingPromises` map to deduplicate concurrent unload operations
  - Multiple concurrent unregister() calls now safely return the same promise
  - New method: `isUnloading(pluginName)` to check unload status

#### Lifecycle Protection
- **Fixed:** Lifecycle hook infinite hang (RISK #2, HIGH severity)
  - Added configurable timeout protection for all lifecycle hooks (onLoad, onActivate, onDeactivate, onDestroy)
  - Default timeout: 5000ms (5 seconds)
  - New configuration option: `lifecycleHookTimeout` (set to 0 or Infinity to disable)
  - New error type: `PluginLifecycleTimeoutError` thrown when timeout occurs
  - Prevents application from hanging indefinitely due to buggy plugin lifecycle hooks

### Optional Enhancements

#### Debug Mode Improvements
- **Added:** Enhanced debugging capabilities when `enableDevMode: true`
  - New configuration: `debugOptions` with granular debug settings
  - `logLifecycleHooks`: Log lifecycle hook calls and execution times
  - `logStateTransitions`: Log plugin state transitions
  - `validateManifests`: Strict manifest validation in dev mode
  - `throwOnWarnings`: Treat validation warnings as errors
  - All debug output is tree-shakeable in production builds

#### Plugin Inspection API
- **Added:** `getPluginInfo(pluginName)` method for detailed plugin metadata
  - Returns `PluginInfo` with state, timestamps, error history, and manifest
  - Tracks error count per plugin
  - Records `loadedAt` and `activatedAt` timestamps
  - Useful for monitoring and debugging plugin health

#### Enhanced Error Information
- **Improved:** Error classes now include suggestions and documentation links
  - Better error messages with actionable guidance
  - Helps developers troubleshoot issues faster
  - No breaking changes to error handling

### Backward Compatibility

**Zero Breaking Changes:** This release is 100% backward compatible with v1.0.0.

- All existing v1.0.0 code works without modification
- All new features are opt-in with sensible defaults
- New configuration options are optional
- New methods are additive to existing API
- No migration required

### What Changed Internally

- Plugin metadata now includes: `activatedAt`, `errorCount`, `isCreatingComponent`
- PluginManager tracks unloading operations in `unloadingPromises` map
- All lifecycle hooks wrapped with optional timeout protection
- Enhanced debug logging throughout the plugin lifecycle

### Upgrade Instructions

```bash
npm install @angular-dynamic/plugin-system@^1.1.0
```

No code changes required. Your v1.0.0 code will continue to work identically.

### New Configuration Example (Optional)

```typescript
providePluginSystem({
  lifecycleHookTimeout: 10000, // 10 seconds (default: 5000)
  enableDevMode: true,
  debugOptions: {
    logLifecycleHooks: true,
    logStateTransitions: true,
    validateManifests: true
  }
})
```

### Test Coverage

- Added 10 critical test scenarios covering all fixed risks
- Added 19 additional registry operation tests
- Total new test lines: 1,240 lines
- Coverage includes: memory leaks, race conditions, timeouts, scalability

### Documentation

- Updated README.md with v1.1.0 features
- Updated MIGRATION_GUIDE.md (no migration needed!)
- Added RELEASE_NOTES_V1_1_0.md with detailed release information
- Updated V1_1_TEST_COVERAGE_REPORT.md with test improvements

---

## [1.0.0] - 2026-02-03

### Added

- Initial release of Angular Dynamic Plugin System
- Core plugin loading and lifecycle management
- PluginManager service for orchestrating plugin operations
- PluginRegistry service for state management
- Isolated injector factory for plugin isolation
- PluginContext for controlled host-plugin communication
- PluginOutlet component for rendering plugins
- Comprehensive type definitions and error classes
- Observable-based state management
- Concurrent plugin loading with configurable limits
- Timeout support with automatic cleanup
- Lifecycle hooks (onLoad, onActivate, onDeactivate, onDestroy)
- Global configuration via providePluginSystem()
- Defensive error handling
- TypeScript strict mode compliance
- Complete test suite for core services
- Documentation and examples
- Plugin development guide

### Features

- Runtime plugin loading via dynamic imports
- Plugin state tracking (REGISTERED, LOADING, LOADED, ACTIVE, ERROR, UNLOADING, UNLOADED)
- Service access control per plugin
- Event-based communication between host and plugins
- Auto-load plugin support
- Batch plugin loading
- Plugin metadata management
- Comprehensive error handling with custom error classes

### Developer Experience

- Full TypeScript support with strict mode
- Production-ready code with no console logs
- Clean API surface with minimal boilerplate
- Extensive documentation with examples
- Unit tests for all core functionality
- Example plugin and demo application

## [Unreleased]

### Planned

- Hot module replacement support
- Plugin dependency resolution
- Version compatibility checking
- Plugin marketplace integration
- Advanced sandboxing options
- Plugin router integration
- Remote plugin loading
- Plugin permissions system
- Analytics and monitoring hooks
