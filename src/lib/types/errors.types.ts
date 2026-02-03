export class PluginError extends Error {
  constructor(
    message: string,
    public readonly pluginName?: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'PluginError';
    Object.setPrototypeOf(this, PluginError.prototype);
  }
}

export class PluginLoadError extends PluginError {
  constructor(pluginName: string, cause?: Error) {
    super(`Failed to load plugin: ${pluginName}`, pluginName, cause);
    this.name = 'PluginLoadError';
    Object.setPrototypeOf(this, PluginLoadError.prototype);
  }
}

export class PluginNotFoundError extends PluginError {
  constructor(pluginName: string) {
    super(`Plugin not found: ${pluginName}`, pluginName);
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
      pluginName
    );
    this.name = 'PluginStateError';
    Object.setPrototypeOf(this, PluginStateError.prototype);
  }
}

export class PluginLifecycleError extends PluginError {
  constructor(pluginName: string, hook: string, cause?: Error) {
    super(`Error in lifecycle hook ${hook} for plugin ${pluginName}`, pluginName, cause);
    this.name = 'PluginLifecycleError';
    Object.setPrototypeOf(this, PluginLifecycleError.prototype);
  }
}
