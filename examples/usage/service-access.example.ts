import { Component, Inject, Injectable, InjectionToken } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  PluginManifest,
  PluginLifecycle,
  PluginContext,
  PLUGIN_CONTEXT
} from 'angular-dynamic-plugin-system';

export interface NotificationService {
  showSuccess(message: string): void;
  showError(message: string): void;
  showInfo(message: string): void;
}

@Injectable({ providedIn: 'root' })
export class NotificationServiceImpl implements NotificationService {
  showSuccess(message: string): void {
  }

  showError(message: string): void {
  }

  showInfo(message: string): void {
  }
}

export const NOTIFICATION_SERVICE = new InjectionToken<NotificationService>(
  'NOTIFICATION_SERVICE'
);

export interface DataService {
  fetchData<T>(endpoint: string): Promise<T>;
  saveData<T>(endpoint: string, data: T): Promise<void>;
}

@Injectable({ providedIn: 'root' })
export class DataServiceImpl implements DataService {
  constructor(private http: HttpClient) {}

  async fetchData<T>(endpoint: string): Promise<T> {
    return this.http.get<T>(endpoint).toPromise() as Promise<T>;
  }

  async saveData<T>(endpoint: string, data: T): Promise<void> {
    await this.http.post(endpoint, data).toPromise();
  }
}

export const DATA_SERVICE = new InjectionToken<DataService>('DATA_SERVICE');

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  preferences: Record<string, any>;
}

export interface UserService {
  getCurrentUser(): UserProfile | null;
  updatePreferences(preferences: Record<string, any>): Promise<void>;
  hasRole(role: string): boolean;
}

@Injectable({ providedIn: 'root' })
export class UserServiceImpl implements UserService {
  private currentUser: UserProfile = {
    id: '123',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'admin',
    preferences: {}
  };

  getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  async updatePreferences(preferences: Record<string, any>): Promise<void> {
    this.currentUser.preferences = {
      ...this.currentUser.preferences,
      ...preferences
    };
  }

  hasRole(role: string): boolean {
    return this.currentUser.role === role;
  }
}

export const USER_SERVICE = new InjectionToken<UserService>('USER_SERVICE');

@Component({
  standalone: true,
  selector: 'data-visualization-plugin',
  template: `
    <div class="data-viz-plugin">
      <h2>Data Visualization</h2>

      <div class="controls">
        <button (click)="loadData()">Load Data</button>
        <button (click)="refreshData()">Refresh</button>
        <button (click)="exportData()">Export</button>
      </div>

      <div class="data-display" *ngIf="data">
        <h3>{{ data.title }}</h3>
        <p>Records: {{ data.records.length }}</p>
        <ul>
          <li *ngFor="let record of data.records">
            {{ record.name }}: {{ record.value }}
          </li>
        </ul>
      </div>

      <div class="user-info">
        <p>User: {{ userName }}</p>
        <p>Role: {{ userRole }}</p>
      </div>
    </div>
  `
})
export class DataVisualizationPluginComponent implements PluginLifecycle {
  data: any = null;
  userName = '';
  userRole = '';

  private notificationService?: NotificationService;
  private dataService?: DataService;
  private userService?: UserService;
  private router?: Router;

  constructor(@Inject(PLUGIN_CONTEXT) private context: PluginContext) {}

  async onLoad(context: PluginContext): Promise<void> {
    this.resolveServices();
    this.loadUserInfo();
  }

  async onActivate(context: PluginContext): Promise<void> {
    if (this.notificationService) {
      this.notificationService.showInfo('Data Visualization plugin activated');
    }
  }

  private resolveServices(): void {
    this.notificationService = this.context.getService(NOTIFICATION_SERVICE);
    this.dataService = this.context.getService(DATA_SERVICE);
    this.userService = this.context.getService(USER_SERVICE);
    this.router = this.context.getService(Router);

    if (!this.notificationService) {
    }

    if (!this.dataService) {
    }

    if (!this.userService) {
    }
  }

  private loadUserInfo(): void {
    if (this.userService) {
      const user = this.userService.getCurrentUser();
      if (user) {
        this.userName = user.name;
        this.userRole = user.role;
      }
    }
  }

