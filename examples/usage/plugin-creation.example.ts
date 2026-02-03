import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  PluginManifest,
  PluginLifecycle,
  PluginContext,
  PLUGIN_CONTEXT
} from 'angular-dynamic-plugin-system';

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

interface TodoPluginState {
  todos: TodoItem[];
  filter: 'all' | 'active' | 'completed';
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  selector: 'todo-plugin',
  template: `
    <div class="todo-plugin">
      <header class="todo-header">
        <h2>{{ title }}</h2>
        <p class="subtitle">{{ description }}</p>
      </header>

      <div class="todo-input">
        <input
          type="text"
          [(ngModel)]="newTodoText"
          (keyup.enter)="addTodo()"
          placeholder="What needs to be done?"
          class="todo-input-field"
        />
        <button (click)="addTodo()" class="add-button">Add</button>
      </div>

      <div class="todo-filters">
        <button
          [class.active]="filter === 'all'"
          (click)="setFilter('all')"
        >
          All ({{ todos.length }})
        </button>
        <button
          [class.active]="filter === 'active'"
          (click)="setFilter('active')"
        >
          Active ({{ activeCount }})
        </button>
        <button
          [class.active]="filter === 'completed'"
          (click)="setFilter('completed')"
        >
          Completed ({{ completedCount }})
        </button>
      </div>

      <ul class="todo-list">
        <li *ngFor="let todo of filteredTodos" class="todo-item">
          <input
            type="checkbox"
            [checked]="todo.completed"
            (change)="toggleTodo(todo.id)"
            class="todo-checkbox"
          />
          <span [class.completed]="todo.completed" class="todo-text">
            {{ todo.text }}
          </span>
          <button (click)="deleteTodo(todo.id)" class="delete-button">
            Delete
          </button>
        </li>
      </ul>

      <div class="todo-footer" *ngIf="todos.length > 0">
        <span>{{ activeCount }} item(s) left</span>
        <button
          *ngIf="completedCount > 0"
          (click)="clearCompleted()"
          class="clear-button"
        >
          Clear completed
        </button>
      </div>
    </div>
  `,
  styles: [`
    .todo-plugin {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      font-family: system-ui;
    }

    .todo-header {
      text-align: center;
      margin-bottom: 20px;
    }

    .todo-input {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }

    .todo-input-field {
      flex: 1;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .add-button {
      padding: 10px 20px;
      background: #4caf50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .todo-filters {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }

    .todo-filters button {
      padding: 8px 16px;
      background: #f5f5f5;
      border: 1px solid #ddd;
      border-radius: 4px;
      cursor: pointer;
    }

    .todo-filters button.active {
      background: #2196f3;
      color: white;
    }

    .todo-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .todo-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px;
      border-bottom: 1px solid #eee;
    }

    .todo-text {
      flex: 1;
    }

    .todo-text.completed {
      text-decoration: line-through;
      color: #999;
    }

    .delete-button {
      padding: 6px 12px;
      background: #f44336;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .todo-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }

    .clear-button {
      padding: 8px 16px;
      background: #ff9800;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
  `]
})
export class TodoPluginComponent implements PluginLifecycle, OnInit, OnDestroy {
  title = 'Todo Plugin';
  description = 'Manage your tasks efficiently';

  todos: TodoItem[] = [];
  filter: 'all' | 'active' | 'completed' = 'all';
  newTodoText = '';

  private unsubscribe?: () => void;

  constructor(@Inject(PLUGIN_CONTEXT) private context: PluginContext) {}

  async onLoad(context: PluginContext): Promise<void> {
    await this.loadPersistedState();

    this.setupEventListeners();
  }

  async onActivate(context: PluginContext): Promise<void> {
    this.context.emit('plugin:activated', {
      pluginName: this.context.pluginName,
      todoCount: this.todos.length
    });
  }

  async onDeactivate(): Promise<void> {
    await this.persistState();

    this.context.emit('plugin:deactivated', {
      pluginName: this.context.pluginName
    });
  }

  async onDestroy(): Promise<void> {
    await this.persistState();

    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
  }

  get filteredTodos(): TodoItem[] {
    switch (this.filter) {
      case 'active':
        return this.todos.filter(t => !t.completed);
      case 'completed':
        return this.todos.filter(t => t.completed);
      default:
        return this.todos;
    }
  }

  get activeCount(): number {
    return this.todos.filter(t => !t.completed).length;
  }

  get completedCount(): number {
    return this.todos.filter(t => t.completed).length;
  }

  addTodo(): void {
    if (!this.newTodoText.trim()) {
      return;
    }

    const todo: TodoItem = {
      id: crypto.randomUUID(),
      text: this.newTodoText.trim(),
      completed: false,
      createdAt: new Date()
    };

    this.todos.unshift(todo);
    this.newTodoText = '';

    this.context.emit('todo:added', { todo });
    this.persistState();
  }

  toggleTodo(id: string): void {
    const todo = this.todos.find(t => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
      this.context.emit('todo:toggled', { todo });
      this.persistState();
    }
  }

  deleteTodo(id: string): void {
    const index = this.todos.findIndex(t => t.id === id);
    if (index !== -1) {
      const [deleted] = this.todos.splice(index, 1);
      this.context.emit('todo:deleted', { todo: deleted });
      this.persistState();
    }
  }

  setFilter(filter: 'all' | 'active' | 'completed'): void {
    this.filter = filter;
    this.context.emit('filter:changed', { filter });
  }

  clearCompleted(): void {
    const completedCount = this.completedCount;
    this.todos = this.todos.filter(t => !t.completed);
    this.context.emit('todos:cleared', { count: completedCount });
    this.persistState();
  }

  private setupEventListeners(): void {
    this.unsubscribe = this.context.subscribe('todos:clear-all', () => {
      this.todos = [];
      this.persistState();
    });
  }

  private async loadPersistedState(): Promise<void> {
    try {
      const key = `plugin:${this.context.pluginName}:state`;
      const stored = localStorage.getItem(key);

      if (stored) {
        const state: TodoPluginState = JSON.parse(stored);
        this.todos = state.todos.map(t => ({
          ...t,
          createdAt: new Date(t.createdAt)
        }));
        this.filter = state.filter;
      }
    } catch (error) {
    }
  }

  private async persistState(): Promise<void> {
    try {
      const key = `plugin:${this.context.pluginName}:state`;
      const state: TodoPluginState = {
        todos: this.todos,
        filter: this.filter
      };
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
    }
  }
}

export const PluginManifest: PluginManifest = {
  name: 'todo-plugin',
  version: '1.0.0',
  entryComponent: TodoPluginComponent,
  displayName: 'Todo Manager',
  description: 'A feature-rich todo list plugin with persistence',
  author: 'Your Name',
  dependencies: {
    '@angular/core': '^16.0.0',
    '@angular/common': '^16.0.0',
    '@angular/forms': '^16.0.0'
  }
};
