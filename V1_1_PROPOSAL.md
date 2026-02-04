# Angular Dynamic Plugin System v1.1.0 - Proposal

**Status:** Draft for Review
**Target Release:** v1.1.0
**Breaking Changes:** None
**Migration Required:** No

---

## Executive Summary

v1.1.0 addresses **critical production issues** identified in the post-release audit while maintaining **100% backward compatibility** with v1.0.0. All existing v1.0.0 code will continue to work without modification.

### Goals
1. Fix HIGH severity memory leaks and race conditions
2. Add lifecycle hook timeout protection
3. Improve observability and debugging
4. Enhance developer experience with opt-in features

### Non-Goals
- No breaking API changes
- No new required parameters
- No behavior changes to existing methods
- No backend features

---

## Zero Breaking Changes Guarantee

Every feature in v1.1.0 is either:
- A **bug fix** that corrects unintended behavior
- An **optional enhancement** with sensible defaults
- An **additive API** that doesn't modify existing signatures

**v1.0.0 code example:**
```typescript
pluginManager.register({ name: 'invoice', loadFn: () => import('./invoice') });
await pluginManager.load('invoice');
```

**Still works identically in v1.1.0** ✅

---

## Critical Fixes (MUST-HAVE)

### Fix #1: Lifecycle Hook Timeout Protection

**Audit Reference:** RISK #2 (HIGH severity)

**Problem:**
Lifecycle hooks (`onLoad`, `onDestroy`, etc.) can hang indefinitely, blocking the application.

**Solution:**
Add configurable timeout wrapper for all lifecycle hooks.

**API Addition:**
```typescript
interface PluginSystemConfig {
  // New optional property
  lifecycleHookTimeout?: number; // Default: 5000ms
}

// New error class
export class PluginLifecycleTimeoutError extends PluginError {
  constructor(
    public readonly pluginName: string,
    public readonly hookName: string,
    public readonly timeoutMs: number
  );
}
```

**Usage (opt-in):**
```typescript
providePluginSystem({
  lifecycleHookTimeout: 10000, // 10 seconds instead of default 5
  // ... other config
})
```

**Default Behavior:** 5-second timeout, throws `PluginLifecycleTimeoutError`

**Backward Compatibility:**
- Existing code without timeout config gets sensible 5s default
- Plugins that complete within 5s are unaffected
- Set to `0` or `Infinity` to disable timeout (not recommended)

---

### Fix #2: Component Reference Memory Leak

**Audit Reference:** RISK #1 (HIGH severity)

**Problem:**
`ComponentRef` stored in metadata after plugin unload, causing memory leaks.

**Solution:**
Clear `componentRef` from metadata after destruction.

**Code Change (Internal):**
```typescript
// In plugin-manager.service.ts
if (metadata.componentRef) {
  await this.destroyComponent(metadata.componentRef, pluginName);
  // NEW: Clear the reference
  this.registry.updateMetadata(pluginName, { componentRef: undefined });
}
```

**Impact:**
No API changes. Internal fix only.

**Backward Compatibility:**
Fully compatible. Fixes unintended memory retention.

---

### Fix #3: Component Creation Race Condition

**Audit Reference:** RISK #3 (HIGH severity)

**Problem:**
`unregister()` can destroy injector while `createPluginComponent()` is using it.

**Solution:**
Add internal lock to prevent concurrent component creation and unload.

**API Addition:**
```typescript
// New error class
export class PluginOperationInProgressError extends PluginError {
  constructor(
    public readonly pluginName: string,
    public readonly operation: 'creating' | 'unloading'
  );
}
```

**Code Change (Internal):**
```typescript
// In plugin metadata
interface PluginMetadata {
  // ... existing fields
  isCreatingComponent?: boolean; // NEW
}

// In createPluginComponent()
if (metadata.isCreatingComponent) {
  throw new PluginOperationInProgressError(pluginName, 'creating');
}

// In unregister()
if (metadata.isCreatingComponent) {
  throw new PluginOperationInProgressError(pluginName, 'creating');
}
```

**Backward Compatibility:**
New error type only thrown in edge case. Normal flows unaffected.

