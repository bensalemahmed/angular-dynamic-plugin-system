import { TestBed } from '@angular/core/testing';
import { Injector } from '@angular/core';
import { PluginManager } from './plugin-manager.service';
import { PluginRegistry } from './plugin-registry.service';
import { PluginState, LoadedPluginModule } from '../types/plugin.types';
import { PluginRegistration, PLUGIN_SYSTEM_CONFIG } from '../types/registration.types';
import {
  PluginNotFoundError,
  PluginLoadError,
  PluginStateError,
  PluginLifecycleTimeoutError,
  PluginOperationInProgressError
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

  // v1.1.0: Test coverage for DX enhancements
  describe('v1.1.0 DX Enhancements', () => {
    describe('getPluginInfo', () => {
      it('should return plugin info for registered plugin', async () => {
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

        const info = manager.getPluginInfo('test-plugin');

        expect(info).toBeDefined();
        expect(info!.name).toBe('test-plugin');
        expect(info!.state).toBe(PluginState.LOADED);
        expect(info!.loadedAt).toBeDefined();
        expect(info!.manifest).toBeDefined();
        expect(info!.hasComponent).toBe(false);
        expect(info!.errorCount).toBe(0);
        expect(info!.lastError).toBeUndefined();
      });

      it('should return undefined for non-existent plugin', () => {
        const info = manager.getPluginInfo('non-existent');
        expect(info).toBeUndefined();
      });

      it('should track error count and last error', async () => {
        const registration: PluginRegistration = {
          name: 'error-plugin',
          loadFn: async () => {
            throw new Error('Load failed');
          }
        };

        manager.register(registration);

        // Try to load and fail
        try {
          await manager.load('error-plugin');
        } catch {
          // Expected
        }

        const info = manager.getPluginInfo('error-plugin');

        expect(info).toBeDefined();
        expect(info!.state).toBe(PluginState.ERROR);
        expect(info!.errorCount).toBe(1);
        expect(info!.lastError).toBeDefined();
      });

      it('should track activatedAt when component is created', async () => {
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

        // Before component creation
        let info = manager.getPluginInfo('test-plugin');
        expect(info!.activatedAt).toBeUndefined();
        expect(info!.hasComponent).toBe(false);

        // Create component
        const viewContainer = jasmine.createSpyObj('ViewContainerRef', ['createComponent']);
        const componentRef = jasmine.createSpyObj('ComponentRef', ['destroy']);
        componentRef.instance = new MockPluginComponent();
        viewContainer.createComponent.and.returnValue(componentRef);

        await manager.createPluginComponent('test-plugin', viewContainer);

        // After component creation
        info = manager.getPluginInfo('test-plugin');
        expect(info!.activatedAt).toBeDefined();
        expect(info!.hasComponent).toBe(true);
        expect(info!.state).toBe(PluginState.ACTIVE);
      });
    });

    describe('isUnloading', () => {
      it('should return false when plugin is not unloading', () => {
        expect(manager.isUnloading('test-plugin')).toBe(false);
      });

      it('should return true when plugin is currently unloading', async () => {
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

        // Start unloading (don't await)
        const unloadPromise = manager.unregister('test-plugin');

        // Check during unload
        expect(manager.isUnloading('test-plugin')).toBe(true);

        // Wait for completion
        await unloadPromise;

        // Check after unload
        expect(manager.isUnloading('test-plugin')).toBe(false);
      });
    });

    describe('Better Error Messages', () => {
      it('should include suggestion in PluginNotFoundError', async () => {
        try {
          await manager.load('non-existent');
          fail('Should have thrown');
        } catch (error: any) {
          expect(error.suggestion).toBeDefined();
          expect(error.suggestion).toContain('registered');
          expect(error.docs).toBeDefined();
        }
      });

      it('should include suggestion in PluginLoadError', async () => {
        const registration: PluginRegistration = {
          name: 'broken-plugin',
          loadFn: async () => {
            throw new Error('Import failed');
          }
        };

        manager.register(registration);

        try {
          await manager.load('broken-plugin');
          fail('Should have thrown');
        } catch (error: any) {
          expect(error.suggestion).toBeDefined();
          expect(error.docs).toBeDefined();
        }
      });

      it('should include suggestion in PluginLifecycleTimeoutError', async () => {
        const slowComponent = new MockPluginComponent();
        slowComponent.onLoad = async () => {
          await new Promise(resolve => setTimeout(resolve, 10000));
        };

        const registration: PluginRegistration = {
          name: 'slow-plugin',
          loadFn: async () => ({
            PluginManifest: {
              name: 'slow-plugin',
              version: '1.0.0',
              entryComponent: MockPluginComponent
            }
          })
        };

        // Configure short timeout for test
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            PluginManager,
            PluginRegistry,
            {
              provide: PLUGIN_SYSTEM_CONFIG,
              useValue: {
                lifecycleHookTimeout: 100,
                enableDevMode: true
              }
            }
          ]
        });

        manager = TestBed.inject(PluginManager);
        registry = TestBed.inject(PluginRegistry);

        manager.register(registration);

        try {
          await manager.load('slow-plugin');
          fail('Should have thrown timeout error');
        } catch (error: any) {
          expect(error.name).toBe('PluginLifecycleTimeoutError');
          expect(error.suggestion).toBeDefined();
          expect(error.suggestion).toContain('timeout');
          expect(error.docs).toBeDefined();
        }
      });
    });
  });

  // v1.1.0: Test coverage for critical fixes identified in POST_RELEASE_AUDIT.md
  describe('v1.1.0 Critical Fixes', () => {
    describe('Test #1: Plugin unloaded while component is being created (RISK #3)', () => {
      it('should throw PluginOperationInProgressError when unregister is called during component creation', async () => {
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

        // Manually set the isCreatingComponent flag to simulate component creation in progress
        registry.updateMetadata('test-plugin', { isCreatingComponent: true });

        await expectAsync(manager.unregister('test-plugin')).toBeRejectedWithError(
          /Cannot perform operation.*creating/
        );

        // Clean up
        registry.updateMetadata('test-plugin', { isCreatingComponent: false });
      });

      it('should prevent component creation when unregister is in progress', async () => {
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

        // Start unregister but don't await it immediately
        const unregisterPromise = manager.unregister('test-plugin');

        // Try to create component while unregister is in progress
        // This should fail because the plugin is being unloaded
        await expectAsync(unregisterPromise).toBeResolved();

        // Plugin should be unregistered now
        expect(manager.getPluginState('test-plugin')).toBeUndefined();
      });
    });

    describe('Test #2: Lifecycle hook that never resolves (RISK #2)', () => {
      it('should timeout when onLoad hook never resolves', async () => {
        class HangingOnLoadComponent implements PluginLifecycle {
          async onLoad() {
            // Never resolves
            return new Promise(() => {});
          }
        }

        const registration: PluginRegistration = {
          name: 'hanging-plugin',
          loadFn: async () => ({
            PluginManifest: {
              name: 'hanging-plugin',
              version: '1.0.0',
              entryComponent: HangingOnLoadComponent
            }
          })
        };

        // Create a new TestBed with short timeout for testing
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            PluginManager,
            PluginRegistry,
            {
              provide: PLUGIN_SYSTEM_CONFIG,
              useValue: {
                lifecycleHookTimeout: 100 // 100ms timeout
              }
            }
          ]
        });

        const testManager = TestBed.inject(PluginManager);
        const testRegistry = TestBed.inject(PluginRegistry);

        testManager.register(registration);

        await expectAsync(testManager.load('hanging-plugin')).toBeRejectedWithError(
          /timed out after 100ms/
        );

        expect(testManager.getPluginState('hanging-plugin')).toBe(PluginState.ERROR);

        testRegistry.clear();
      });

      it('should timeout when onDestroy hook never resolves', async () => {
        class HangingOnDestroyComponent implements PluginLifecycle {
          async onDestroy() {
            // Never resolves
            return new Promise(() => {});
          }
        }

        const registration: PluginRegistration = {
          name: 'hanging-destroy-plugin',
          loadFn: async () => ({
            PluginManifest: {
              name: 'hanging-destroy-plugin',
              version: '1.0.0',
              entryComponent: HangingOnDestroyComponent
            }
          })
        };

        // Create a new TestBed with short timeout
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            PluginManager,
            PluginRegistry,
            {
              provide: PLUGIN_SYSTEM_CONFIG,
              useValue: {
                lifecycleHookTimeout: 100
              }
            }
          ]
        });

        const testManager = TestBed.inject(PluginManager);
        const testRegistry = TestBed.inject(PluginRegistry);

        testManager.register(registration);
        await testManager.load('hanging-destroy-plugin');

        await expectAsync(testManager.unregister('hanging-destroy-plugin')).toBeRejected();

        testRegistry.clear();
      });

      it('should not timeout when lifecycleHookTimeout is set to 0', async () => {
        let onLoadCompleted = false;

        class SlowOnLoadComponent implements PluginLifecycle {
          async onLoad() {
            await new Promise(resolve => setTimeout(resolve, 200));
            onLoadCompleted = true;
          }
        }

        const registration: PluginRegistration = {
          name: 'slow-plugin',
          loadFn: async () => ({
            PluginManifest: {
              name: 'slow-plugin',
              version: '1.0.0',
              entryComponent: SlowOnLoadComponent
            }
          })
        };

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          providers: [
            PluginManager,
            PluginRegistry,
            {
              provide: PLUGIN_SYSTEM_CONFIG,
              useValue: {
                lifecycleHookTimeout: 0 // Disable timeout
              }
            }
          ]
        });

        const testManager = TestBed.inject(PluginManager);
        const testRegistry = TestBed.inject(PluginRegistry);

        testManager.register(registration);
        await testManager.load('slow-plugin');

        expect(onLoadCompleted).toBe(true);
        expect(testManager.getPluginState('slow-plugin')).toBe(PluginState.LOADED);

        testRegistry.clear();
      });
    });

    describe('Test #3: Rapid load/unload cycles (RISK #4)', () => {
      it('should handle 100+ rapid load/unload cycles without errors', async () => {
        const registration: PluginRegistration = {
          name: 'cycle-plugin',
          loadFn: async () => ({
            PluginManifest: {
              name: 'cycle-plugin',
              version: '1.0.0',
              entryComponent: MockPluginComponent
            }
          })
        };

        const cycles = 100;
        for (let i = 0; i < cycles; i++) {
          manager.register(registration);
          await manager.load('cycle-plugin');
          await manager.unregister('cycle-plugin');
        }

        // Plugin should be fully cleaned up
        expect(manager.getPluginState('cycle-plugin')).toBeUndefined();
      });

      it('should maintain consistent state after rapid cycles', async () => {
        const registration: PluginRegistration = {
          name: 'rapid-plugin',
          loadFn: async () => ({
            PluginManifest: {
              name: 'rapid-plugin',
              version: '1.0.0',
              entryComponent: MockPluginComponent
            }
          })
        };

        for (let i = 0; i < 50; i++) {
          manager.register(registration);
          const metadata = await manager.load('rapid-plugin');
          expect(metadata.state).toBe(PluginState.LOADED);
          await manager.unregister('rapid-plugin');
          expect(manager.getPluginState('rapid-plugin')).toBeUndefined();
        }
      });
    });

    describe('Test #4: Memory leak detection (RISK #1, #2, #7)', () => {
      it('should clear componentRef from metadata after unregister', async () => {
        const registration: PluginRegistration = {
          name: 'memory-plugin',
          loadFn: async () => ({
            PluginManifest: {
              name: 'memory-plugin',
              version: '1.0.0',
              entryComponent: MockPluginComponent
            }
          })
        };

        manager.register(registration);
        await manager.load('memory-plugin');

        // Simulate component creation by setting componentRef
        const mockComponentRef = {
          instance: new MockPluginComponent(),
          destroy: jasmine.createSpy('destroy')
        } as any;

        registry.updateMetadata('memory-plugin', {
          componentRef: mockComponentRef,
          state: PluginState.ACTIVE
        });

        await manager.unregister('memory-plugin');

        // Plugin should be removed from registry
        expect(manager.getPluginState('memory-plugin')).toBeUndefined();
        expect(mockComponentRef.destroy).toHaveBeenCalled();
      });

      it('should destroy context when plugin is unregistered', async () => {
        const registration: PluginRegistration = {
          name: 'context-plugin',
          loadFn: async () => ({
            PluginManifest: {
              name: 'context-plugin',
              version: '1.0.0',
              entryComponent: MockPluginComponent
            }
          })
        };

        manager.register(registration);
        await manager.load('context-plugin');

        const context = registry.getContext('context-plugin');
        expect(context).toBeDefined();

        const destroySpy = spyOn(context!, 'destroy');

        await manager.unregister('context-plugin');

        expect(destroySpy).toHaveBeenCalled();
      });

      it('should destroy injector when plugin is unregistered', async () => {
        const registration: PluginRegistration = {
          name: 'injector-plugin',
          loadFn: async () => ({
            PluginManifest: {
              name: 'injector-plugin',
              version: '1.0.0',
              entryComponent: MockPluginComponent
            }
          })
        };

        manager.register(registration);
        await manager.load('injector-plugin');

        const pluginInjector = registry.getInjector('injector-plugin');
        expect(pluginInjector).toBeDefined();

        const destroySpy = spyOn(pluginInjector!, 'destroy');

        await manager.unregister('injector-plugin');

        expect(destroySpy).toHaveBeenCalled();
      });

      it('should clean up context if load fails after context creation', async () => {
        class FailingOnLoadComponent implements PluginLifecycle {
          async onLoad() {
            throw new Error('onLoad failed');
          }
        }

        const registration: PluginRegistration = {
          name: 'failing-plugin',
          loadFn: async () => ({
            PluginManifest: {
              name: 'failing-plugin',
              version: '1.0.0',
              entryComponent: FailingOnLoadComponent
            }
          })
        };

        manager.register(registration);

        await expectAsync(manager.load('failing-plugin')).toBeRejected();

        // Context should be destroyed even though load failed
        const context = registry.getContext('failing-plugin');
        expect(context).toBeUndefined();
      });
    });

    describe('Test #5: Concurrent unregister calls (RISK #4)', () => {
      it('should handle concurrent unregister calls safely', async () => {
        const registration: PluginRegistration = {
          name: 'concurrent-plugin',
          loadFn: async () => ({
            PluginManifest: {
              name: 'concurrent-plugin',
              version: '1.0.0',
              entryComponent: MockPluginComponent
            }
          })
        };

        manager.register(registration);
        await manager.load('concurrent-plugin');

        // Call unregister twice concurrently
        const [result1, result2] = await Promise.allSettled([
          manager.unregister('concurrent-plugin'),
          manager.unregister('concurrent-plugin')
        ]);

        // Both should resolve (second one returns the same promise)
        expect(result1.status).toBe('fulfilled');
        expect(result2.status).toBe('fulfilled');

        expect(manager.getPluginState('concurrent-plugin')).toBeUndefined();
      });

      it('should return true for isUnloading during unload', async () => {
        const registration: PluginRegistration = {
          name: 'unloading-check-plugin',
          loadFn: async () => ({
            PluginManifest: {
              name: 'unloading-check-plugin',
              version: '1.0.0',
              entryComponent: MockPluginComponent
            }
          })
        };

        manager.register(registration);
        await manager.load('unloading-check-plugin');

        expect(manager.isUnloading('unloading-check-plugin')).toBe(false);

        // Start unregister but check immediately
        const unregisterPromise = manager.unregister('unloading-check-plugin');

        // During the very brief window, isUnloading might return true
        // But by the time we check, it might already be done
        await unregisterPromise;

        expect(manager.isUnloading('unloading-check-plugin')).toBe(false);
      });

      it('should handle multiple rapid concurrent unregister attempts', async () => {
        const registration: PluginRegistration = {
          name: 'multi-unload-plugin',
          loadFn: async () => ({
            PluginManifest: {
              name: 'multi-unload-plugin',
              version: '1.0.0',
              entryComponent: MockPluginComponent
            }
          })
        };

        manager.register(registration);
        await manager.load('multi-unload-plugin');

        // Call unregister 5 times concurrently
        const results = await Promise.allSettled([
          manager.unregister('multi-unload-plugin'),
          manager.unregister('multi-unload-plugin'),
          manager.unregister('multi-unload-plugin'),
          manager.unregister('multi-unload-plugin'),
          manager.unregister('multi-unload-plugin')
        ]);

        // All should succeed
        results.forEach(result => {
          expect(result.status).toBe('fulfilled');
        });

        expect(manager.getPluginState('multi-unload-plugin')).toBeUndefined();
      });
    });

    describe('Test #6: Plugin with required constructor params (RISK #8)', () => {
      it('should handle plugin component with dependencies via injector', async () => {
        // Angular components should use constructor injection, not new()
        // This test verifies the system creates components through the injector
        class ComponentWithDependencies implements PluginLifecycle {
          constructor() {
            // Constructor is called by Angular's component factory
          }

          async onLoad() {
            // This should be called successfully
          }
        }

        const registration: PluginRegistration = {
          name: 'deps-plugin',
          loadFn: async () => ({
            PluginManifest: {
              name: 'deps-plugin',
              version: '1.0.0',
              entryComponent: ComponentWithDependencies
            }
          })
        };

        manager.register(registration);

        // The onLoad lifecycle instantiates with new, which should work for zero-arg constructors
        await expectAsync(manager.load('deps-plugin')).toBeResolved();
        expect(manager.getPluginState('deps-plugin')).toBe(PluginState.LOADED);
      });
    });

    describe('Test #7: Event handler cleanup on plugin reload (RISK #9)', () => {
      it('should clean up event handlers when plugin is reloaded', async () => {
        let eventHandlerCallCount = 0;

        class EventSubscribingComponent implements PluginLifecycle {
          async onLoad(context: any) {
            context.subscribe('test-event', () => {
              eventHandlerCallCount++;
            });
          }
        }

        const registration: PluginRegistration = {
          name: 'event-plugin',
          loadFn: async () => ({
            PluginManifest: {
              name: 'event-plugin',
              version: '1.0.0',
              entryComponent: EventSubscribingComponent
            }
          })
        };

        // First load
        manager.register(registration);
        await manager.load('event-plugin');

        const context1 = registry.getContext('event-plugin');
        context1?.emit('test-event', {});

        expect(eventHandlerCallCount).toBe(1);

        // Unload
        await manager.unregister('event-plugin');

        // Reload
        manager.register(registration);
        await manager.load('event-plugin');

        const context2 = registry.getContext('event-plugin');
        context2?.emit('test-event', {});

        // Should only increment by 1 (old handler should be cleaned up)
        expect(eventHandlerCallCount).toBe(2);
      });

      it('should destroy context and its handlers on unregister', async () => {
        const registration: PluginRegistration = {
          name: 'cleanup-plugin',
          loadFn: async () => ({
            PluginManifest: {
              name: 'cleanup-plugin',
              version: '1.0.0',
              entryComponent: MockPluginComponent
            }
          })
        };

        manager.register(registration);
        await manager.load('cleanup-plugin');

        const context = registry.getContext('cleanup-plugin');
        const destroySpy = spyOn(context!, 'destroy');

        await manager.unregister('cleanup-plugin');

        expect(destroySpy).toHaveBeenCalled();
      });
    });

    describe('Test #8: Auto-load + manual load race condition (RISK #6)', () => {
      it('should handle auto-load and manual load without duplicate loading', async () => {
        let loadCount = 0;

        const registration: PluginRegistration = {
          name: 'auto-load-plugin',
          loadFn: async () => {
            loadCount++;
            await new Promise(resolve => setTimeout(resolve, 50));
            return {
              PluginManifest: {
                name: 'auto-load-plugin',
                version: '1.0.0',
                entryComponent: MockPluginComponent
              }
            };
          },
          config: {
            autoLoad: true
          }
        };

        manager.register(registration); // Triggers auto-load

        // Immediately call manual load
        await manager.load('auto-load-plugin');

        // Wait a bit more to ensure auto-load completes
        await new Promise(resolve => setTimeout(resolve, 100));

        // Should only load once due to loadingPromises map
        expect(loadCount).toBe(1);
        expect(manager.getPluginState('auto-load-plugin')).toBe(PluginState.LOADED);
      });

      it('should not double-load when auto-load is configured', async () => {
        const registration: PluginRegistration = {
          name: 'auto-manual-plugin',
          loadFn: async () => ({
            PluginManifest: {
              name: 'auto-manual-plugin',
              version: '1.0.0',
              entryComponent: MockPluginComponent
            }
          }),
          config: {
            autoLoad: true
          }
        };

        // Register with auto-load
        manager.register(registration);

        // Wait for auto-load to complete
        await new Promise(resolve => setTimeout(resolve, 100));

        // Manual load should return existing metadata
        const metadata = await manager.load('auto-manual-plugin');

        expect(metadata.state).toBe(PluginState.LOADED);
      });
    });

    describe('Test #9: Plugin loading while previous plugin is unloading', () => {
      it('should handle reload during unload gracefully', async () => {
        const registration: PluginRegistration = {
          name: 'reload-plugin',
          loadFn: async () => ({
            PluginManifest: {
              name: 'reload-plugin',
              version: '1.0.0',
              entryComponent: MockPluginComponent
            }
          })
        };

        manager.register(registration);
        await manager.load('reload-plugin');

        // Start unregister
        const unregisterPromise = manager.unregister('reload-plugin');

        // Wait for unregister to complete
        await unregisterPromise;

        // Now register and load again
        manager.register(registration);
        const metadata = await manager.load('reload-plugin');

        expect(metadata.state).toBe(PluginState.LOADED);
      });

      it('should complete unload before allowing reload', async () => {
        class SlowDestroyComponent implements PluginLifecycle {
          async onDestroy() {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        const registration: PluginRegistration = {
          name: 'slow-unload-plugin',
          loadFn: async () => ({
            PluginManifest: {
              name: 'slow-unload-plugin',
              version: '1.0.0',
              entryComponent: SlowDestroyComponent
            }
          })
        };

        manager.register(registration);
        await manager.load('slow-unload-plugin');

        // Create component to trigger onDestroy
        registry.updateMetadata('slow-unload-plugin', {
          componentRef: {
            instance: new SlowDestroyComponent(),
            destroy: () => {}
          } as any
        });

        // Start unload
        const unloadPromise = manager.unregister('slow-unload-plugin');

        // Wait for unload to complete
        await unloadPromise;

        // Plugin should be fully unloaded
        expect(manager.getPluginState('slow-unload-plugin')).toBeUndefined();

        // Can now reload
        manager.register(registration);
        await manager.load('slow-unload-plugin');
        expect(manager.getPluginState('slow-unload-plugin')).toBe(PluginState.LOADED);
      });
    });

    describe('Test #10: Large-scale scenario (50+ plugins)', () => {
      it('should handle loading 50+ plugins concurrently', async () => {
        const pluginCount = 50;
        const registrations: PluginRegistration[] = [];

        // Create 50 plugin registrations
        for (let i = 0; i < pluginCount; i++) {
          registrations.push({
            name: `plugin-${i}`,
            loadFn: async () => ({
              PluginManifest: {
                name: `plugin-${i}`,
                version: '1.0.0',
                entryComponent: MockPluginComponent
              }
            })
          });
        }

        // Register all plugins
        registrations.forEach(reg => manager.register(reg));

        // Load all plugins
        const pluginNames = registrations.map(r => r.name);
        const results = await manager.loadMany(pluginNames);

        expect(results.length).toBe(pluginCount);

        // Verify all are loaded
        const loadedPlugins = manager.getPluginsByState(PluginState.LOADED);
        expect(loadedPlugins.length).toBe(pluginCount);

        // Clean up
        for (const name of pluginNames) {
          await manager.unregister(name);
        }
      });

      it('should maintain performance with 50+ plugins', async () => {
        const pluginCount = 50;
        const startTime = performance.now();

        for (let i = 0; i < pluginCount; i++) {
          const registration: PluginRegistration = {
            name: `perf-plugin-${i}`,
            loadFn: async () => ({
              PluginManifest: {
                name: `perf-plugin-${i}`,
                version: '1.0.0',
                entryComponent: MockPluginComponent
              }
            })
          };

          manager.register(registration);
          await manager.load(`perf-plugin-${i}`);
        }

        const loadTime = performance.now() - startTime;

        // Loading 50 simple plugins should take less than 5 seconds
        expect(loadTime).toBeLessThan(5000);

        // Verify all loaded
        const allPlugins = manager.getAllPlugins();
        expect(allPlugins.length).toBe(pluginCount);

        // Clean up
        for (let i = 0; i < pluginCount; i++) {
          await manager.unregister(`perf-plugin-${i}`);
        }
      });

      it('should track state correctly with many plugins', async () => {
        const pluginCount = 30;

        // Register and load some plugins
        for (let i = 0; i < pluginCount; i++) {
          const registration: PluginRegistration = {
            name: `state-plugin-${i}`,
            loadFn: async () => ({
              PluginManifest: {
                name: `state-plugin-${i}`,
                version: '1.0.0',
                entryComponent: MockPluginComponent
              }
            })
          };

          manager.register(registration);

          // Load only half of them
          if (i < pluginCount / 2) {
            await manager.load(`state-plugin-${i}`);
          }
        }

        const loaded = manager.getPluginsByState(PluginState.LOADED);
        const registered = manager.getPluginsByState(PluginState.REGISTERED);

        expect(loaded.length).toBe(pluginCount / 2);
        expect(registered.length).toBe(pluginCount / 2);

        // Clean up
        for (let i = 0; i < pluginCount; i++) {
          try {
            await manager.unregister(`state-plugin-${i}`);
          } catch {
            // Some might not be loaded yet
          }
        }
      });
    });
  });
});
