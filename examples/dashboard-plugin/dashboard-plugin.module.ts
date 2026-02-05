/**
 * Dashboard Plugin with NgModule (v1.4.0 Example)
 *
 * Demonstrates how to create a plugin with its own NgModule,
 * including internal services and pipes.
 */

import { NgModule, Component, Injectable, Pipe, PipeTransform } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PluginLifecycle, PluginContext } from '@angular-dynamic/plugin-system';

// ============================================
// Plugin-Scoped Service
// ============================================
@Injectable()
export class DashboardDataService {
  private metrics = {
    totalVisits: 12543,
    activeUsers: 234,
    salesTotal: 45678.90,
    conversionRate: 3.2
  };

  getMetrics() {
    return { ...this.metrics };
  }

  refreshMetrics() {
    this.metrics.totalVisits += Math.floor(Math.random() * 100);
    this.metrics.activeUsers = Math.floor(Math.random() * 500);
    this.metrics.salesTotal += Math.random() * 1000;
    this.metrics.conversionRate = Math.round((Math.random() * 5 + 1) * 10) / 10;
    return this.getMetrics();
  }
}

// ============================================
// Plugin-Scoped Pipe
// ============================================
@Pipe({ name: 'shortNumber' })
export class ShortNumberPipe implements PipeTransform {
  transform(value: number): string {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    }
    if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
  }
}

// ============================================
// Plugin Component
// ============================================
@Component({
  selector: 'dashboard-plugin',
  template: `
    <div class="dashboard-plugin">
      <div class="header">
        <h2>📊 Dashboard Analytics</h2>
        <span class="badge">NgModule Plugin</span>
      </div>
      <p class="loaded-time">Loaded at: {{ loadedAt | date:'medium' }}</p>

      <div class="metrics-grid">
        <div class="metric-card">
          <span class="metric-value">{{ metrics.totalVisits | shortNumber }}</span>
          <span class="metric-label">Total Visits</span>
        </div>

        <div class="metric-card">
          <span class="metric-value">{{ metrics.activeUsers }}</span>
          <span class="metric-label">Active Users</span>
        </div>

        <div class="metric-card">
          <span class="metric-value">\${{ metrics.salesTotal | number:'1.2-2' }}</span>
          <span class="metric-label">Total Sales</span>
        </div>

        <div class="metric-card">
          <span class="metric-value">{{ metrics.conversionRate }}%</span>
          <span class="metric-label">Conversion Rate</span>
        </div>
      </div>

      <button class="refresh-btn" (click)="refresh()">🔄 Refresh Data</button>

      <div class="info-box">
        <strong>v1.4.0 Feature:</strong> This plugin uses its own NgModule with:
        <ul>
          <li>Internal DashboardDataService (dependency injection)</li>
          <li>Custom ShortNumberPipe</li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-plugin {
      padding: 24px;
      border: 2px solid #6366f1;
      border-radius: 12px;
      background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
      font-family: system-ui, sans-serif;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }

    h2 {
      color: #4f46e5;
      margin: 0;
      font-size: 1.5rem;
    }

    .badge {
      background: #6366f1;
      color: white;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .loaded-time {
      color: #6b7280;
      font-size: 0.875rem;
      margin-bottom: 20px;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }

    .metric-card {
      background: white;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.15);
      text-align: center;
    }

    .metric-value {
      display: block;
      font-size: 1.5rem;
      font-weight: 700;
      color: #4f46e5;
    }

    .metric-label {
      display: block;
      font-size: 0.75rem;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 4px;
    }

    .refresh-btn {
      background: #4f46e5;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.875rem;
      transition: background 0.2s;
    }

    .refresh-btn:hover {
      background: #4338ca;
    }

    .info-box {
      margin-top: 20px;
      padding: 12px;
      background: rgba(99, 102, 241, 0.1);
      border-radius: 8px;
      font-size: 0.8rem;
      color: #4f46e5;
    }

    .info-box ul {
      margin: 8px 0 0 0;
      padding-left: 20px;
    }

    .info-box li {
      margin: 4px 0;
    }
  `]
})
export class DashboardPluginComponent implements PluginLifecycle {
  loadedAt?: Date;
  metrics = {
    totalVisits: 0,
    activeUsers: 0,
    salesTotal: 0,
    conversionRate: 0
  };

  // Service injected from the plugin's NgModule!
  constructor(private dataService: DashboardDataService) {}

  async onLoad(context: PluginContext): Promise<void> {
    this.loadedAt = new Date();
    this.metrics = this.dataService.getMetrics();
    console.log('[DashboardPlugin] ✅ Loaded with internal service:', this.metrics);
  }

  async onActivate(context: PluginContext): Promise<void> {
    console.log('[DashboardPlugin] ✅ Activated');
  }

  async onDeactivate(): Promise<void> {
    console.log('[DashboardPlugin] Deactivated');
  }

  async onDestroy(): Promise<void> {
    console.log('[DashboardPlugin] Destroyed');
  }

  refresh(): void {
    this.metrics = this.dataService.refreshMetrics();
    console.log('[DashboardPlugin] Refreshed:', this.metrics);
  }
}

// ============================================
// Plugin NgModule
// ============================================
@NgModule({
  declarations: [
    DashboardPluginComponent,
    ShortNumberPipe
  ],
  imports: [
    CommonModule
  ],
  providers: [
    DashboardDataService
  ]
})
export class DashboardPluginModule {}

// ============================================
// Plugin Manifest
// ============================================
export const PluginManifest = {
  name: 'dashboard',
  version: '1.0.0',
  entryComponent: DashboardPluginComponent,
  entryModule: DashboardPluginModule,  // v1.4.0: NgModule support!
  displayName: 'Dashboard Analytics',
  description: 'Real-time analytics with internal services (NgModule)'
};