---

### Fix #4: ComponentRef Cleanup on Unload

**Audit Reference:** RISK #7 (MEDIUM severity)

**Problem:**
Metadata retains destroyed `componentRef`, preventing garbage collection.

**Solution:**
Explicitly clear `componentRef` after component destruction (covered in Fix #2).

---

### Fix #5: Context Cleanup on Load Error

**Audit Reference:** RISK #12 (LOW severity)

**Problem:**
Plugin context not destroyed if plugin load fails after context creation.

**Solution:**
Add context cleanup in error handler.

**Code Change (Internal):**
```typescript
// In plugin-manager.service.ts load() catch block
} catch (error) {
  const context = this.registry.getContext(pluginName);
  if (context) {
    context.destroy(); // NEW: Clean up context
  }
  // ... existing error handling
}
```

**Backward Compatibility:**
Internal fix, no API changes.

---

## Optional Enhancements (NICE-TO-HAVE)

### Enhancement #1: Unload Race Condition Protection

**Audit Reference:** RISK #4 (MEDIUM severity)

**Feature:**
Prevent concurrent unregister() calls on the same plugin.

**API Addition:**
```typescript
// New method (optional)
isUnloading(pluginName: string): boolean;
```

**Implementation:**
```typescript
// Internal tracking
private unloadingPromises = new Map<string, Promise<void>>();

async unregister(pluginName: string): Promise<void> {
  // If already unloading, return existing promise
  if (this.unloadingPromises.has(pluginName)) {
    return this.unloadingPromises.get(pluginName)!;
  }

  const promise = this.doUnregister(pluginName);
  this.unloadingPromises.set(pluginName, promise);

  try {
    await promise;
  } finally {
    this.unloadingPromises.delete(pluginName);
  }
}
```

**Usage:**
```typescript
if (!pluginManager.isUnloading('invoice')) {
  await pluginManager.unregister('invoice');
}
```

**Backward Compatibility:**
- `unregister()` signature unchanged
- Concurrent calls now safe (returns same promise)
- New `isUnloading()` method is optional

---

### Enhancement #2: Debug Mode Enhancements

**Feature:**
Enhanced debugging output and validation when `enableDevMode: true`.

**API Addition:**
```typescript
interface PluginSystemConfig {
  enableDevMode?: boolean; // Already exists
  debugOptions?: {
    logLifecycleHooks?: boolean; // NEW: Log hook calls
    logStateTransitions?: boolean; // NEW: Log state changes
    validateManifests?: boolean; // NEW: Strict validation
    throwOnWarnings?: boolean; // NEW: Treat warnings as errors
  };
}
```

**Usage:**
```typescript
providePluginSystem({
  enableDevMode: true,
  debugOptions: {
    logLifecycleHooks: true,
    validateManifests: true
  }
})
```

**Output (dev console):**
```
[PluginSystem] Plugin 'invoice' → LOADING
[PluginSystem] Calling onLoad() for 'invoice'
[PluginSystem] onLoad() completed in 234ms
[PluginSystem] Plugin 'invoice' → LOADED
```

**Backward Compatibility:**
- Completely opt-in
- No output unless explicitly enabled
- Production builds exclude debug code (dead code elimination)

---

### Enhancement #3: Plugin Metadata Inspection

**Feature:**
Expose more plugin metadata for monitoring and debugging.

**API Addition:**
```typescript
// New method
getPluginInfo(pluginName: string): PluginInfo | undefined;

interface PluginInfo {
  name: string;
  state: PluginState;
  loadedAt?: Date;
  activatedAt?: Date;
  manifest?: PluginManifest;
  hasComponent: boolean;
  errorCount: number; // NEW: Track error history
  lastError?: Error; // NEW: Most recent error
}
```

**Usage:**
```typescript
const info = pluginManager.getPluginInfo('invoice');
if (info && info.errorCount > 0) {
  console.warn(`Plugin has ${info.errorCount} errors`, info.lastError);
}
```

**Backward Compatibility:**
New method, no impact on existing code.

---

### Enhancement #4: Load Progress Observable

**Feature:**
Expose detailed loading progress for UI feedback.

**API Addition:**
```typescript
// New observable
readonly loadProgress$: Observable<PluginLoadProgress>;

interface PluginLoadProgress {
  pluginName: string;
  stage: 'importing' | 'validating' | 'initializing' | 'activating';
  progress: number; // 0-100
  message?: string;
}
```

**Usage:**
```typescript
pluginManager.loadProgress$.subscribe(progress => {
  console.log(`${progress.pluginName}: ${progress.stage} (${progress.progress}%)`);
});
```

**Backward Compatibility:**
New observable, opt-in subscription.

---

### Enhancement #5: Safe Unload with Retry

**Feature:**
Enhanced `unregister()` with automatic retry on failure.

**API Addition:**
```typescript
// Extend existing unregister signature
unregister(
  pluginName: string,
  options?: {
    force?: boolean; // NEW: Skip safety checks
    retryCount?: number; // NEW: Retry on failure
    timeout?: number; // NEW: Max time to wait
  }
): Promise<void>;
```

**Usage:**
```typescript
// Normal unload
await pluginManager.unregister('invoice');

// Force unload (ignores mount state)
await pluginManager.unregister('invoice', { force: true });

// Retry up to 3 times
await pluginManager.unregister('invoice', { retryCount: 3 });
```

**Backward Compatibility:**
- `options` parameter is optional
- Existing calls work identically: `unregister('name')` ✅

---

### Enhancement #6: Plugin Health Check

**Feature:**
Periodic health check for loaded plugins.

**API Addition:**
```typescript
// New method
healthCheck(pluginName: string): Promise<PluginHealthStatus>;

interface PluginHealthStatus {
  healthy: boolean;
  state: PluginState;
  memoryUsage?: number; // Approximate KB
  issues: string[];
}
```

**Usage:**
```typescript
const health = await pluginManager.healthCheck('invoice');
if (!health.healthy) {
  console.error('Plugin issues:', health.issues);
  // Consider reloading
}
```

**Backward Compatibility:**
New optional method.

---

### Enhancement #7: Better Error Messages

**Feature:**
Enhanced error messages with actionable guidance.

**Implementation:**
```typescript
// Before (v1.0.0)
throw new PluginLoadError('invoice', new Error('Import failed'));

// After (v1.1.0)
throw new PluginLoadError('invoice', new Error('Import failed'), {
  suggestion: 'Check that the plugin file exists and is accessible',
  docs: 'https://github.com/.../troubleshooting#import-errors'
});
```

**API Addition:**
```typescript
interface PluginError {
  // ... existing fields
  suggestion?: string; // NEW: User-friendly guidance
  docs?: string; // NEW: Link to documentation
}
```

**Backward Compatibility:**
Enhanced errors, no breaking changes.

---

## API Additions Summary

### New Configuration Options (all optional)
```typescript
interface PluginSystemConfig {
  lifecycleHookTimeout?: number; // Default: 5000
  debugOptions?: {
    logLifecycleHooks?: boolean;
    logStateTransitions?: boolean;
    validateManifests?: boolean;
    throwOnWarnings?: boolean;
  };
}
```

### New Methods (all optional)
```typescript
class PluginManager {
  // Existing methods unchanged
  register(config: PluginRegistration): void; // UNCHANGED
  load(pluginName: string): Promise<PluginMetadata>; // UNCHANGED
  unregister(pluginName: string, options?: UnregisterOptions): Promise<void>; // EXTENDED

  // New methods
  isUnloading(pluginName: string): boolean;
  getPluginInfo(pluginName: string): PluginInfo | undefined;
  healthCheck(pluginName: string): Promise<PluginHealthStatus>;

  // New observable
  readonly loadProgress$: Observable<PluginLoadProgress>;
}
```

### New Error Classes
```typescript
export class PluginLifecycleTimeoutError extends PluginError { ... }
export class PluginOperationInProgressError extends PluginError { ... }
```

### New Types
```typescript
export interface PluginInfo { ... }
export interface PluginLoadProgress { ... }
export interface PluginHealthStatus { ... }
export interface UnregisterOptions { ... }
```

---

## Why Each Feature Belongs in v1.1 (Not v2)

| Feature | Why v1.1? | Why Not v2? |
|---------|-----------|-------------|
| Lifecycle timeouts | Critical bug fix | Not architectural |
| Memory leak fixes | Critical bug fix | Must fix immediately |
| Race condition fixes | Critical bug fix | Breaks production apps |
| Debug enhancements | Improves DX without complexity | No backend/permissions needed |
| Plugin info API | Natural extension of existing API | Doesn't require redesign |
| Load progress | Optional observability | Doesn't change architecture |
| Unload options | Safe extension of existing method | No breaking changes |
| Health checks | Standalone feature | No inter-plugin dependencies |

**v2 Features (out of scope for v1.1):**
- Plugin permissions system (architectural change)
- Remote plugin loading (security model change)
- Plugin dependency graph (complex feature)
- Router integration (requires Angular core changes)

---

## Backward Compatibility Proof

### Test Case 1: Basic Plugin Load
```typescript
// v1.0.0 code
const manager = inject(PluginManager);
manager.register({ name: 'test', loadFn: () => import('./test') });
await manager.load('test');

// Works identically in v1.1.0 ✅
```

### Test Case 2: Plugin Outlet
```typescript
// v1.0.0 template
<plugin-outlet [plugin]="'test'"></plugin-outlet>

// Works identically in v1.1.0 ✅
```

### Test Case 3: Plugin Lifecycle
```typescript
// v1.0.0 plugin
export class MyPlugin implements PluginLifecycle {
  async onLoad(context: PluginContext) { }
  async onDestroy() { }
}

// Works identically in v1.1.0 ✅
// (now has 5s timeout protection automatically)
```

### Test Case 4: Error Handling
```typescript
// v1.0.0 code
try {
  await manager.load('broken-plugin');
} catch (error) {
  if (error instanceof PluginLoadError) {
    console.error(error.message);
  }
}

// Works identically in v1.1.0 ✅
// (error now has .suggestion and .docs properties)
```

### Test Case 5: Unregister
```typescript
// v1.0.0 code
await manager.unregister('test');

// Works identically in v1.1.0 ✅
// (now prevents concurrent unload internally)
```

---

## Version Comparison Table

| Feature | v1.0.0 | v1.1.0 |
|---------|--------|--------|
| **Core API** | ✅ | ✅ (unchanged) |
| Plugin load/unload | ✅ | ✅ (unchanged) |
| Plugin outlet | ✅ | ✅ (unchanged) |
| Lifecycle hooks | ✅ | ✅ (unchanged) |
| State management | ✅ | ✅ (unchanged) |
| **Fixes** | | |
| Lifecycle timeouts | ❌ | ✅ (5s default) |
| Memory leak (componentRef) | ❌ | ✅ (fixed) |
| Race conditions | ❌ | ✅ (fixed) |
| Context cleanup | ❌ | ✅ (fixed) |
| **Enhancements** | | |
| Debug mode | Basic | Enhanced (opt-in) |
| Error messages | Basic | Actionable |
| Plugin inspection | Limited | Full API |
| Load progress | ❌ | ✅ (observable) |
| Health checks | ❌ | ✅ (new method) |
| Unload options | ❌ | ✅ (force, retry) |
| **Breaking Changes** | N/A | **NONE** ✅ |

---

## Release Timeline

### v1.1.0 (Target: 2-3 weeks after v1.0.0)

**Must Ship:**
- ✅ Lifecycle hook timeout protection
- ✅ ComponentRef memory leak fix
- ✅ Race condition fixes
- ✅ Context cleanup on error
- ✅ Enhanced error messages

**Should Ship:**
- ✅ Unload race protection
- ✅ Plugin info API
- ✅ Debug mode enhancements

**Nice to Have:**
- ⏳ Load progress observable
- ⏳ Health check API
- ⏳ Unload retry options

### v1.1.1 (Patch, if needed)
- Bug fixes only
- No new features

### v1.2.0 (Target: 4-6 weeks after v1.1.0)
- Load progress observable (if deferred)
- Health check API (if deferred)
- Performance monitoring hooks

---

## Migration Guide (None Required!)

### For v1.0.0 Users

**Q: Do I need to change my code?**
A: No. v1.1.0 is 100% backward compatible.

**Q: Will my plugins break?**
A: No. All v1.0.0 plugins work in v1.1.0.

**Q: Should I upgrade?**
A: Yes. v1.1.0 fixes critical memory leaks and adds timeout protection.

**Q: How do I upgrade?**
```bash
npm install @angular-dynamic/plugin-system@^1.1.0
```

**Q: Do I need to configure timeouts?**
A: No. Sensible defaults (5s) are applied automatically. Only configure if you have specific requirements.

**Q: Will I get new warnings or errors?**
A: Only if a plugin lifecycle hook takes longer than 5 seconds (now properly caught instead of hanging).

---

## Testing Strategy

### Critical Fix Validation
1. Memory leak test: Load/unload plugin 1000 times, check heap
2. Timeout test: Plugin with infinite `onLoad()`, verify timeout
3. Race condition test: Concurrent `unregister()` calls
4. Component creation lock: Unload during component creation

### Backward Compatibility
1. Run all v1.0.0 examples against v1.1.0
2. Verify no console warnings with default config
3. Verify identical behavior for all v1.0.0 APIs
4. Check bundle size increase < 2KB

### New Feature Validation
1. Test debug mode output
2. Test plugin info API
3. Test load progress observable
4. Test unload with options

---

## Documentation Updates Required

### README.md
- Add v1.1.0 changelog
- Document lifecycle timeout behavior
- Add troubleshooting section
- Update installation instructions

### MIGRATION_GUIDE.md
- Add "v1.0.0 → v1.1.0" section (no changes required)
- Document new optional features

### API_REFERENCE.md
- Document new methods
- Document new configuration options
- Document new error types

### PLUGIN_GUIDE.md
- Add "Lifecycle Hook Timeouts" section
- Add "Memory Considerations" section
- Add "Debugging" section

---

## Risk Assessment

### Low Risk
- All changes are opt-in or fixes
- No breaking API changes
- Extensive backward compatibility testing planned

### Potential Issues
1. **Timeout breaks slow plugins**
   Mitigation: Configurable timeout, clear error message

2. **Debug mode overhead**
   Mitigation: Opt-in only, tree-shakeable in production

3. **Bundle size increase**
   Mitigation: Target < 2KB increase, monitor in CI

---

## Rationale for v1.1 vs v2

### Why NOT wait for v2?

**Critical fixes can't wait:**
- Memory leaks impact production apps now
- Timeout vulnerability is a security concern
- Race conditions cause data corruption

**v1.1 changes are minimal risk:**
- No architectural changes
- No breaking changes
- No new concepts

**v2 is for different goals:**
- Plugin permissions (requires security model)
- Remote loading (requires trust/signing)
- Plugin dependencies (requires dependency resolver)
- Router integration (requires Angular deep integration)

**v1.1 timeline:** 2-3 weeks
**v2 timeline:** 6-12 months

---

## Success Criteria

v1.1.0 is successful if:

1. ✅ Zero breaking changes (all v1.0.0 code works)
2. ✅ No migration required
3. ✅ Critical memory leaks fixed
4. ✅ Timeout protection added
5. ✅ Bundle size increase < 2KB
6. ✅ Documentation fully updated
7. ✅ 100% backward compatibility test pass rate
8. ✅ Community feedback is positive
9. ✅ No new critical issues reported

---

## Conclusion

v1.1.0 is a **stability and reliability release** that addresses critical production issues while maintaining perfect backward compatibility with v1.0.0. All features are either critical fixes or optional enhancements with sensible defaults.

**Recommendation:** Approve for implementation and release within 2-3 weeks of v1.0.0.

---

**Proposal Status:** Ready for Review
**Author:** Agent B - Stability & DX Engineer
**Date:** 2026-02-03
**Review Required:** Core Team, Community Feedback
