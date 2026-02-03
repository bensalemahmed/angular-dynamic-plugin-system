import { Component, Injectable, InjectionToken } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { Router, provideRouter, Routes } from '@angular/router';
import {
  PluginManager,
  PluginOutletComponent,
  providePluginSystem
} from 'angular-dynamic-plugin-system';

export interface ThemeService {
  getCurrentTheme(): string;
  setTheme(theme: string): void;
}

@Injectable({ providedIn: 'root' })
export class ThemeServiceImpl implements ThemeService {
  private currentTheme = 'light';

  getCurrentTheme(): string {
    return this.currentTheme;
  }

  setTheme(theme: string): void {
    this.currentTheme = theme;
    document.body.setAttribute('data-theme', theme);
  }
}

export const THEME_SERVICE = new InjectionToken<ThemeService>('THEME_SERVICE');

export interface AuthService {
  isAuthenticated(): boolean;
  getUser(): { id: string; name: string; email: string } | null;
  hasPermission(permission: string): boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthServiceImpl implements AuthService {
  private user = {
    id: '123',
    name: 'John Doe',
    email: 'john@example.com'
  };

  private permissions = new Set(['read', 'write', 'admin']);

  isAuthenticated(): boolean {
    return !!this.user;
  }

  getUser() {
    return this.user;
  }

  hasPermission(permission: string): boolean {
    return this.permissions.has(permission);
  }
}

export const AUTH_SERVICE = new InjectionToken<AuthService>('AUTH_SERVICE');

export interface ApiService {
  get<T>(url: string): Promise<T>;
  post<T>(url: string, data: any): Promise<T>;
}

@Injectable({ providedIn: 'root' })
export class ApiServiceImpl implements ApiService {
  constructor(private http: HttpClient) {}

  async get<T>(url: string): Promise<T> {
    return this.http.get<T>(url).toPromise() as Promise<T>;
  }

  async post<T>(url: string, data: any): Promise<T> {
    return this.http.post<T>(url, data).toPromise() as Promise<T>;
  }
}

export const API_SERVICE = new InjectionToken<ApiService>('API_SERVICE');

@Component({
  standalone: true,
  imports: [PluginOutletComponent],
  selector: 'app-dashboard',
  template: `
    <div class="dashboard">
      <h1>Dashboard</h1>
      <plugin-outlet plugin="dashboard-widget"></plugin-outlet>
    </div>
  `
})
export class DashboardComponent {}

@Component({
  standalone: true,
  imports: [PluginOutletComponent],
  selector: 'app-settings',
  template: `
    <div class="settings">
      <h1>Settings</h1>
      <plugin-outlet plugin="settings-panel"></plugin-outlet>
    </div>
  `
})
export class SettingsComponent {}

@Component({
  standalone: true,
  imports: [PluginOutletComponent],
  selector: 'app-analytics',
  template: `
    <div class="analytics">
      <h1>Analytics</h1>
      <plugin-outlet plugin="analytics-dashboard"></plugin-outlet>
    </div>
  `
})
export class AnalyticsComponent {}

const routes: Routes = [
  { path: 'dashboard', component: DashboardComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'analytics', component: AnalyticsComponent },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' }
];

@Component({
  standalone: true,
  selector: 'app-root',
  template: `
    <div class="app-shell">
      <nav class="sidebar">
        <a routerLink="/dashboard">Dashboard</a>
        <a routerLink="/settings">Settings</a>
        <a routerLink="/analytics">Analytics</a>
      </nav>
      <main class="content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class App {
  constructor(
    private pluginManager: PluginManager,
    private themeService: ThemeService,
    private authService: AuthService
  ) {
    this.initializePlugins();
    this.setupGlobalHandlers();
  }

  private initializePlugins(): void {
    const pluginConfigs = [
      {
        name: 'dashboard-widget',
        path: './plugins/dashboard-widget',
        route: '/dashboard'
      },
      {
        name: 'settings-panel',
        path: './plugins/settings-panel',
        route: '/settings'
      },
      {
        name: 'analytics-dashboard',
        path: './plugins/analytics-dashboard',
        route: '/analytics'
      }
    ];

    pluginConfigs.forEach(config => {
      this.pluginManager.register({
        name: config.name,
        loadFn: () => import(config.path).then(m => ({
          PluginManifest: m.PluginManifest
        })),
        config: {
          autoLoad: false,
          timeout: 10000,
          allowedServices: [
            THEME_SERVICE,
            AUTH_SERVICE,
            API_SERVICE,
            Router
          ],
          metadata: {
            route: config.route,
            requiredPermissions: ['read']
          }
        }
      });
    });
  }

  private setupGlobalHandlers(): void {
    this.pluginManager.pluginState$.subscribe(event => {
      if (event?.error) {
        this.handlePluginError(event.pluginName, event.error);
      }
    });
  }

  private handlePluginError(pluginName: string, error: Error): void {
  }
}

bootstrapApplication(App, {
  providers: [
    provideHttpClient(),
    provideRouter(routes),
    { provide: THEME_SERVICE, useClass: ThemeServiceImpl },
    { provide: AUTH_SERVICE, useClass: AuthServiceImpl },
    { provide: API_SERVICE, useClass: ApiServiceImpl },
    providePluginSystem({
      globalTimeout: 15000,
      maxConcurrentLoads: 3,
      enableDevMode: false,
      defaultAllowedServices: [
        THEME_SERVICE,
        AUTH_SERVICE,
        API_SERVICE
      ],
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
