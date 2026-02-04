# Security Best Practices

## ⚠️ Remote Plugin Loading - Security Considerations

Remote plugin loading is **powerful but requires careful security management**. This document outlines essential security practices.

---

## 🔒 Critical Security Principles

### 1. Trust Model

**Remote plugins execute arbitrary code in your application context.**

```typescript
// ❌ DANGER - Never do this
await pluginManager.registerRemotePlugin({
  name: 'untrusted',
  remoteUrl: userInput, // NEVER use user input directly!
  exposedModule: 'UntrustedPlugin'
});

// ✅ SAFE - Use allowlist
const TRUSTED_SOURCES = [
  'https://cdn.yourapp.com',
  'https://plugins.yourapp.com'
];

function isTrustedUrl(url: string): boolean {
  return TRUSTED_SOURCES.some(source => url.startsWith(source));
}

if (!isTrustedUrl(pluginUrl)) {
  throw new Error('Untrusted plugin source');
}
```

---

## 🛡️ Security Checklist

### Before Using Remote Loading

- [ ] **Define trusted CDN domains** (never accept arbitrary URLs)
- [ ] **Implement Content Security Policy (CSP)**
- [ ] **Use HTTPS only** (never HTTP)
- [ ] **Implement version pinning** (avoid `latest`)
- [ ] **Add integrity checks** (SRI hashes when possible)
- [ ] **Audit plugin sources** (know what code you're loading)
- [ ] **Monitor plugin updates** (track what changed)
- [ ] **Have rollback strategy** (in case of issues)

---

## 1. Content Security Policy (CSP)

### Recommended CSP Headers

```http
Content-Security-Policy:
  script-src 'self' https://cdn.yourapp.com https://plugins.yourapp.com;
  connect-src 'self' https://api.yourapp.com;
  default-src 'self';
```

### Why It Matters

- Prevents loading scripts from unauthorized domains
- Blocks inline script execution
- Mitigates XSS attacks

### Implementation

**In index.html:**
```html
<meta http-equiv="Content-Security-Policy"
      content="script-src 'self' https://cdn.yourapp.com">
```

**Or via HTTP headers** (preferred):
```nginx
# nginx config
add_header Content-Security-Policy
  "script-src 'self' https://cdn.yourapp.com" always;
```

---

## 2. Trusted Sources Only

### Allowlist Approach

```typescript
// security.service.ts
@Injectable({ providedIn: 'root' })
export class SecurityService {
  private readonly TRUSTED_PLUGIN_DOMAINS = [
    'https://cdn.yourapp.com',
    'https://plugins.yourapp.com'
  ];

  isPluginUrlTrusted(url: string): boolean {
    try {
      const urlObj = new URL(url);

      // Must be HTTPS
      if (urlObj.protocol !== 'https:') {
        return false;
      }

      // Must be from trusted domain
      const origin = `${urlObj.protocol}//${urlObj.host}`;
      return this.TRUSTED_PLUGIN_DOMAINS.includes(origin);
    } catch {
      return false;
    }
  }

  validatePluginConfig(config: RemotePluginConfig): void {
    if (!this.isPluginUrlTrusted(config.remoteUrl)) {
      throw new SecurityError(
        `Plugin URL not trusted: ${config.remoteUrl}. ` +
        `Allowed domains: ${this.TRUSTED_PLUGIN_DOMAINS.join(', ')}`
      );
    }
  }
}

// Usage
async loadPlugin(config: RemotePluginConfig) {
  this.security.validatePluginConfig(config); // Throws if invalid
  await this.pluginManager.registerRemotePlugin(config);
}
```

---

## 3. Subresource Integrity (SRI)

### Why SRI?

Ensures the loaded script hasn't been tampered with.

### Implementation

```typescript
// Future feature - not yet implemented
interface SecureRemotePluginConfig extends RemotePluginConfig {
  integrity?: string; // SRI hash
}

// Example usage (conceptual)
await pluginManager.registerRemotePlugin({
  name: 'analytics',
  remoteUrl: 'https://cdn.yourapp.com/plugins/analytics-v1.0.0.js',
  exposedModule: 'AnalyticsPlugin',
  integrity: 'sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC'
});
```

### Generating SRI Hash

```bash
# Generate SRI hash for your plugin
openssl dgst -sha384 -binary plugin.js | openssl base64 -A
```

---

## 4. Version Pinning

### ❌ Avoid Dynamic Versions

```typescript
// BAD - Version can change silently
remoteUrl: 'https://cdn.app.com/plugins/analytics-latest.js'

// BAD - User-controlled version
remoteUrl: `https://cdn.app.com/plugins/${userSelectedVersion}.js`
```

### ✅ Use Explicit Versions

```typescript
// GOOD - Explicit version
const PLUGIN_VERSION = '1.0.0';
remoteUrl: `https://cdn.app.com/plugins/analytics-${PLUGIN_VERSION}.js`

// BETTER - Version with integrity check
const PLUGINS = {
  analytics: {
    version: '1.0.0',
    url: 'https://cdn.app.com/plugins/analytics-1.0.0.js',
    integrity: 'sha384-...',
    verifiedDate: '2026-02-04'
  }
};
```

---

## 5. Plugin Audit Trail

### Track What's Loaded

```typescript
@Injectable({ providedIn: 'root' })
export class PluginAuditService {
  private auditLog: Array<{
    pluginName: string;
    url: string;
    loadedAt: Date;
    version?: string;
    user?: string;
  }> = [];

