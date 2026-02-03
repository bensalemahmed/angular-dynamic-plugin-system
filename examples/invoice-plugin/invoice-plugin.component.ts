import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PluginLifecycle, PluginContext } from '@angular-dynamic/plugin-system';

@Component({
  selector: 'invoice-plugin',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="invoice-plugin">
      <h2>Invoice Management</h2>
      <p>Plugin loaded at: {{ loadedAt | date:'medium' }}</p>
      <div class="invoice-list">
        <h3>Recent Invoices</h3>
        <ul>
          <li *ngFor="let invoice of invoices">
            {{ invoice.number }} - {{ invoice.amount | currency }} - {{ invoice.status }}
          </li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .invoice-plugin {
      padding: 20px;
      border: 2px solid #007bff;
      border-radius: 8px;
      background: #f8f9fa;
    }

    h2 {
      color: #007bff;
      margin-bottom: 10px;
    }

    .invoice-list {
      margin-top: 20px;
    }

    ul {
      list-style: none;
      padding: 0;
    }

    li {
      padding: 10px;
      margin: 5px 0;
      background: white;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
  `]
})
export class InvoicePluginComponent implements PluginLifecycle {
  loadedAt?: Date;
  invoices = [
    { number: 'INV-001', amount: 1200, status: 'Paid' },
    { number: 'INV-002', amount: 850, status: 'Pending' },
    { number: 'INV-003', amount: 2100, status: 'Overdue' }
  ];

  async onLoad(context: PluginContext): Promise<void> {
    this.loadedAt = new Date();

    context.subscribe('invoice:refresh', () => {
      this.refreshInvoices();
    });
  }

  async onActivate(context: PluginContext): Promise<void> {
    // Called when component is rendered
  }

  async onDeactivate(): Promise<void> {
    // Cleanup before removal
  }

  async onDestroy(): Promise<void> {
    // Final cleanup
  }

  private refreshInvoices(): void {
    // Refresh logic
  }
}

export const PluginManifest = {
  name: 'invoice',
  version: '1.0.0',
  entryComponent: InvoicePluginComponent,
  displayName: 'Invoice Management',
  description: 'Manages invoices and billing',
  author: 'Your Company'
};
