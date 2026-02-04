# Remote Plugin Loading Guide

## v1.2.0 - True Dynamic Plugin Loading from External URLs

### Overview

Version 1.2.0 introduces **remote plugin loading**, enabling you to load plugins from external URLs at runtime. This provides true dynamic plugin systems where:

- ✅ Plugins can be hosted on CDNs or separate servers
- ✅ Plugins can be updated independently without rebuilding the host app
- ✅ Plugins can be loaded/unloaded dynamically, freeing memory
- ✅ Script tags are removed from DOM when plugins are unloaded
- ✅ Multiple applications can share the same plugin bundles

### How It Works

The `RemotePluginLoader` service:
1. Dynamically creates `<script>` tags to load external JavaScript
2. Waits for the script to load and expose a global module
3. Caches the loaded module for performance
4. Removes script tags and clears cache when unloading

### Basic Usage

#### 1. Create a Remote Plugin

Your remote plugin must expose a global variable with the plugin manifest:

```typescript
// analytics-plugin.umd.js (hosted at https://cdn.example.com/plugins/)
(function (global) {
  'use strict';

  // Your plugin component
  class AnalyticsPluginComponent {
    async onLoad(context) {
      console.log('Analytics plugin loaded!');
    }

    async onActivate(context) {
      console.log('Analytics plugin activated!');
    }

    async onDeactivate(context) {
      console.log('Analytics plugin deactivated!');
    }

    async onDestroy(context) {
      console.log('Analytics plugin destroyed!');
    }
  }

  // Expose the plugin manifest globally
  global.AnalyticsPlugin = {
    PluginManifest: {
      name: 'analytics',
      version: '1.0.0',
      entryComponent: AnalyticsPluginComponent,
      displayName: 'Analytics Dashboard',
      description: 'Real-time analytics and insights'
    }
  };

})(window);
```

#### 2. Load the Remote Plugin in Your App

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { PluginManager } from '@angular-dynamic/plugin-system';

@Component({
  selector: 'app-root',
  template: `
    <button (click)="loadAnalytics()">Load Analytics</button>
    <button (click)="unloadAnalytics()">Unload Analytics</button>
  `
})
export class AppComponent implements OnInit {
  pluginManager = inject(PluginManager);

  async loadAnalytics() {
    try {
      // Load plugin from remote URL
      const metadata = await this.pluginManager.registerRemotePlugin({
        name: 'analytics',
        remoteUrl: 'https://cdn.example.com/plugins/analytics-plugin.umd.js',
        exposedModule: 'AnalyticsPlugin',
        version: '1.0.0',
        timeout: 30000, // 30 seconds
        retry: true,
        retryAttempts: 3
      });

      console.log('Plugin loaded:', metadata);
    } catch (error) {
      console.error('Failed to load plugin:', error);
    }
  }

  async unloadAnalytics() {
    try {
      // Unload and clean up
      await this.pluginManager.unregisterRemotePlugin('analytics');
      console.log('Plugin unloaded and cleaned up');
    } catch (error) {
      console.error('Failed to unload plugin:', error);
    }
  }
}
```

### Advanced Usage

#### Loading Multiple Remote Plugins

```typescript
async loadAllPlugins() {
  const plugins = [
    {
      name: 'analytics',
      remoteUrl: 'https://cdn.example.com/plugins/analytics.umd.js',
      exposedModule: 'AnalyticsPlugin'
    },
    {
      name: 'reports',
      remoteUrl: 'https://cdn.example.com/plugins/reports.umd.js',
      exposedModule: 'ReportsPlugin'
    }
  ];

  // Load all plugins in parallel
  const results = await Promise.allSettled(
    plugins.map(config => this.pluginManager.registerRemotePlugin(config))
  );

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      console.log(`${plugins[index].name} loaded successfully`);
    } else {
      console.error(`${plugins[index].name} failed:`, result.reason);
    }
  });
}
```

#### Cache Management

```typescript
// Get cache statistics
const stats = this.pluginManager.getRemoteCacheStats();
console.log(`Cached plugins: ${stats.size}`);
console.log('Cache entries:', stats.entries);

