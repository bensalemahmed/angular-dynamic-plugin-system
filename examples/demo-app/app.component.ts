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
        <p class="version-badge">v1.4.0 - NgModule Support</p>
      </header>

      <nav class="plugin-controls">
        <h2>Plugin Controls</h2>

        <!-- Standalone Component Plugin -->
        <div class="plugin-section">
          <h4>📄 Invoice Plugin (Standalone Component)</h4>
          <div class="button-group">
            <button (click)="registerPlugin()" [disabled]="isPluginRegistered">
              Register
            </button>
            <button (click)="loadPlugin()" [disabled]="!isPluginRegistered || isPluginLoaded">
              Load
            </button>
            <button (click)="unloadPlugin()" [disabled]="!isPluginLoaded">
              Unload
            </button>
          </div>
        </div>

        <!-- NgModule Plugin (v1.4.0) -->
        <div class="plugin-section">
          <h4>📊 Dashboard Plugin (NgModule) <span class="new-badge">v1.4.0</span></h4>
          <div class="button-group">
            <button (click)="registerDashboardPlugin()" [disabled]="isDashboardRegistered">
              Register
            </button>
            <button (click)="loadDashboardPlugin()" [disabled]="!isDashboardRegistered || isDashboardLoaded">
              Load
            </button>
            <button (click)="unloadDashboardPlugin()" [disabled]="!isDashboardLoaded">
              Unload
            </button>
          </div>
        </div>

        <div class="plugin-status">
          <h3>Plugin Status</h3>
          <p>Invoice: <strong>{{ pluginState || 'Not Registered' }}</strong></p>
          <p>Dashboard: <strong>{{ dashboardState || 'Not Registered' }}</strong></p>
        </div>

        <div class="all-plugins">
          <h3>All Plugins</h3>
          <ul>
            <li *ngFor="let plugin of allPlugins">
              {{ plugin.manifest.name }} - {{ plugin.state }}
              <span *ngIf="plugin.manifest.entryModule" class="module-badge">NgModule</span>
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

        <!-- Invoice Plugin (Standalone) -->
        <div *ngIf="isPluginLoaded" class="plugin-wrapper">
          <plugin-outlet [plugin]="'invoice'"></plugin-outlet>
        </div>

        <!-- Dashboard Plugin (NgModule) -->
        <div *ngIf="isDashboardLoaded" class="plugin-wrapper">
          <plugin-outlet [plugin]="'dashboard'"></plugin-outlet>
        </div>

        <div *ngIf="!isPluginLoaded && !isDashboardLoaded" class="empty-state">
          <p>No plugins loaded. Register and load a plugin to see it here.</p>
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

    .version-badge {
      margin: 5px 0 0 0;
      font-size: 0.875rem;
      opacity: 0.9;
    }

    .plugin-section {
      margin-bottom: 20px;
      padding: 15px;
      background: white;
      border-radius: 6px;
    }

    .plugin-section h4 {
      margin: 0 0 10px 0;
      font-size: 0.9rem;
    }

    .new-badge {
      background: #10b981;
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.7rem;
      margin-left: 5px;
    }

    .module-badge {
      background: #6366f1;
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.65rem;
      margin-left: 5px;
    }

    .plugin-wrapper {
      margin-bottom: 20px;
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  // Invoice Plugin (Standalone Component)
  isPluginRegistered = false;
  isPluginLoaded = false;
  isPluginReady = false;
  pluginState?: PluginState;

  // Dashboard Plugin (NgModule) - v1.4.0
  isDashboardRegistered = false;
  isDashboardLoaded = false;
  dashboardState?: PluginState;

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
      this.updateStatus();
    } catch (error) {
      // Error is logged via pluginState$
    }
  }

  // ================================================
  // Dashboard Plugin Methods (NgModule) - v1.4.0
  // ================================================

  registerDashboardPlugin(): void {
    this.pluginManager.register({
      name: 'dashboard',
      loadFn: () => import('../dashboard-plugin/dashboard-plugin.module'),
      config: {
        autoLoad: false,
        timeout: 5000,
        metadata: {
          type: 'ngmodule',
          tier: 'PRO'
        }
      }
    });

    this.isDashboardRegistered = true;
    this.updateStatus();
  }

  async loadDashboardPlugin(): Promise<void> {
    try {
      await this.pluginManager.load('dashboard');
      this.isDashboardLoaded = true;
      this.updateStatus();
    } catch (error) {
      // Error is logged via pluginState$
    }
  }

  async unloadDashboardPlugin(): Promise<void> {
    try {
      await this.pluginManager.unregister('dashboard');
      this.isDashboardLoaded = false;
      this.isDashboardRegistered = false;
      this.updateStatus();
    } catch (error) {
      // Error is logged via pluginState$
    }
  }

  private updateStatus(): void {
    this.pluginState = this.pluginManager.getPluginState('invoice');
    this.isPluginReady = this.pluginManager.isReady('invoice');
    this.dashboardState = this.pluginManager.getPluginState('dashboard');
    this.allPlugins = this.pluginManager.getAllPlugins();
  }
}
