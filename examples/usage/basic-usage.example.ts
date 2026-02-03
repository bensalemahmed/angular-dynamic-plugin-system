import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  PluginManager,
  PluginOutletComponent,
  providePluginSystem,
  PluginManifest,
  PluginLifecycle,
  PluginContext
} from 'angular-dynamic-plugin-system';

@Component({
  standalone: true,
  selector: 'my-plugin',
  template: '<h1>Hello from Plugin!</h1>'
})
export class MyPluginComponent implements PluginLifecycle {
  async onLoad(context: PluginContext): Promise<void> {
  }

  async onActivate(context: PluginContext): Promise<void> {
  }
}

export const PluginManifest: PluginManifest = {
  name: 'my-plugin',
  version: '1.0.0',
  entryComponent: MyPluginComponent,
  displayName: 'My First Plugin',
  description: 'A simple example plugin'
};

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [PluginOutletComponent],
  template: '<plugin-outlet plugin="my-plugin"></plugin-outlet>'
})
export class App {
  constructor(private pluginManager: PluginManager) {
    this.pluginManager.register({
      name: 'my-plugin',
      loadFn: () => import('./my-plugin').then(m => ({ PluginManifest: m.PluginManifest }))
    });
  }
}

bootstrapApplication(App, {
  providers: [
    providePluginSystem()
  ]
});
