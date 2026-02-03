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
  PluginError,
  PluginLoadError,
  PluginNotFoundError,
  PluginStateError,
  PluginLifecycleError
} from 'angular-dynamic-plugin-system';

@Component({
  standalone: true,
  selector: 'flaky-plugin',
  template: `
    <div class="flaky-plugin">
      <h2>Flaky Plugin (Simulates Random Errors)</h2>
      <p>Load attempts: {{ loadAttempts }}</p>
      <p>Status: {{ status }}</p>
    </div>
  `
})
export class FlakyPluginComponent implements PluginLifecycle {
  loadAttempts = 0;
  status = 'Initializing...';

  async onLoad(context: PluginContext): Promise<void> {
    this.loadAttempts++;

    if (Math.random() < 0.5) {
      throw new Error('Simulated load failure');
    }

    await this.simulateAsyncOperation();
    this.status = 'Loaded successfully';
  }

  async onActivate(context: PluginContext): Promise<void> {
    if (Math.random() < 0.2) {
      throw new Error('Simulated activation failure');
    }

    this.status = 'Active';
  }

  private async simulateAsyncOperation(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 1000));
  }
}

export const FlakyPluginManifest: PluginManifest = {
  name: 'flaky-plugin',
  version: '1.0.0',
  entryComponent: FlakyPluginComponent,
  displayName: 'Flaky Plugin',
  description: 'Plugin that randomly fails for testing error handling'
};

@Component({
  standalone: true,
  selector: 'timeout-plugin',
  template: `
    <div class="timeout-plugin">
      <h2>Timeout Plugin</h2>
      <p>This plugin takes too long to load...</p>
    </div>
  `
})
export class TimeoutPluginComponent implements PluginLifecycle {
  async onLoad(context: PluginContext): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 15000));
  }
}

export const TimeoutPluginManifest: PluginManifest = {
  name: 'timeout-plugin',
  version: '1.0.0',
  entryComponent: TimeoutPluginComponent,
  displayName: 'Timeout Plugin',
  description: 'Plugin that exceeds timeout threshold'
};

@Component({
  standalone: true,
  selector: 'broken-plugin',
  template: `
    <div class="broken-plugin">
      <h2>Broken Plugin</h2>
    </div>
  `
})
export class BrokenPluginComponent implements PluginLifecycle {
  async onLoad(context: PluginContext): Promise<void> {
    throw new Error('Critical plugin initialization error');
  }
}

export const BrokenPluginManifest: PluginManifest = {
  name: 'broken-plugin',
  version: '1.0.0',
  entryComponent: BrokenPluginComponent,
  displayName: 'Broken Plugin',
  description: 'Plugin that always fails'
};

interface ErrorLogEntry {
  timestamp: Date;
  pluginName: string;
  errorType: string;
  message: string;
  recovered: boolean;
}

@Component({
  standalone: true,
  imports: [CommonModule, PluginOutletComponent],
  selector: 'app-root',
  template: `
    <div class="error-handling-demo">
      <header>
        <h1>Error Handling & Recovery Demo</h1>
      </header>

      <div class="controls">
        <button (click)="loadPlugin('flaky-plugin')">
          Load Flaky Plugin (50% failure rate)
        </button>
        <button (click)="loadPlugin('timeout-plugin')">
          Load Timeout Plugin (will timeout)
        </button>
        <button (click)="loadPlugin('broken-plugin')">
          Load Broken Plugin (always fails)
        </button>
        <button (click)="loadPlugin('nonexistent-plugin')">
          Load Non-existent Plugin
        </button>
        <button (click)="clearErrors()">Clear Error Log</button>
      </div>

      <div class="plugin-grid">
        <div class="plugin-container">
          <h3>Flaky Plugin</h3>
          <div class="status" [class.error]="getPluginState('flaky-plugin') === 'ERROR'">
            State: {{ getPluginState('flaky-plugin') }}
          </div>
          <plugin-outlet
            *ngIf="getPluginState('flaky-plugin') === 'ACTIVE'"
            plugin="flaky-plugin"
          ></plugin-outlet>
        </div>

        <div class="plugin-container">
          <h3>Timeout Plugin</h3>
          <div class="status" [class.error]="getPluginState('timeout-plugin') === 'ERROR'">
            State: {{ getPluginState('timeout-plugin') }}
          </div>
          <plugin-outlet
            *ngIf="getPluginState('timeout-plugin') === 'ACTIVE'"
            plugin="timeout-plugin"
          ></plugin-outlet>
        </div>

        <div class="plugin-container">
          <h3>Broken Plugin</h3>
          <div class="status" [class.error]="getPluginState('broken-plugin') === 'ERROR'">
            State: {{ getPluginState('broken-plugin') }}
          </div>
          <plugin-outlet
            *ngIf="getPluginState('broken-plugin') === 'ACTIVE'"
            plugin="broken-plugin"
          ></plugin-outlet>
        </div>
      </div>

      <div class="error-log">
        <h2>Error Log</h2>
        <div class="log-stats">
          <span>Total Errors: {{ errorLog.length }}</span>
          <span>Recovered: {{ recoveredCount }}</span>
          <span>Failed: {{ failedCount }}</span>
        </div>
        <div class="log-entries">
          <div
            *ngFor="let entry of errorLog"
            class="log-entry"
            [class.recovered]="entry.recovered"
          >
            <div class="log-timestamp">
              {{ entry.timestamp | date:'medium' }}
            </div>
            <div class="log-plugin">
              {{ entry.pluginName }}
            </div>
            <div class="log-error-type">
              {{ entry.errorType }}
            </div>
            <div class="log-message">
              {{ entry.message }}
            </div>
            <div class="log-status">
              {{ entry.recovered ? 'Recovered' : 'Failed' }}
            </div>
          </div>
        </div>
      </div>

      <div class="retry-config">
        <h2>Retry Configuration</h2>
        <div>
          <label>
            <input
              type="checkbox"
              [(ngModel)]="retryConfig.enabled"
            />
            Enable Auto-Retry
          </label>
        </div>
        <div>
          <label>
            Max Retries:
            <input
              type="number"
              [(ngModel)]="retryConfig.maxRetries"
              min="0"
              max="10"
            />
          </label>
        </div>
        <div>
          <label>
            Retry Delay (ms):
            <input
              type="number"
              [(ngModel)]="retryConfig.delayMs"
              min="0"
              max="10000"
              step="100"
            />
          </label>
        </div>
      </div>
    </div>
  `
})
export class App implements OnInit, OnDestroy {
  errorLog: ErrorLogEntry[] = [];
  pluginStates: Record<string, PluginState> = {};
  retryConfig = {
    enabled: true,
    maxRetries: 3,
    delayMs: 2000
  };