  logPluginLoad(config: RemotePluginConfig, user?: string) {
    this.auditLog.push({
      pluginName: config.name,
      url: config.remoteUrl,
      loadedAt: new Date(),
      version: config.version,
      user
    });

    // Send to backend for monitoring
    this.api.post('/api/plugin-audit', this.auditLog[this.auditLog.length - 1]);
  }

  getAuditLog() {
    return [...this.auditLog];
  }
}
```

---

## 6. Runtime Monitoring

### Detect Suspicious Behavior

```typescript
// Monitor for suspicious plugin activity
@Injectable({ providedIn: 'root' })
export class PluginMonitorService {
  constructor(private pluginManager: PluginManager) {
    // Subscribe to plugin state changes
    pluginManager.pluginState$.subscribe(event => {
      if (event.state === PluginState.ERROR) {
        this.reportPluginError(event);
      }
    });
  }

  private reportPluginError(event: PluginStateEvent) {
    // Log to monitoring service
    console.error('Plugin error detected:', {
      plugin: event.pluginName,
      error: event.error,
      timestamp: event.timestamp
    });

    // Could send to backend monitoring
    this.api.post('/api/plugin-errors', {
      plugin: event.pluginName,
      error: event.error?.message,
      timestamp: event.timestamp
    });
  }
}
```

---

## 7. Rollback Strategy

### Quick Recovery

```typescript
class PluginRollbackService {
  private previousVersions = new Map<string, RemotePluginConfig>();

  async upgradePlugin(newConfig: RemotePluginConfig) {
    // Save current version before upgrade
    const current = this.getCurrentPluginConfig(newConfig.name);
    if (current) {
      this.previousVersions.set(newConfig.name, current);
    }

    try {
      // Attempt upgrade
      await this.pluginManager.unregisterRemotePlugin(newConfig.name);
      await this.pluginManager.registerRemotePlugin(newConfig);
    } catch (error) {
      console.error('Plugin upgrade failed, rolling back:', error);

      // Rollback to previous version
      const previous = this.previousVersions.get(newConfig.name);
      if (previous) {
        await this.pluginManager.registerRemotePlugin(previous);
      }

      throw error;
    }
  }
}
```

---

## 🚨 Security Incidents

### If You Suspect a Compromised Plugin

1. **Immediately block the URL**
   ```typescript
   // Add to blocklist
   BLOCKED_URLS.push('https://cdn.app.com/plugins/compromised.js');
   ```

2. **Unload from all active sessions**
   ```typescript
   await pluginManager.unregisterRemotePlugin('compromised-plugin');
   pluginManager.clearRemoteCache();
   ```

3. **Notify users**
   - Display security warning
   - Force page reload if necessary

4. **Investigate**
   - Check audit logs
   - Verify plugin integrity
   - Contact plugin provider

---

## 🎯 Recommendations by Environment

### Development
- ✅ Use debug mode
- ✅ Allow localhost sources
- ✅ Less strict CSP for testing

### Staging
- ✅ Use staging CDN
- ✅ Enforce HTTPS
- ✅ Test CSP policies
- ✅ Audit all plugins

### Production
- ✅ **Strict allowlist** (no exceptions)
- ✅ **HTTPS only**
- ✅ **Strong CSP**
- ✅ **Version pinning**
- ✅ **Monitoring enabled**
- ✅ **Audit logging**
- ❌ **No user-provided URLs**
- ❌ **No HTTP fallback**

---

## 📋 Security Checklist Template

Use this before deploying remote plugin loading:

```typescript
/**
 * SECURITY REVIEW CHECKLIST
 * Complete before enabling remote plugin loading in production
 */

const SECURITY_CHECKLIST = {
  // Access Control
  trustedDomainsConfigured: false, // ✅ or ❌
  allowlistEnforced: false,
  userInputRejected: false,

  // Transport Security
  httpsOnlyEnforced: false,
  cspHeadersConfigured: false,
  corsProperlySet: false,

  // Content Security
  versionPinningImplemented: false,
  integrityChecksEnabled: false, // If available
  pluginSourceAudited: false,

  // Monitoring
  auditLoggingEnabled: false,
  errorMonitoringActive: false,
  alertsConfigured: false,

  // Operations
  rollbackPlanTested: false,
  incidentResponseReady: false,
  documentationUpdated: false
};

function validateSecurityReadiness() {
  const incomplete = Object.entries(SECURITY_CHECKLIST)
    .filter(([_, completed]) => !completed)
    .map(([check]) => check);

  if (incomplete.length > 0) {
    throw new Error(
      'Security checklist incomplete:\\n' +
      incomplete.join('\\n')
    );
  }
}
```

---

## ⚠️ Known Limitations

### No Sandbox Isolation

**Current State:**
- Plugins execute in the same JavaScript context as your app
- Plugins have access to `window`, DOM, and Angular services

**Implications:**
- A malicious plugin can access sensitive data
- A buggy plugin can crash the entire app

**Future Consideration:**
- iframe sandboxing (v2.x)
- Web Workers isolation
- WebAssembly containerization

### No Code Review Automation

**You Must:**
- Manually review plugin code before deployment
- Trust your plugin providers
- Monitor for unexpected behavior

---

## 🎓 Learn More

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Content Security Policy Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Subresource Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity)

---

## 📞 Report Security Issues

If you discover a security vulnerability:

1. **Do NOT open a public issue**
2. Email: security@yourapp.com
3. Include: reproduction steps, impact assessment
4. We'll respond within 48 hours

---

**Security is a shared responsibility. Stay vigilant! 🛡️**
