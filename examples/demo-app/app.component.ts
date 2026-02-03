import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import {
  PluginManager,
  PluginOutletComponent,
  PluginState,
  PluginMetadata
} from '@angular-dynamic/plugin-system';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, PluginOutletComponent],
  template: `
    <div class="app-container">
      <header>
        <h1>Angular Dynamic Plugin System - Demo</h1>
      </header>

      <nav class="plugin-controls">
        <h2>Plugin Controls</h2>
        <div class="button-group">
          <button (click)="registerPlugin()" [disabled]="isPluginRegistered">
            Register Invoice Plugin
          </button>
          <button (click)="loadPlugin()" [disabled]="!isPluginRegistered || isPluginLoaded">
            Load Plugin
          </button>
          <button (click)="unloadPlugin()" [disabled]="!isPluginLoaded">
            Unload Plugin
          </button>
          <button (click)="togglePluginDisplay()">
            {{ showPlugin ? 'Hide' : 'Show' }} Plugin
          </button>
        </div>

        <div class="plugin-status">
          <h3>Plugin Status</h3>
          <p>State: <strong>{{ pluginState || 'Not Registered' }}</strong></p>
          <p>Ready: <strong>{{ isPluginReady ? 'Yes' : 'No' }}</strong></p>
        </div>

        <div class="all-plugins">
          <h3>All Plugins</h3>
          <ul>
            <li *ngFor="let plugin of allPlugins">
              {{ plugin.manifest.name }} - {{ plugin.state }}
            </li>
          </ul>
        </div>

        <div class="event-log">
          <h3>Event Log</h3>
          <ul>
            <li *ngFor="let event of eventLog">
              {{ event.timestamp | date:'HH:mm:ss' }} - {{ event.pluginName }} - {{ event.state }}
              <span *ngIf="event.error" class="error">Error: {{ event.error.message }}</span>
            </li>
          </ul>
        </div>
      </nav>

      <main class="plugin-container">
        <h2>Plugin Display Area</h2>
        <plugin-outlet *ngIf="showPlugin && isPluginLoaded" [plugin]="'invoice'"></plugin-outlet>
        <div *ngIf="!showPlugin || !isPluginLoaded" class="empty-state">
          <p>No plugin loaded or plugin is hidden</p>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      display: grid;
      grid-template-columns: 300px 1fr;
      grid-template-rows: auto 1fr;
      gap: 20px;
      padding: 20px;
      min-height: 100vh;
    }

    header {
      grid-column: 1 / -1;
      background: #007bff;
      color: white;
      padding: 20px;
      border-radius: 8px;
    }

    h1 {
      margin: 0;
    }

    .plugin-controls {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #dee2e6;
    }

    .button-group {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 20px;
    }

    button {
      padding: 10px 15px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }

    button:hover:not(:disabled) {
      background: #0056b3;
    }

    button:disabled {
      background: #6c757d;
      cursor: not-allowed;
    }

    .plugin-status,
    .all-plugins,
    .event-log {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #dee2e6;
    }

    h2, h3 {
      margin-top: 0;
    }

    ul {
      list-style: none;
      padding: 0;
      max-height: 200px;
      overflow-y: auto;
    }

    li {
      padding: 8px;
      margin: 4px 0;
      background: white;
      border-radius: 4px;
      font-size: 12px;
    }

    .error {
      color: #dc3545;
      display: block;
      margin-top: 4px;
    }

    .plugin-container {
      background: white;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #dee2e6;
    }

    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 300px;
      color: #6c757d;
      font-style: italic;
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  showPlugin = false;
  isPluginRegistered = false;
  isPluginLoaded = false;
  isPluginReady = false;
  pluginState?: PluginState;
  allPlugins: PluginMetadata[] = [];
  eventLog: Array<{ timestamp: Date; pluginName: string; state: PluginState; error?: Error }> = [];

  private subscription?: Subscription;

  constructor(private pluginManager: PluginManager) {}

  ngOnInit(): void {
    this.subscription = this.pluginManager.pluginState$.subscribe(event => {
      this.eventLog.unshift({
        timestamp: event.timestamp,
        pluginName: event.pluginName,
        state: event.state,
        error: event.error
      });

      if (this.eventLog.length > 50) {
        this.eventLog = this.eventLog.slice(0, 50);
      }

      this.updateStatus();
    });

    this.updateStatus();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  registerPlugin(): void {
    this.pluginManager.register({
      name: 'invoice',
      loadFn: () => import('../invoice-plugin/invoice-plugin.component'),
      config: {
        autoLoad: false,
        timeout: 5000
      }
    });

    this.isPluginRegistered = true;
    this.updateStatus();
  }

  async loadPlugin(): Promise<void> {
    try {
      await this.pluginManager.load('invoice');
      this.isPluginLoaded = true;
      this.updateStatus();
    } catch (error) {
      // Error is logged via pluginState$
    }
  }

  async unloadPlugin(): Promise<void> {
    try {
      await this.pluginManager.unregister('invoice');
      this.isPluginLoaded = false;
      this.isPluginRegistered = false;
      this.showPlugin = false;
      this.updateStatus();
    } catch (error) {
      // Error is logged via pluginState$
    }
  }

  togglePluginDisplay(): void {
    this.showPlugin = !this.showPlugin;
  }

  private updateStatus(): void {
    this.pluginState = this.pluginManager.getPluginState('invoice');
    this.isPluginReady = this.pluginManager.isReady('invoice');
    this.allPlugins = this.pluginManager.getAllPlugins();
  }
}
