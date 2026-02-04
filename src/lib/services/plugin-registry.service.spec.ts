import { TestBed } from '@angular/core/testing';
import { PluginRegistry } from './plugin-registry.service';
import { PluginState } from '../types/plugin.types';
import { PluginRegistration } from '../types/registration.types';
import {
  PluginAlreadyRegisteredError,
  PluginNotFoundError
} from '../types/errors.types';

describe('PluginRegistry', () => {
  let registry: PluginRegistry;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PluginRegistry]
    });
    registry = TestBed.inject(PluginRegistry);
  });

  afterEach(() => {
    registry.clear();
  });

  describe('register', () => {
    it('should register a new plugin', () => {
      const registration: PluginRegistration = {
        name: 'test-plugin',
        loadFn: async () => ({
          PluginManifest: {
            name: 'test-plugin',
            version: '1.0.0',
            entryComponent: class {} as any
          }
        })
      };

      registry.register(registration);

      expect(registry.has('test-plugin')).toBe(true);
      const metadata = registry.getMetadata('test-plugin');
      expect(metadata?.state).toBe(PluginState.REGISTERED);
    });

    it('should throw error when registering duplicate plugin', () => {
      const registration: PluginRegistration = {
        name: 'test-plugin',
        loadFn: async () => ({
          PluginManifest: {
            name: 'test-plugin',
            version: '1.0.0',
            entryComponent: class {} as any
          }
        })
      };

      registry.register(registration);

      expect(() => registry.register(registration)).toThrow(PluginAlreadyRegisteredError);
    });
  });

  describe('unregister', () => {
    it('should unregister an existing plugin', () => {
      const registration: PluginRegistration = {
        name: 'test-plugin',
        loadFn: async () => ({
          PluginManifest: {
            name: 'test-plugin',
            version: '1.0.0',
            entryComponent: class {} as any
          }
        })
      };

      registry.register(registration);
      registry.unregister('test-plugin');

      expect(registry.has('test-plugin')).toBe(false);
    });

    it('should throw error when unregistering non-existent plugin', () => {
      expect(() => registry.unregister('non-existent')).toThrow(PluginNotFoundError);
    });
  });

  describe('updateMetadata', () => {
    it('should update plugin metadata', () => {
      const registration: PluginRegistration = {
        name: 'test-plugin',
        loadFn: async () => ({
          PluginManifest: {
            name: 'test-plugin',
            version: '1.0.0',
            entryComponent: class {} as any
          }
        })
      };

      registry.register(registration);
      registry.updateMetadata('test-plugin', { state: PluginState.LOADING });

      const metadata = registry.getMetadata('test-plugin');
      expect(metadata?.state).toBe(PluginState.LOADING);
    });

    it('should throw error when updating non-existent plugin', () => {
      expect(() => {
        registry.updateMetadata('non-existent', { state: PluginState.LOADED });
      }).toThrow(PluginNotFoundError);
    });
  });

  describe('getPluginsByState', () => {
    it('should return plugins filtered by state', () => {
      const registration1: PluginRegistration = {
        name: 'plugin1',
        loadFn: async () => ({
          PluginManifest: {
            name: 'plugin1',
            version: '1.0.0',
            entryComponent: class {} as any
          }
        })
      };

      const registration2: PluginRegistration = {
        name: 'plugin2',
        loadFn: async () => ({
          PluginManifest: {
            name: 'plugin2',
            version: '1.0.0',
            entryComponent: class {} as any
          }
        })
      };

      registry.register(registration1);
      registry.register(registration2);
      registry.updateMetadata('plugin1', { state: PluginState.LOADED });

      const loadedPlugins = registry.getPluginsByState(PluginState.LOADED);
      const registeredPlugins = registry.getPluginsByState(PluginState.REGISTERED);

      expect(loadedPlugins.length).toBe(1);
      expect(loadedPlugins[0].manifest.name).toBe('plugin1');
      expect(registeredPlugins.length).toBe(1);
      expect(registeredPlugins[0].manifest.name).toBe('plugin2');
    });
  });

  describe('state$', () => {
    it('should emit state changes', (done) => {
      const registration: PluginRegistration = {
        name: 'test-plugin',
        loadFn: async () => ({
          PluginManifest: {
            name: 'test-plugin',
            version: '1.0.0',
            entryComponent: class {} as any
          }
        })
      };

      let emissionCount = 0;

      registry.state$.subscribe(event => {
        if (event) {
          emissionCount++;

          if (emissionCount === 1) {
            expect(event.pluginName).toBe('test-plugin');
            expect(event.state).toBe(PluginState.REGISTERED);
          } else if (emissionCount === 2) {
            expect(event.pluginName).toBe('test-plugin');
            expect(event.state).toBe(PluginState.LOADING);
            done();
          }
        }
      });

      registry.register(registration);
      registry.updateMetadata('test-plugin', { state: PluginState.LOADING });
    });
  });

  describe('clear', () => {
    it('should clear all plugins', () => {
      const registration1: PluginRegistration = {
        name: 'plugin1',
        loadFn: async () => ({
          PluginManifest: {
            name: 'plugin1',
            version: '1.0.0',
            entryComponent: class {} as any
          }
        })
      };

      const registration2: PluginRegistration = {
        name: 'plugin2',
        loadFn: async () => ({
          PluginManifest: {
            name: 'plugin2',
            version: '1.0.0',
            entryComponent: class {} as any
          }
        })
      };

      registry.register(registration1);
      registry.register(registration2);
      registry.clear();

      expect(registry.getAllMetadata().length).toBe(0);
      expect(registry.has('plugin1')).toBe(false);
      expect(registry.has('plugin2')).toBe(false);
    });
  });

  // v1.1.0: Additional test coverage for registry operations
  describe('v1.1.0 Registry Operations', () => {
    describe('Context management', () => {
      it('should set and get plugin context', () => {
        const registration: PluginRegistration = {
          name: 'context-test',
          loadFn: async () => ({
            PluginManifest: {
              name: 'context-test',
              version: '1.0.0',
              entryComponent: class {} as any
            }
          })
        };

        registry.register(registration);

        const mockContext = {
          pluginName: 'context-test',
          destroy: jasmine.createSpy('destroy')
        } as any;

        registry.setContext('context-test', mockContext);

        const retrievedContext = registry.getContext('context-test');
        expect(retrievedContext).toBe(mockContext);
      });

      it('should destroy context when plugin is unregistered', () => {
        const registration: PluginRegistration = {
          name: 'context-destroy-test',
          loadFn: async () => ({
            PluginManifest: {
              name: 'context-destroy-test',
              version: '1.0.0',
              entryComponent: class {} as any
            }
          })
        };

        registry.register(registration);

        const mockContext = {
          pluginName: 'context-destroy-test',
          destroy: jasmine.createSpy('destroy')
        } as any;

        registry.setContext('context-destroy-test', mockContext);
        registry.unregister('context-destroy-test');

        expect(mockContext.destroy).toHaveBeenCalled();
      });

      it('should destroy all contexts when clearing registry', () => {
        const contexts: any[] = [];

        for (let i = 0; i < 3; i++) {
          const registration: PluginRegistration = {
            name: `clear-test-${i}`,
            loadFn: async () => ({
              PluginManifest: {
                name: `clear-test-${i}`,
                version: '1.0.0',
                entryComponent: class {} as any
              }
            })
          };

          registry.register(registration);

          const mockContext = {
            pluginName: `clear-test-${i}`,
            destroy: jasmine.createSpy('destroy')
          };

          contexts.push(mockContext);
          registry.setContext(`clear-test-${i}`, mockContext as any);
        }

        registry.clear();

        contexts.forEach(ctx => {
          expect(ctx.destroy).toHaveBeenCalled();
        });
      });
    });

    describe('Injector management', () => {
      it('should set and get plugin injector', () => {
        const registration: PluginRegistration = {
          name: 'injector-test',
          loadFn: async () => ({
            PluginManifest: {
              name: 'injector-test',
              version: '1.0.0',
              entryComponent: class {} as any
            }
          })
        };

        registry.register(registration);

        const mockInjector = {
          destroy: jasmine.createSpy('destroy')
        } as any;

        registry.setInjector('injector-test', mockInjector);

        const retrievedInjector = registry.getInjector('injector-test');
        expect(retrievedInjector).toBe(mockInjector);
      });

      it('should destroy injector when plugin is unregistered', () => {
        const registration: PluginRegistration = {
          name: 'injector-destroy-test',
          loadFn: async () => ({
            PluginManifest: {
              name: 'injector-destroy-test',
              version: '1.0.0',
              entryComponent: class {} as any
            }
          })
        };

        registry.register(registration);

        const mockInjector = {
          destroy: jasmine.createSpy('destroy')
        } as any;

        registry.setInjector('injector-destroy-test', mockInjector);
        registry.unregister('injector-destroy-test');

        expect(mockInjector.destroy).toHaveBeenCalled();
      });

      it('should handle injector destruction errors gracefully', () => {
        const registration: PluginRegistration = {
          name: 'injector-error-test',
          loadFn: async () => ({
            PluginManifest: {
              name: 'injector-error-test',
              version: '1.0.0',
              entryComponent: class {} as any
            }
          })
        };

        registry.register(registration);

        const mockInjector = {
          destroy: jasmine.createSpy('destroy').and.throwError('Destruction error')
        } as any;

        registry.setInjector('injector-error-test', mockInjector);

        // Should not throw, errors are caught
        expect(() => registry.unregister('injector-error-test')).not.toThrow();
        expect(mockInjector.destroy).toHaveBeenCalled();
      });

      it('should destroy all injectors when clearing registry', () => {
        const injectors: any[] = [];

        for (let i = 0; i < 3; i++) {
          const registration: PluginRegistration = {
            name: `injector-clear-test-${i}`,
            loadFn: async () => ({
              PluginManifest: {
                name: `injector-clear-test-${i}`,
                version: '1.0.0',
                entryComponent: class {} as any
              }
            })
          };

          registry.register(registration);

          const mockInjector = {
            destroy: jasmine.createSpy('destroy')
          };

          injectors.push(mockInjector);
          registry.setInjector(`injector-clear-test-${i}`, mockInjector as any);
        }

        registry.clear();

        injectors.forEach(inj => {
          expect(inj.destroy).toHaveBeenCalled();
        });
      });
    });

    describe('Manifest management', () => {
      it('should set and retrieve plugin manifest', () => {
        const registration: PluginRegistration = {
          name: 'manifest-test',
          loadFn: async () => ({
            PluginManifest: {
              name: 'manifest-test',
              version: '1.0.0',
              entryComponent: class {} as any
            }
          })
        };

        registry.register(registration);

        const newManifest = {
          name: 'manifest-test',
          version: '2.0.0',
          entryComponent: class NewComponent {} as any,
          displayName: 'Test Plugin',
          description: 'A test plugin'
        };

        registry.setManifest('manifest-test', newManifest);

        const metadata = registry.getMetadata('manifest-test');
        expect(metadata?.manifest).toBe(newManifest);
        expect(metadata?.manifest.version).toBe('2.0.0');
        expect(metadata?.manifest.displayName).toBe('Test Plugin');
      });

      it('should throw error when setting manifest for non-existent plugin', () => {
        const manifest = {
          name: 'non-existent',
          version: '1.0.0',
          entryComponent: class {} as any
        };

        expect(() => registry.setManifest('non-existent', manifest))
          .toThrow(PluginNotFoundError);
      });
    });

    describe('State change emissions', () => {
      it('should emit state change when plugin is registered', (done) => {
        const registration: PluginRegistration = {
          name: 'emit-test',
          loadFn: async () => ({
            PluginManifest: {
              name: 'emit-test',
              version: '1.0.0',
              entryComponent: class {} as any
            }
          })
        };

        registry.state$.subscribe(event => {
          if (event && event.pluginName === 'emit-test') {
            expect(event.state).toBe(PluginState.REGISTERED);
            expect(event.timestamp).toBeDefined();
            done();
          }
        });

        registry.register(registration);
      });

      it('should emit state change when metadata is updated', (done) => {
        const registration: PluginRegistration = {
          name: 'update-emit-test',
          loadFn: async () => ({
            PluginManifest: {
              name: 'update-emit-test',
              version: '1.0.0',
              entryComponent: class {} as any
            }
          })
        };

        registry.register(registration);

        let emissionCount = 0;

        registry.state$.subscribe(event => {
          if (event && event.pluginName === 'update-emit-test') {
            emissionCount++;

            if (emissionCount === 2) {
              expect(event.state).toBe(PluginState.LOADING);
              done();
            }
          }
        });

        registry.updateMetadata('update-emit-test', { state: PluginState.LOADING });
      });

      it('should include error in state change event when present', (done) => {
        const registration: PluginRegistration = {
          name: 'error-emit-test',
          loadFn: async () => ({
            PluginManifest: {
              name: 'error-emit-test',
              version: '1.0.0',
              entryComponent: class {} as any
            }
          })
        };

        registry.register(registration);

        const testError = new Error('Test error');

        let emissionCount = 0;

        registry.state$.subscribe(event => {
          if (event && event.pluginName === 'error-emit-test') {
            emissionCount++;

            if (emissionCount === 2) {
              expect(event.state).toBe(PluginState.ERROR);
              expect(event.error).toBe(testError);
              done();
            }
          }
        });

        registry.updateMetadata('error-emit-test', {
          state: PluginState.ERROR,
          error: testError
        });
      });
    });

    describe('Metadata operations', () => {
      it('should update multiple metadata fields at once', () => {
        const registration: PluginRegistration = {
          name: 'multi-update-test',
          loadFn: async () => ({
            PluginManifest: {
              name: 'multi-update-test',
              version: '1.0.0',
              entryComponent: class {} as any
            }
          })
        };

        registry.register(registration);

        const loadedAt = new Date();
        registry.updateMetadata('multi-update-test', {
          state: PluginState.LOADED,
          loadedAt,
          componentRef: { test: 'ref' } as any
        });

        const metadata = registry.getMetadata('multi-update-test');
        expect(metadata?.state).toBe(PluginState.LOADED);
        expect(metadata?.loadedAt).toBe(loadedAt);
        expect(metadata?.componentRef).toEqual({ test: 'ref' });
      });

      it('should preserve existing metadata fields when updating', () => {
        const registration: PluginRegistration = {
          name: 'preserve-test',
          loadFn: async () => ({
            PluginManifest: {
              name: 'preserve-test',
              version: '1.0.0',
              entryComponent: class {} as any
            }
          })
        };

        registry.register(registration);

        const loadedAt = new Date();
        registry.updateMetadata('preserve-test', {
          state: PluginState.LOADED,
          loadedAt
        });

        // Update only state, loadedAt should be preserved
        registry.updateMetadata('preserve-test', {
          state: PluginState.ACTIVE
        });

        const metadata = registry.getMetadata('preserve-test');
        expect(metadata?.state).toBe(PluginState.ACTIVE);
        expect(metadata?.loadedAt).toBe(loadedAt);
      });
    });

    describe('Registry entry operations', () => {
      it('should return complete registry entry with get()', () => {
        const registration: PluginRegistration = {
          name: 'entry-test',
          loadFn: async () => ({
            PluginManifest: {
              name: 'entry-test',
              version: '1.0.0',
              entryComponent: class {} as any
            }
          })
        };

        registry.register(registration);

        const entry = registry.get('entry-test');
        expect(entry).toBeDefined();
        expect(entry?.registration).toBe(registration);
        expect(entry?.metadata).toBeDefined();
        expect(entry?.metadata.state).toBe(PluginState.REGISTERED);
      });

      it('should return undefined for non-existent plugin entry', () => {
        const entry = registry.get('non-existent');
        expect(entry).toBeUndefined();
      });

      it('should return all metadata for multiple plugins', () => {
        for (let i = 0; i < 5; i++) {
          const registration: PluginRegistration = {
            name: `all-metadata-test-${i}`,
            loadFn: async () => ({
              PluginManifest: {
                name: `all-metadata-test-${i}`,
                version: '1.0.0',
                entryComponent: class {} as any
              }
            })
          };

          registry.register(registration);
        }

        const allMetadata = registry.getAllMetadata();
        expect(allMetadata.length).toBe(5);

        allMetadata.forEach((metadata, index) => {
          expect(metadata.manifest.name).toBe(`all-metadata-test-${index}`);
        });
      });
    });
  });
});