  private destroy$ = new Subject<void>();
  private retryAttempts = new Map<string, number>();

  constructor(private pluginManager: PluginManager) {}

  ngOnInit(): void {
    this.registerPlugins();
    this.setupErrorHandling();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private registerPlugins(): void {
    this.pluginManager.register({
      name: 'flaky-plugin',
      loadFn: () => import('./flaky-plugin').then(m => ({
        PluginManifest: m.FlakyPluginManifest
      })),
      config: {
        timeout: 5000,
        retryOnError: true,
        maxRetries: 3
      }
    });

    this.pluginManager.register({
      name: 'timeout-plugin',
      loadFn: () => import('./timeout-plugin').then(m => ({
        PluginManifest: m.TimeoutPluginManifest
      })),
      config: {
        timeout: 3000
      }
    });

    this.pluginManager.register({
      name: 'broken-plugin',
      loadFn: () => import('./broken-plugin').then(m => ({
        PluginManifest: m.BrokenPluginManifest
      })),
      config: {
        timeout: 5000
      }
    });
  }

  private setupErrorHandling(): void {
    this.pluginManager.pluginState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        if (event) {
          this.pluginStates[event.pluginName] = event.state;

          if (event.error) {
            this.handlePluginError(event.pluginName, event.error);
          }

          if (event.state === PluginState.LOADED || event.state === PluginState.ACTIVE) {
            const entry = this.errorLog.find(
              e => e.pluginName === event.pluginName && !e.recovered
            );
            if (entry) {
              entry.recovered = true;
            }
          }
        }
      });
  }

  private handlePluginError(pluginName: string, error: Error): void {
    const errorType = this.getErrorType(error);

    this.errorLog.unshift({
      timestamp: new Date(),
      pluginName,
      errorType,
      message: error.message,
      recovered: false
    });

    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(0, 100);
    }

    if (this.shouldRetry(pluginName, error)) {
      this.scheduleRetry(pluginName);
    }
  }

  private getErrorType(error: Error): string {
    if (error instanceof PluginLoadError) return 'PluginLoadError';
    if (error instanceof PluginNotFoundError) return 'PluginNotFoundError';
    if (error instanceof PluginStateError) return 'PluginStateError';
    if (error instanceof PluginLifecycleError) return 'PluginLifecycleError';
    if (error instanceof PluginError) return 'PluginError';
    return 'Error';
  }

  private shouldRetry(pluginName: string, error: Error): boolean {
    if (!this.retryConfig.enabled) return false;

    if (error instanceof PluginNotFoundError) return false;

    const attempts = this.retryAttempts.get(pluginName) || 0;
    return attempts < this.retryConfig.maxRetries;
  }

  private scheduleRetry(pluginName: string): void {
    const attempts = this.retryAttempts.get(pluginName) || 0;
    this.retryAttempts.set(pluginName, attempts + 1);

    setTimeout(() => {
      this.loadPlugin(pluginName);
    }, this.retryConfig.delayMs);
  }

  async loadPlugin(pluginName: string): Promise<void> {
    try {
      await this.pluginManager.load(pluginName);
      this.retryAttempts.delete(pluginName);
    } catch (error) {
      if (error instanceof PluginNotFoundError) {
        this.errorLog.unshift({
          timestamp: new Date(),
          pluginName,
          errorType: 'PluginNotFoundError',
          message: `Plugin "${pluginName}" is not registered`,
          recovered: false
        });
      }
    }
  }

  getPluginState(pluginName: string): string {
    return this.pluginStates[pluginName] || 'UNKNOWN';
  }

  get recoveredCount(): number {
    return this.errorLog.filter(e => e.recovered).length;
  }

  get failedCount(): number {
    return this.errorLog.filter(e => !e.recovered).length;
  }

  clearErrors(): void {
    this.errorLog = [];
    this.retryAttempts.clear();
  }
}

bootstrapApplication(App, {
  providers: [
    providePluginSystem({
      globalTimeout: 5000,
      maxConcurrentLoads: 1,
      enableDevMode: true,
      lifecycleHooks: {
        beforeLoad: async (pluginName) => {
        },
        afterLoad: async (pluginName) => {
        },
        onError: (pluginName, error) => {
        }
      }
    })
  ]
});
