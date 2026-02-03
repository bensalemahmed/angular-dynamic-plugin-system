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
});
