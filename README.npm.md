# Angular Dynamic Plugin System

A production-ready, type-safe plugin system for Angular 16+ applications that enables runtime loading, isolated execution, and lifecycle management of plugins.

## Quick Start

```bash
npm install @angular-dynamic/plugin-system
```

### 1. Configure

```typescript
import { providePluginSystem } from '@angular-dynamic/plugin-system';

export const appConfig: ApplicationConfig = {
  providers: [providePluginSystem()]
};
```

### 2. Register Plugin

```typescript
pluginManager.register({
  name: 'invoice',
  loadFn: () => import('./plugins/invoice-plugin')
});
```

### 3. Render

```html
<plugin-outlet [plugin]="'invoice'"></plugin-outlet>
```

## Features

- Runtime plugin loading via dynamic imports
- Isolated injector per plugin
- Type-safe lifecycle hooks
- Defensive error handling
- Observable state management
- Concurrent loading with limits
- Timeout support
- Standalone component support

## Documentation

- [Full Documentation](https://github.com/angular-dynamic/plugin-system#readme)
- [API Reference](https://github.com/angular-dynamic/plugin-system/blob/main/docs/API_REFERENCE.md)
- [Architecture Guide](https://github.com/angular-dynamic/plugin-system/blob/main/docs/ARCHITECTURE.md)
- [Contributing](https://github.com/angular-dynamic/plugin-system/blob/main/CONTRIBUTING.md)

## Requirements

- Angular >= 16.0.0
- TypeScript >= 5.0.0
- RxJS >= 7.5.0

## License

MIT
