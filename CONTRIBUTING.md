# Contributing to Angular Dynamic Plugin System

Thank you for your interest in contributing to the Angular Dynamic Plugin System! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow:

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Assume good intentions
- Accept responsibility for mistakes

Unacceptable behavior includes harassment, trolling, insulting comments, and any form of discrimination.

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git
- Basic knowledge of Angular and TypeScript

### First-Time Contributors

Look for issues labeled `good first issue` or `help wanted` to find beginner-friendly tasks.

## Development Setup

1. **Fork the repository** on GitHub

2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/plugin-system.git
   cd plugin-system
   ```

3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/angular-dynamic/plugin-system.git
   ```

4. **Install dependencies**:
   ```bash
   npm install
   ```

5. **Build the library**:
   ```bash
   npm run build
   ```

6. **Run tests**:
   ```bash
   npm test
   ```

## How to Contribute

### Reporting Bugs

Before creating a bug report:
- Check existing issues to avoid duplicates
- Verify the bug exists in the latest version
- Collect relevant information (Angular version, browser, error messages)

When creating a bug report, include:
- Clear, descriptive title
- Steps to reproduce the issue
- Expected vs actual behavior
- Code samples or repository demonstrating the issue
- Environment details (Angular version, TypeScript version, OS)

### Suggesting Enhancements

Enhancement suggestions are welcome! Please:
- Use a clear, descriptive title
- Provide detailed explanation of the proposed feature
- Explain why this enhancement would be useful
- Include code examples if applicable

### Contributing Code

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our coding standards

3. **Write or update tests** for your changes

4. **Ensure all tests pass**:
   ```bash
   npm test
   ```

5. **Build the project** to verify no build errors:
   ```bash
   npm run build
   ```

6. **Commit your changes** using conventional commits:
   ```bash
   git commit -m "feat: add new plugin lifecycle hook"
   ```

7. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

8. **Open a Pull Request** against the main branch

## Coding Standards

### TypeScript

- **Strict Mode**: All code must compile with TypeScript strict mode enabled
- **Type Safety**: Avoid `any` types; use proper type annotations
- **No Console Logs**: Remove all console.log statements from production code
- **No Comments**: Code should be self-documenting; avoid inline comments
- **Defensive Programming**: Handle all error cases defensively

### Code Style

```typescript
// Good: Clear, typed, self-documenting
async load(pluginName: string): Promise<PluginMetadata> {
  const metadata = this.registry.getMetadata(pluginName);
  if (!metadata) {
    throw new PluginNotFoundError(pluginName);
  }
  return metadata;
}

// Bad: Any types, console logs, unclear names
async load(name: any): Promise<any> {
  console.log('Loading plugin:', name);
  const m = this.registry.get(name); // Unclear variable name
  return m;
}
```

### Angular Patterns

- Use standalone components
- Leverage dependency injection properly
- Follow Angular style guide
- Use RxJS best practices
- Implement proper lifecycle hooks

### File Organization

```
src/
├── lib/
│   ├── types/          # Type definitions
│   ├── services/       # Injectable services
│   ├── components/     # UI components
│   ├── utils/          # Utility functions
│   └── config/         # Configuration
├── public-api.ts       # Public API exports
└── index.ts            # Package entry point
```

### Naming Conventions

- **Services**: `*Manager`, `*Registry`, `*Service`
- **Components**: `*Component`
- **Interfaces**: Descriptive nouns (e.g., `PluginLifecycle`, `PluginContext`)
- **Types**: `*Config`, `*Event`, `*Metadata`
- **Errors**: `*Error`
- **Functions**: `provide*`, `create*`
- **Constants**: `SCREAMING_SNAKE_CASE`

## Testing Requirements

### Unit Tests

All new code must include unit tests:

```typescript
describe('PluginManager', () => {
  it('should load plugin successfully', async () => {
    const manager = new PluginManager(registry, injector);
    const metadata = await manager.load('test-plugin');
    expect(metadata.state).toBe(PluginState.LOADED);
  });

  it('should handle load errors defensively', async () => {
    const manager = new PluginManager(registry, injector);
    await expectAsync(manager.load('invalid-plugin'))
      .toBeRejectedWithError(PluginLoadError);
  });
});
```

### Test Coverage

- **Minimum Coverage**: 80% for new code
- **Critical Paths**: 100% coverage for error handling
- **Edge Cases**: Test all error conditions and edge cases

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Pull Request Process

### Before Submitting

- [ ] Code follows project coding standards
- [ ] All tests pass locally
- [ ] New tests added for new functionality
- [ ] Documentation updated (if applicable)
- [ ] No console logs or debugging code
- [ ] Commit messages follow conventional commits
- [ ] Branch is up to date with main

### Conventional Commits

Use conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(plugin-manager): add batch unload capability
fix(plugin-outlet): handle null plugin gracefully
docs(readme): update installation instructions
test(plugin-registry): add concurrent load tests
```

### PR Title

Use the same format as commit messages:
```
feat(plugin-manager): add concurrent loading support
```

### PR Description

Include:
- What changes were made
- Why the changes were necessary
- How the changes were tested
- Any breaking changes
- Related issues (e.g., "Closes #123")

### Review Process

1. **Automated Checks**: CI must pass (tests, build, linting)
2. **Code Review**: At least one maintainer must approve
3. **Testing**: Reviewer will verify functionality
4. **Feedback**: Address all review comments
5. **Merge**: Maintainer will merge once approved

## Release Process

Releases are managed by maintainers:

1. Version bump following semver
2. Update CHANGELOG.md
3. Create release tag
4. Publish to npm
5. Create GitHub release with notes

## Questions?

- Check [Documentation](./docs/)
- Review [API Reference](./docs/API_REFERENCE.md)
- Open a [GitHub Discussion](https://github.com/angular-dynamic/plugin-system/discussions)
- Ask in [GitHub Issues](https://github.com/angular-dynamic/plugin-system/issues)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing to Angular Dynamic Plugin System!