  async loadData(): Promise<void> {
    if (!this.dataService) {
      if (this.notificationService) {
        this.notificationService.showError('Data service not available');
      }
      return;
    }

    try {
      this.data = await this.dataService.fetchData('/api/visualization-data');

      if (this.notificationService) {
        this.notificationService.showSuccess('Data loaded successfully');
      }

      this.context.emit('data:loaded', {
        recordCount: this.data.records.length
      });
    } catch (error) {
      if (this.notificationService) {
        this.notificationService.showError('Failed to load data');
      }
    }
  }

  async refreshData(): Promise<void> {
    await this.loadData();
  }

  async exportData(): Promise<void> {
    if (!this.data) {
      if (this.notificationService) {
        this.notificationService.showError('No data to export');
      }
      return;
    }

    const blob = new Blob([JSON.stringify(this.data, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data-export.json';
    a.click();
    URL.revokeObjectURL(url);

    if (this.notificationService) {
      this.notificationService.showSuccess('Data exported successfully');
    }
  }
}

export const DataVisualizationPluginManifest: PluginManifest = {
  name: 'data-visualization-plugin',
  version: '1.0.0',
  entryComponent: DataVisualizationPluginComponent,
  displayName: 'Data Visualization',
  description: 'Plugin demonstrating host service access'
};

@Component({
  standalone: true,
  selector: 'secure-plugin',
  template: `
    <div class="secure-plugin">
      <h2>Secure Plugin</h2>
      <p *ngIf="!hasAccess" class="error">
        Access denied: Admin role required
      </p>
      <div *ngIf="hasAccess">
        <p>Welcome, {{ userName }}!</p>
        <button (click)="performSecureAction()">Secure Action</button>
      </div>
    </div>
  `
})
export class SecurePluginComponent implements PluginLifecycle {
  hasAccess = false;
  userName = '';

  private userService?: UserService;
  private notificationService?: NotificationService;

  constructor(@Inject(PLUGIN_CONTEXT) private context: PluginContext) {}

  async onLoad(context: PluginContext): Promise<void> {
    this.userService = context.getService(USER_SERVICE);
    this.notificationService = context.getService(NOTIFICATION_SERVICE);

    if (this.userService) {
      this.hasAccess = this.userService.hasRole('admin');
      const user = this.userService.getCurrentUser();
      if (user) {
        this.userName = user.name;
      }
    }

    if (!this.hasAccess) {
      if (this.notificationService) {
        this.notificationService.showError('Insufficient permissions');
      }
    }
  }

  async onActivate(context: PluginContext): Promise<void> {
    if (this.hasAccess && this.notificationService) {
      this.notificationService.showInfo('Secure plugin activated');
    }
  }

  performSecureAction(): void {
    if (this.notificationService) {
      this.notificationService.showSuccess('Secure action performed');
    }

    this.context.emit('secure:action-performed', {
      timestamp: new Date()
    });
  }
}

export const SecurePluginManifest: PluginManifest = {
  name: 'secure-plugin',
  version: '1.0.0',
  entryComponent: SecurePluginComponent,
  displayName: 'Secure Plugin',
  description: 'Plugin with role-based access control'
};

import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { PluginManager, providePluginSystem } from 'angular-dynamic-plugin-system';

@Component({
  standalone: true,
  selector: 'app-root',
  template: '<div>Service Access Example</div>'
})
export class App {
  constructor(pluginManager: PluginManager) {
    pluginManager.register({
      name: 'data-visualization-plugin',
      loadFn: () => import('./data-viz-plugin').then(m => ({
        PluginManifest: m.DataVisualizationPluginManifest
      })),
      config: {
        allowedServices: [
          NOTIFICATION_SERVICE,
          DATA_SERVICE,
          USER_SERVICE,
          Router
        ]
      }
    });

    pluginManager.register({
      name: 'secure-plugin',
      loadFn: () => import('./secure-plugin').then(m => ({
        PluginManifest: m.SecurePluginManifest
      })),
      config: {
        allowedServices: [
          USER_SERVICE,
          NOTIFICATION_SERVICE
        ]
      }
    });
  }
}

bootstrapApplication(App, {
  providers: [
    provideHttpClient(),
    { provide: NOTIFICATION_SERVICE, useClass: NotificationServiceImpl },
    { provide: DATA_SERVICE, useClass: DataServiceImpl },
    { provide: USER_SERVICE, useClass: UserServiceImpl },
    providePluginSystem({
      defaultAllowedServices: [
        NOTIFICATION_SERVICE,
        USER_SERVICE
      ]
    })
  ]
});
