# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-03

### Added

- Initial release of Angular Dynamic Plugin System
- Core plugin loading and lifecycle management
- PluginManager service for orchestrating plugin operations
- PluginRegistry service for state management
- Isolated injector factory for plugin isolation
- PluginContext for controlled host-plugin communication
- PluginOutlet component for rendering plugins
- Comprehensive type definitions and error classes
- Observable-based state management
- Concurrent plugin loading with configurable limits
- Timeout support with automatic cleanup
- Lifecycle hooks (onLoad, onActivate, onDeactivate, onDestroy)
- Global configuration via providePluginSystem()
- Defensive error handling
- TypeScript strict mode compliance
- Complete test suite for core services
- Documentation and examples
- Plugin development guide

### Features

- Runtime plugin loading via dynamic imports
- Plugin state tracking (REGISTERED, LOADING, LOADED, ACTIVE, ERROR, UNLOADING, UNLOADED)
- Service access control per plugin
- Event-based communication between host and plugins
- Auto-load plugin support
- Batch plugin loading
- Plugin metadata management
- Comprehensive error handling with custom error classes

### Developer Experience

- Full TypeScript support with strict mode
- Production-ready code with no console logs
- Clean API surface with minimal boilerplate
- Extensive documentation with examples
- Unit tests for all core functionality
- Example plugin and demo application

## [Unreleased]

### Planned

- Hot module replacement support
- Plugin dependency resolution
- Version compatibility checking
- Plugin marketplace integration
- Advanced sandboxing options
- Plugin router integration
- Remote plugin loading
- Plugin permissions system
- Analytics and monitoring hooks