// Clear all cached plugins
this.pluginManager.clearRemoteCache();
```

#### Error Handling

```typescript
import { RemotePluginError } from '@angular-dynamic/plugin-system';

async loadPlugin() {
  try {
    await this.pluginManager.registerRemotePlugin({
      name: 'analytics',
      remoteUrl: 'https://cdn.example.com/plugins/analytics.umd.js',
      exposedModule: 'AnalyticsPlugin'
    });
  } catch (error) {
    const pluginError = error as RemotePluginError;

    switch (pluginError.code) {
      case 'TIMEOUT':
        console.error('Plugin loading timed out');
        break;
      case 'NETWORK_ERROR':
        console.error('Network error loading plugin');
        break;
      case 'MODULE_NOT_FOUND':
        console.error('Module not found in window object');
        break;
      case 'INVALID_MODULE':
        console.error('Invalid module structure');
        break;
    }
  }
}
```

### Building Remote Plugins

#### Option 1: Using Rollup

```javascript
// rollup.config.js
export default {
  input: 'src/analytics-plugin.component.ts',
  output: {
    file: 'dist/analytics-plugin.umd.js',
    format: 'umd',
    name: 'AnalyticsPlugin'
  },
  plugins: [
    typescript(),
    terser()
  ]
};
```

#### Option 2: Using Webpack

```javascript
// webpack.config.js
module.exports = {
  entry: './src/analytics-plugin.component.ts',
  output: {
    filename: 'analytics-plugin.umd.js',
    library: 'AnalyticsPlugin',
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  // ... other config
};
```

#### Option 3: Using Angular Compiler

```typescript
// Build as standalone component and expose manually
import { Component } from '@angular/core';

@Component({
  selector: 'analytics-plugin',
  standalone: true,
  template: `<div>Analytics Dashboard</div>`
})
export class AnalyticsPluginComponent {
  // ... lifecycle methods
}

// Expose globally
(window as any).AnalyticsPlugin = {
  PluginManifest: {
    name: 'analytics',
    version: '1.0.0',
    entryComponent: AnalyticsPluginComponent,
    displayName: 'Analytics Dashboard',
    description: 'Real-time analytics'
  }
};
```

### Remote Loading vs Dynamic Imports

| Feature | Dynamic Imports | Remote Loading |
|---------|----------------|----------------|
| Plugin location | Same bundle | External URL |
| Update plugins | Rebuild app | Update remote file |
| Bundle size | Included | Never downloaded |
| Memory cleanup | Cached by browser | Fully cleanable |
| Network requests | First load only | Configurable |
| Versioning | App version | Independent |
| CDN support | No | Yes |

### Use Cases

#### 1. SaaS Multi-Tenant Applications

```typescript
// Load plugins based on customer tier
async loadTierPlugins(tier: 'FREE' | 'PRO' | 'ENTERPRISE') {
  const pluginUrls = {
    PRO: ['https://cdn.app.com/plugins/analytics.js'],
    ENTERPRISE: [
      'https://cdn.app.com/plugins/analytics.js',
      'https://cdn.app.com/plugins/reports.js',
      'https://cdn.app.com/plugins/custom-integrations.js'
    ]
  };

  if (tier === 'FREE') return;

  for (const url of pluginUrls[tier] || []) {
    await this.loadPluginFromUrl(url);
  }
}
```

#### 2. Plugin Marketplace

```typescript
// Let users install plugins from marketplace
async installPlugin(pluginId: string) {
  // Fetch plugin metadata from marketplace API
  const plugin = await this.api.getPlugin(pluginId);

  // Load from marketplace CDN
  await this.pluginManager.registerRemotePlugin({
    name: plugin.name,
    remoteUrl: plugin.cdnUrl,
    exposedModule: plugin.moduleName,
    version: plugin.version
  });

  // Save to user preferences
  await this.api.saveInstalledPlugin(pluginId);
}
```

#### 3. A/B Testing Different Plugin Versions

```typescript
async loadPluginVersion(version: 'v1' | 'v2') {
  const urls = {
    v1: 'https://cdn.app.com/plugins/feature-v1.js',
    v2: 'https://cdn.app.com/plugins/feature-v2.js'
  };

  await this.pluginManager.registerRemotePlugin({
    name: 'feature',
    remoteUrl: urls[version],
    exposedModule: 'FeaturePlugin'
  });
}
```

### Security Considerations

#### 1. Content Security Policy (CSP)

Update your CSP headers to allow loading scripts from plugin CDN:

```http
Content-Security-Policy: script-src 'self' https://cdn.example.com;
```

#### 2. Subresource Integrity (SRI)

For production, verify script integrity:

```typescript
// Add integrity check to RemotePluginConfig
interface SecurePluginConfig extends RemotePluginConfig {
  integrity?: string; // SRI hash
}

// Usage
await this.pluginManager.registerRemotePlugin({
  name: 'analytics',
  remoteUrl: 'https://cdn.example.com/plugins/analytics.js',
  exposedModule: 'AnalyticsPlugin',
  integrity: 'sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC'
});
```

#### 3. Trusted Sources Only

Only load plugins from trusted CDNs:

```typescript
const ALLOWED_PLUGIN_DOMAINS = [
  'https://cdn.yourapp.com',
  'https://plugins.yourapp.com'
];

function isAllowedUrl(url: string): boolean {
  return ALLOWED_PLUGIN_DOMAINS.some(domain => url.startsWith(domain));
}

// Validate before loading
if (!isAllowedUrl(pluginUrl)) {
  throw new Error('Untrusted plugin source');
}
```

### Performance Optimization

#### 1. Preload Critical Plugins

```html
<!-- In your index.html -->
<link rel="preload"
      href="https://cdn.example.com/plugins/analytics.js"
      as="script"
      crossorigin="anonymous">
```

#### 2. Cache Plugins Locally

```typescript
// Service worker to cache plugin scripts
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/plugins/')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then((fetchResponse) => {
          const responseToCache = fetchResponse.clone();
          caches.open('plugins-v1').then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return fetchResponse;
        });
      })
    );
  }
});
```

#### 3. Lazy Load on Demand

```typescript
// Only load when user navigates to feature
@Component({
  selector: 'app-analytics-page',
  template: `<div #analyticsContainer></div>`
})
export class AnalyticsPageComponent implements OnInit {
  async ngOnInit() {
    // Load plugin only when this page is accessed
    await this.pluginManager.registerRemotePlugin({
      name: 'analytics',
      remoteUrl: 'https://cdn.example.com/plugins/analytics.js',
      exposedModule: 'AnalyticsPlugin'
    });

    // Create component
    await this.pluginManager.createPluginComponent(
      'analytics',
      this.analyticsContainer
    );
  }
}
```

### Troubleshooting

#### Plugin Not Loading

```typescript
// Enable debug mode
providePluginSystem({
  enableDevMode: true,
  debugOptions: {
    logLifecycleHooks: true,
    logStateTransitions: true
  }
})

