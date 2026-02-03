import { Component, OnInit, OnDestroy } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import {
  PluginManager,
  PluginOutletComponent,
  providePluginSystem,
  PluginManifest,
  PluginLifecycle,
  PluginContext,
  PluginState,
  PluginStateEvent
} from 'angular-dynamic-plugin-system';

@Component({
  standalone: true,
  selector: 'analytics-plugin',
  template: `
    <div class="analytics-dashboard">
      <h2>Analytics Dashboard</h2>
      <p>Page views: {{ pageViews }}</p>
    </div>
  `
})
export class AnalyticsPluginComponent implements PluginLifecycle {
  pageViews = 0;
  private context?: PluginContext;

  async onLoad(context: PluginContext): Promise<void> {
    this.context = context;
    await this.loadAnalyticsData();
  }

  async onActivate(context: PluginContext): Promise<void> {
    this.subscribeToEvents();
  }

  async onDeactivate(): Promise<void> {
    this.cleanup();
  }

  async onDestroy(): Promise<void> {
    this.cleanup();
  }

  private async loadAnalyticsData(): Promise<void> {
    this.pageViews = 1000;
  }

  private subscribeToEvents(): void {
    if (this.context) {
      this.context.subscribe('page-view', () => {
        this.pageViews++;
      });
    }
  }

  private cleanup(): void {
  }
}

export const AnalyticsPluginManifest: PluginManifest = {
  name: 'analytics-plugin',
  version: '1.0.0',
  entryComponent: AnalyticsPluginComponent,
  displayName: 'Analytics Plugin',
  description: 'Real-time analytics dashboard'
};

@Component({
  standalone: true,
  selector: 'settings-plugin',
  template: `
    <div class="settings-panel">
      <h2>Settings</h2>
      <button (click)="saveSettings()">Save</button>
    </div>
  `
})
export class SettingsPluginComponent implements PluginLifecycle {
  private context?: PluginContext;

  async onLoad(context: PluginContext): Promise<void> {
    this.context = context;
  }

  async onActivate(context: PluginContext): Promise<void> {
  }

  saveSettings(): void {
    if (this.context) {
      this.context.emit('settings-saved', { timestamp: new Date() });
    }
  }
}

export const SettingsPluginManifest: PluginManifest = {
  name: 'settings-plugin',
  version: '1.0.0',
  entryComponent: SettingsPluginComponent,
  displayName: 'Settings Plugin',
  description: 'Application settings panel'
};

@Component({
  standalone: true,
  imports: [CommonModule, PluginOutletComponent],
  selector: 'app-root',
  template: `
    <div class="app-container">
      <header>
        <h1>Multi-Plugin Application</h1>
        <div class="plugin-status">
          <div *ngFor="let plugin of pluginStates | keyvalue">
            {{ plugin.key }}: {{ plugin.value }}
          </div>
        </div>
      </header>

      <main>
        <div class="plugin-grid">
          <div class="plugin-slot">
            <plugin-outlet plugin="analytics-plugin"></plugin-outlet>
          </div>
          <div class="plugin-slot">
            <plugin-outlet plugin="settings-plugin"></plugin-outlet>
          </div>
        </div>
      </main>

      <div class="controls">
        <button (click)="loadAllPlugins()">Load All</button>
        <button (click)="unloadPlugin('analytics-plugin')">Unload Analytics</button>
        <button (click)="reloadPlugin('settings-plugin')">Reload Settings</button>
      </div>

      <div class="event-log">
        <h3>Event Log</h3>
        <div *ngFor="let event of eventLog" class="log-entry">
          {{ event.timestamp | date:'medium' }}: {{ event.pluginName }} - {{ event.state }}
          <span *ngIf="event.error" class="error">{{ event.error.message }}</span>
        </div>
      </div>
    </div>
  `
})
export class App implements OnInit, OnDestroy {
  pluginStates: Record<string, string> = {};
  eventLog: PluginStateEvent[] = [];
  private destroy$ = new Subject<void>();

  constructor(private pluginManager: PluginManager) {}

  ngOnInit(): void {
    this.registerPlugins();
    this.subscribeToPluginStates();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private registerPlugins(): void {
    this.pluginManager.register({
      name: 'analytics-plugin',
      loadFn: () => import('./analytics-plugin').then(m => ({
        PluginManifest: m.AnalyticsPluginManifest
      })),
      config: {
        autoLoad: false,
        retryOnError: true,
        maxRetries: 3,
        timeout: 5000
      }
    });

    this.pluginManager.register({
      name: 'settings-plugin',
      loadFn: () => import('./settings-plugin').then(m => ({
        PluginManifest: m.SettingsPluginManifest
      })),
      config: {
        autoLoad: false,
        timeout: 3000
      }
    });
  }

  private subscribeToPluginStates(): void {
    this.pluginManager.pluginState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        if (event) {
          this.pluginStates[event.pluginName] = event.state;
          this.eventLog.unshift(event);

          if (this.eventLog.length > 50) {
            this.eventLog = this.eventLog.slice(0, 50);
          }

          if (event.error) {
            this.handlePluginError(event);
          }
        }
      });
  }

  private handlePluginError(event: PluginStateEvent): void {
    const shouldRetry = event.pluginName === 'analytics-plugin';

    if (shouldRetry) {
      setTimeout(() => {
        this.pluginManager.load(event.pluginName).catch(() => {});
      }, 2000);
    }
  }

  async loadAllPlugins(): Promise<void> {
    try {
      await this.pluginManager.loadMany(['analytics-plugin', 'settings-plugin']);
    } catch (error) {
    }
  }

  async unloadPlugin(pluginName: string): Promise<void> {
    try {
      await this.pluginManager.unregister(pluginName);
    } catch (error) {
    }
  }

  async reloadPlugin(pluginName: string): Promise<void> {
    try {
      const state = this.pluginManager.getPluginState(pluginName);

      if (state === PluginState.LOADED || state === PluginState.ACTIVE) {
        await this.pluginManager.unregister(pluginName);
      }

      await this.pluginManager.load(pluginName);
    } catch (error) {
    }
  }
}

bootstrapApplication(App, {
  providers: [
    providePluginSystem({
      globalTimeout: 10000,
      maxConcurrentLoads: 2,
      enableDevMode: true,
      lifecycleHooks: {
        beforeLoad: async (pluginName) => {
        },
        afterLoad: async (pluginName) => {
        },
        beforeUnload: async (pluginName) => {
        },
        afterUnload: async (pluginName) => {
        },
        onError: (pluginName, error) => {
        }
      }
    })
  ]
});
