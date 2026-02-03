import {
  Component,
  Input,
  ViewContainerRef,
  OnInit,
  OnDestroy,
  ComponentRef,
  ChangeDetectionStrategy
} from '@angular/core';
import { PluginManager } from '../services/plugin-manager.service';
import { PluginLifecycle } from '../types/lifecycle.types';
import { PluginState } from '../types/plugin.types';

@Component({
  selector: 'plugin-outlet',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PluginOutletComponent implements OnInit, OnDestroy {
  @Input({ required: true }) plugin!: string;

  private componentRef?: ComponentRef<PluginLifecycle>;

  constructor(
    private readonly pluginManager: PluginManager,
    private readonly viewContainer: ViewContainerRef
  ) {}

  async ngOnInit(): Promise<void> {
    if (!this.plugin) {
      return;
    }

    try {
      const state = this.pluginManager.getPluginState(this.plugin);

      if (!state || state === PluginState.REGISTERED) {
        await this.pluginManager.load(this.plugin);
      }

      this.componentRef = await this.pluginManager.createPluginComponent(
        this.plugin,
        this.viewContainer
      );
    } catch (error) {
      // Defensive: plugin load errors are handled by PluginManager
    }
  }

  ngOnDestroy(): void {
    if (this.componentRef) {
      try {
        this.componentRef.destroy();
      } catch {
        // Defensive: ignore component destruction errors
      }
    }
  }
}