// Check browser console for detailed logs
```

#### CORS Issues

Ensure your CDN serves plugins with proper CORS headers:

```http
Access-Control-Allow-Origin: https://yourapp.com
Access-Control-Allow-Methods: GET
```

#### Module Not Found

Verify the exposed module name matches:

```javascript
// Plugin file must expose exactly this name
window.AnalyticsPlugin = { ... };

// Must match exposedModule config
exposedModule: 'AnalyticsPlugin' // Exact match required
```

### Migration from v1.1.x to v1.2.0

No breaking changes! All existing code continues to work.

New features:
- `registerRemotePlugin()` - Load from URL
- `unregisterRemotePlugin()` - Clean up remote plugins
- `getRemoteCacheStats()` - Monitor cache
- `clearRemoteCache()` - Clear all cached plugins

### Complete Example

See `/examples/remote-plugins/` for a complete working example with:
- Host application
- Remote plugin builds
- CDN configuration
- Error handling
- Cache management

### Conclusion

Remote plugin loading provides the ultimate flexibility for dynamic plugin systems:
- ✅ True separation of plugins from host app
- ✅ Independent plugin updates
- ✅ Memory cleanup when unloaded
- ✅ CDN distribution
- ✅ Plugin marketplace support

Combined with v1.1.2's memory optimizations, you now have a production-ready dynamic plugin system for Angular!
