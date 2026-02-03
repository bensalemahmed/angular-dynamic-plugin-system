import { TestBed } from '@angular/core/testing';
import { Injector } from '@angular/core';
import { PluginManager } from './plugin-manager.service';
import { PluginRegistry } from './plugin-registry.service';
import { PluginState, LoadedPluginModule } from '../types/plugin.types';
import { PluginRegistration, PLUGIN_SYSTEM_CONFIG } from '../types/registration.types';
import {
  PluginNotFoundError,
  PluginLoadError,
  PluginStateError
} from '../types/errors.types';
import { PluginLifecycle } from '../types/lifecycle.types';

class MockPluginComponent implements PluginLifecycle {
  onLoadCalled = false;
  onActivateCalled = false;
  onDeactivateCalled = false;
  onDestroyCalled = false;

  async onLoad() {
    this.onLoadCalled = true;
  }

  async onActivate() {
    this.onActivateCalled = true;
  }

  async onDeactivate() {
    this.onDeactivateCalled = true;
  }

  async onDestroy() {
    this.onDestroyCalled = true;
  }
}

describe('PluginManager', () => {
  let manager: PluginManager;
  let registry: PluginRegistry;
  let injector: Injector;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PluginManager,
        PluginRegistry,
        {
          provide: PLUGIN_SYSTEM_CONFIG,
          useValue: {
            globalTimeout: 5000,
            maxConcurrentLoads: 2,
            enableDevMode: true
          }
        }
      ]
    });

    manager = TestBed.inject(PluginManager);
    registry = TestBed.inject(PluginRegistry);
    injector = TestBed.inject(Injector);
  });

  afterEach(() => {
    registry.clear();
  });

  describe('register', () => {
    it('should register a plugin', () => {
      const registration: PluginRegistration = {
        name: 'test-plugin',
        loadFn: async () => ({
          PluginManifest: {
            name: 'test-plugin',
            version: '1.0.0',
            entryComponent: MockPluginComponent
          }
        })
      };

      manager.register(registration);

      expect(manager.getPluginState('test-plugin')).toBe(PluginState.REGISTERED);
    });

    it('should auto-load plugin if configured', async () => {
      const registration: PluginRegistration = {
        name: 'test-plugin',
        loadFn: async () => ({
          PluginManifest: {
            name: 'test-plugin',
            version: '1.0.0',
            entryComponent: MockPluginComponent
          }
        }),
        config: {
          autoLoad: true
        }
      };

      manager.register(registration);

      await new Promise(resolve => setTimeout(resolve, 100));

      const state = manager.getPluginState('test-plugin');
      expect(state).toBe(PluginState.LOADED);
    });
  });

  describe('load', () => {
    it('should load a registered plugin', async () => {
      const registration: PluginRegistration = {
        name: 'test-plugin',
        loadFn: async () => ({
          PluginManifest: {
            name: 'test-plugin',
            version: '1.0.0',
            entryComponent: MockPluginComponent
          }
        })
      };

      manager.register(registration);
      const metadata = await manager.load('test-plugin');

      expect(metadata.state).toBe(PluginState.LOADED);
      expect(metadata.loadedAt).toBeDefined();
      expect(metadata.manifest.name).toBe('test-plugin');
    });

    it('should throw error when loading non-existent plugin', async () => {
      await expectAsync(manager.load('non-existent')).toBeRejectedWithError(
        PluginNotFoundError
      );
    });

    it('should handle concurrent load requests', async () => {
      let loadCount = 0;

      const registration: PluginRegistration = {
        name: 'test-plugin',
        loadFn: async () => {
          loadCount++;
          await new Promise(resolve => setTimeout(resolve, 50));
          return {
            PluginManifest: {
              name: 'test-plugin',
              version: '1.0.0',
              entryComponent: MockPluginComponent
            }
          };
        }
      };

      manager.register(registration);

      const [result1, result2] = await Promise.all([
        manager.load('test-plugin'),
        manager.load('test-plugin')
      ]);

      expect(result1.state).toBe(PluginState.LOADED);
      expect(result2.state).toBe(PluginState.LOADED);
      expect(loadCount).toBe(1);
    });

    it('should handle load errors gracefully', async () => {
      const registration: PluginRegistration = {
        name: 'test-plugin',
        loadFn: async () => {
          throw new Error('Load failed');
        }
      };

      manager.register(registration);

      await expectAsync(manager.load('test-plugin')).toBeRejectedWithError(PluginLoadError);

      expect(manager.getPluginState('test-plugin')).toBe(PluginState.ERROR);
    });

    it('should return already loaded plugin', async () => {
      const registration: PluginRegistration = {
        name: 'test-plugin',
        loadFn: async () => ({
          PluginManifest: {
            name: 'test-plugin',
            version: '1.0.0',
            entryComponent: MockPluginComponent
          }
        })
      };

      manager.register(registration);
      const metadata1 = await manager.load('test-plugin');
      const metadata2 = await manager.load('test-plugin');

      expect(metadata1).toBe(metadata2);
    });
  });

  describe('loadMany', () => {
    it('should load multiple plugins', async () => {
      const registration1: PluginRegistration = {
        name: 'plugin1',
        loadFn: async () => ({
          PluginManifest: {
            name: 'plugin1',
            version: '1.0.0',
            entryComponent: MockPluginComponent
          }
        })
      };

      const registration2: PluginRegistration = {
        name: 'plugin2',
        loadFn: async () => ({
          PluginManifest: {
            name: 'plugin2',
            version: '1.0.0',
            entryComponent: MockPluginComponent
          }
        })
      };

      manager.register(registration1);
      manager.register(registration2);

      const results = await manager.loadMany(['plugin1', 'plugin2']);

      expect(results.length).toBe(2);
      expect(results[0].manifest.name).toBe('plugin1');
      expect(results[1].manifest.name).toBe('plugin2');
    });

    it('should handle partial failures', async () => {
      const registration1: PluginRegistration = {
        name: 'plugin1',
        loadFn: async () => ({
          PluginManifest: {
            name: 'plugin1',
            version: '1.0.0',
            entryComponent: MockPluginComponent
          }
        })
      };

      const registration2: PluginRegistration = {
        name: 'plugin2',
        loadFn: async () => {
          throw new Error('Load failed');
        }
      };

      manager.register(registration1);
      manager.register(registration2);

      const results = await manager.loadMany(['plugin1', 'plugin2']);

      expect(results.length).toBe(1);
      expect(results[0].manifest.name).toBe('plugin1');
    });
  });

  describe('unregister', () => {
    it('should unregister a loaded plugin', async () => {
      const registration: PluginRegistration = {
        name: 'test-plugin',
        loadFn: async () => ({
          PluginManifest: {
            name: 'test-plugin',
            version: '1.0.0',
            entryComponent: MockPluginComponent
          }
        })
      };

      manager.register(registration);
      await manager.load('test-plugin');
      await manager.unregister('test-plugin');

      expect(manager.getPluginState('test-plugin')).toBeUndefined();
    });

    it('should throw error when unregistering non-existent plugin', async () => {
      await expectAsync(manager.unregister('non-existent')).toBeRejectedWithError(
        PluginNotFoundError
      );
    });

    it('should throw error when unregistering loading plugin', async () => {
      const registration: PluginRegistration = {
        name: 'test-plugin',
        loadFn: async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return {
            PluginManifest: {
              name: 'test-plugin',
              version: '1.0.0',
              entryComponent: MockPluginComponent
            }
          };
        }
      };

      manager.register(registration);
      const loadPromise = manager.load('test-plugin');

      await expectAsync(manager.unregister('test-plugin')).toBeRejectedWithError(
        PluginStateError
      );

      await loadPromise;
    });
  });

  describe('isReady', () => {
    it('should return true for loaded plugin', async () => {
      const registration: PluginRegistration = {
        name: 'test-plugin',
        loadFn: async () => ({
          PluginManifest: {
            name: 'test-plugin',
            version: '1.0.0',
            entryComponent: MockPluginComponent
          }
        })
      };

      manager.register(registration);
      await manager.load('test-plugin');

      expect(manager.isReady('test-plugin')).toBe(true);
    });

    it('should return false for registered plugin', () => {
      const registration: PluginRegistration = {
        name: 'test-plugin',
        loadFn: async () => ({
          PluginManifest: {
            name: 'test-plugin',
            version: '1.0.0',
            entryComponent: MockPluginComponent
          }
        })
      };

      manager.register(registration);

      expect(manager.isReady('test-plugin')).toBe(false);
    });

    it('should return false for non-existent plugin', () => {
      expect(manager.isReady('non-existent')).toBe(false);
    });
  });

  describe('getPluginsByState', () => {
    it('should return plugins by state', async () => {
      const registration1: PluginRegistration = {
        name: 'plugin1',
        loadFn: async () => ({
          PluginManifest: {
            name: 'plugin1',
            version: '1.0.0',
            entryComponent: MockPluginComponent
          }
        })
      };

      const registration2: PluginRegistration = {
        name: 'plugin2',
        loadFn: async () => ({
          PluginManifest: {
            name: 'plugin2',
            version: '1.0.0',
            entryComponent: MockPluginComponent
          }
        })
      };

      manager.register(registration1);
      manager.register(registration2);
      await manager.load('plugin1');

      const loaded = manager.getPluginsByState(PluginState.LOADED);
      const registered = manager.getPluginsByState(PluginState.REGISTERED);

      expect(loaded.length).toBe(1);
      expect(loaded[0].manifest.name).toBe('plugin1');
      expect(registered.length).toBe(1);
      expect(registered[0].manifest.name).toBe('plugin2');
    });
  });
});
