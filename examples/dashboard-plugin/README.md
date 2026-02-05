# Dashboard Plugin Example (NgModule)

This example demonstrates the **v1.4.0 NgModule support** feature of `@angular-dynamic/plugin-system`.

## Features Demonstrated

- **Plugin-scoped services**: `DashboardDataService` is only available within the plugin
- **Custom pipes**: `ShortNumberPipe` formats large numbers (e.g., 12543 → 12.5K)
- **Full Angular DI**: Services are injected into components via the NgModule

## Structure

```
dashboard-plugin/
├── dashboard-plugin.module.ts   # Complete plugin with NgModule
└── README.md                    # This file
```

## Key Concepts

### 1. Plugin-Scoped Service

```typescript
@Injectable()
export class DashboardDataService {
  private metrics = { totalVisits: 12543, ... };

  getMetrics() {
    return { ...this.metrics };
  }
}
```

### 2. NgModule Declaration

```typescript
@NgModule({
  declarations: [DashboardPluginComponent, ShortNumberPipe],
  imports: [CommonModule],
  providers: [DashboardDataService]  // Service scoped to plugin
})
export class DashboardPluginModule {}
```

### 3. Plugin Manifest with entryModule

```typescript
export const PluginManifest = {
  name: 'dashboard',
  version: '1.0.0',
  entryComponent: DashboardPluginComponent,
  entryModule: DashboardPluginModule,  // NEW in v1.4.0!
  displayName: 'Dashboard Analytics'
};
```

## Usage in Host Application

```typescript
// Register the plugin
pluginManager.register({
  name: 'dashboard',
  loadFn: async () => {
    const module = await import('./plugins/dashboard-plugin.module');
    return { PluginManifest: module.PluginManifest };
  }
});

// Load and activate
await pluginManager.loadAndActivate('dashboard', viewContainerRef);
```

## Benefits

1. **Isolation**: Plugin services don't leak to the host application
2. **Full Angular Features**: Use pipes, directives, and services
3. **Proper DI Context**: Services inject correctly via constructor
4. **Clean Unloading**: NgModule is properly destroyed on plugin unload

## Requirements

- `@angular-dynamic/plugin-system` v1.4.0 or higher
- Angular 16+
