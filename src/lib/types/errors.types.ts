export class PluginError extends Error {
  // v1.1.0: Enhancement #7 - Better error messages with actionable guidance
  public readonly suggestion?: string;
  public readonly docs?: string;

  constructor(
    message: string,
    public readonly pluginName?: string,
    public readonly cause?: Error,
    options?: { suggestion?: string; docs?: string }
  ) {
    super(message);
    this.name = 'PluginError';
    this.suggestion = options?.suggestion;
    this.docs = options?.docs;
    Object.setPrototypeOf(this, PluginError.prototype);
  }
}

export class PluginLoadError extends PluginError {
  constructor(pluginName: string, cause?: Error, options?: { suggestion?: string; docs?: string }) {
    super(
      `Failed to load plugin: ${pluginName}`,
      pluginName,
      cause,
      options || {
        suggestion: 'Check that the plugin file exists and is accessible. Verify the loadFn returns a valid module with PluginManifest export.',
        docs: 'https://github.com/angular-dynamic-plugin-system#troubleshooting'
      }
    );
    this.name = 'PluginLoadError';
    Object.setPrototypeOf(this, PluginLoadError.prototype);
  }
}

export class PluginNotFoundError extends PluginError {
  constructor(pluginName: string) {
    super(
      `Plugin not found: ${pluginName}`,
      pluginName,
      undefined,
      {
        suggestion: 'Ensure the plugin is registered before attempting to load or access it. Call pluginManager.register() first.',
        docs: 'https://github.com/angular-dynamic-plugin-system#plugin-registration'
      }
    );
    this.name = 'PluginNotFoundError';
    Object.setPrototypeOf(this, PluginNotFoundError.prototype);
  }
}

export class PluginAlreadyRegisteredError extends PluginError {
  constructor(pluginName: string) {
    super(`Plugin already registered: ${pluginName}`, pluginName);
    this.name = 'PluginAlreadyRegisteredError';
    Object.setPrototypeOf(this, PluginAlreadyRegisteredError.prototype);
  }
}

export class PluginStateError extends PluginError {
  constructor(pluginName: string, expectedState: string, actualState: string) {
    super(
      `Plugin ${pluginName} is in ${actualState} state, expected ${expectedState}`,
      pluginName,
      undefined,
      {
        suggestion: `Wait for the plugin to reach ${expectedState} state before performing this operation. Use pluginState$ observable to track state changes.`,
        docs: 'https://github.com/angular-dynamic-plugin-system#plugin-states'
      }
    );
    this.name = 'PluginStateError';
    Object.setPrototypeOf(this, PluginStateError.prototype);
  }
}

export class PluginLifecycleError extends PluginError {
  constructor(pluginName: string, hook: string, cause?: Error) {
    super(
      `Error in lifecycle hook ${hook} for plugin ${pluginName}`,
      pluginName,
      cause,
      {
        suggestion: `Check the ${hook} implementation in your plugin for errors. Ensure all async operations are properly handled.`,
        docs: 'https://github.com/angular-dynamic-plugin-system#lifecycle-hooks'
      }
    );
    this.name = 'PluginLifecycleError';
    Object.setPrototypeOf(this, PluginLifecycleError.prototype);
  }
}

// v1.1.0: Fix #1 - Lifecycle hook timeout protection
export class PluginLifecycleTimeoutError extends PluginError {
  constructor(
    public readonly pluginName: string,
    public readonly hookName: string,
    public readonly timeoutMs: number
  ) {
    super(
      `Lifecycle hook '${hookName}' timed out after ${timeoutMs}ms for plugin ${pluginName}`,
      pluginName,
      undefined,
      {
        suggestion: `The ${hookName} hook is taking too long. Optimize the hook implementation or increase lifecycleHookTimeout in PluginSystemConfig.`,
        docs: 'https://github.com/angular-dynamic-plugin-system#lifecycle-timeouts'
      }
    );
    this.name = 'PluginLifecycleTimeoutError';
    Object.setPrototypeOf(this, PluginLifecycleTimeoutError.prototype);
  }
}

// v1.1.0: Fix #3 - Component creation race condition protection
export class PluginOperationInProgressError extends PluginError {
  constructor(
    public readonly pluginName: string,
    public readonly operation: 'creating' | 'unloading'
  ) {
    super(
      `Cannot perform operation: plugin ${pluginName} is currently ${operation}`,
      pluginName,
      undefined,
      {
        suggestion: `Wait for the current ${operation} operation to complete before attempting another operation. Use isUnloading() to check status.`,
        docs: 'https://github.com/angular-dynamic-plugin-system#race-conditions'
      }
    );
    this.name = 'PluginOperationInProgressError';
    Object.setPrototypeOf(this, PluginOperationInProgressError.prototype);
  }
}
