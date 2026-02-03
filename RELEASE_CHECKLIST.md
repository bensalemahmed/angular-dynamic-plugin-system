# Release Checklist

This checklist ensures a smooth and reliable release process for the Angular Dynamic Plugin System.

## Pre-Release Validation

### Code Quality

- [ ] All TypeScript compiles without errors
  ```bash
  npm run build
  ```

- [ ] No TypeScript strict mode violations
  ```bash
  tsc --noEmit
  ```

- [ ] All tests pass
  ```bash
  npm test
  ```

- [ ] Test coverage meets minimum threshold (80%)
  ```bash
  npm run test:coverage
  ```

- [ ] No console logs in production code
  ```bash
  grep -r "console\." src/lib --exclude="*.spec.ts"
  ```

- [ ] No debugging code or comments
  ```bash
  grep -r "debugger\|TODO\|FIXME" src/lib
  ```

### Documentation

- [ ] README.md is up to date
  - [ ] Installation instructions accurate
  - [ ] Quick start example works
  - [ ] All features documented
  - [ ] Badges updated

- [ ] CHANGELOG.md updated
  - [ ] Version number correct
  - [ ] Release date set
  - [ ] All changes documented
  - [ ] Breaking changes highlighted

- [ ] API_REFERENCE.md reflects current API
  - [ ] All new methods documented
  - [ ] All deprecated methods marked
  - [ ] Examples are accurate

- [ ] ARCHITECTURE.md updated if architecture changed

- [ ] MIGRATION_GUIDE.md updated for breaking changes

### Package Configuration

- [ ] package.json version bumped correctly
  - [ ] Major: Breaking changes
  - [ ] Minor: New features, backward compatible
  - [ ] Patch: Bug fixes only

- [ ] package.json metadata accurate
  - [ ] Description clear and concise
  - [ ] Keywords relevant
  - [ ] Author information correct
  - [ ] Repository links working
  - [ ] License correct

- [ ] Dependencies reviewed
  - [ ] No unnecessary dependencies
  - [ ] Peer dependencies correct
  - [ ] Version ranges appropriate

- [ ] .npmignore configured correctly
  - [ ] Source files excluded
  - [ ] Test files excluded
  - [ ] Build artifacts included
  - [ ] README and LICENSE included

### Build Verification

- [ ] Clean build succeeds
  ```bash
  rm -rf dist node_modules
  npm install
  npm run build
  ```

- [ ] Build output structure correct
  ```bash
  ls -la dist/
  # Should contain: index.js, index.d.ts, and all compiled files
  ```

- [ ] TypeScript declarations generated
  ```bash
  ls dist/*.d.ts
  ```

- [ ] No source maps in production build (unless intended)
  ```bash
  ls dist/*.map
  ```

### Integration Testing

- [ ] Test installation from local tarball
  ```bash
  npm pack
  # Create test project
  mkdir test-install && cd test-install
  npm install ../angular-dynamic-plugin-system-1.0.0.tgz
  ```

- [ ] Example application runs successfully
  ```bash
  cd examples/demo-app
  npm install
  npm start
  ```

- [ ] Example plugin loads without errors

- [ ] All documented examples work

### Security

- [ ] No sensitive data in source code
  - [ ] No API keys
  - [ ] No tokens
  - [ ] No credentials

- [ ] Dependencies scanned for vulnerabilities
  ```bash
  npm audit
  ```

- [ ] No known security issues

### Performance

- [ ] Bundle size acceptable
  ```bash
  npm run build
  ls -lh dist/
  ```

- [ ] No memory leaks in plugin lifecycle

- [ ] Loading performance acceptable

## Release Process

### Version Control

- [ ] All changes committed
  ```bash
  git status
  ```

- [ ] Working directory clean

- [ ] On correct branch (main or release branch)

- [ ] Branch up to date with remote
  ```bash
  git pull origin main
  ```

### Git Tagging

- [ ] Create version tag
  ```bash
  git tag -a v1.0.0 -m "Release version 1.0.0"
  ```

- [ ] Push tag to remote
  ```bash
  git push origin v1.0.0
  ```

### NPM Publishing

- [ ] Logged into npm with correct account
  ```bash
  npm whoami
  ```

- [ ] Organization access verified (if applicable)

- [ ] Dry run publish
  ```bash
  npm publish --dry-run
  ```

- [ ] Review files to be published
  ```bash
  npm pack --dry-run
  ```

- [ ] Publish to npm
  ```bash
  npm publish --access public
  ```

- [ ] Verify package on npm registry
  ```
  https://www.npmjs.com/package/@angular-dynamic/plugin-system
  ```

- [ ] Test installation from npm
  ```bash
  mkdir test-npm && cd test-npm
  npm install @angular-dynamic/plugin-system
  ```

### GitHub Release

- [ ] Create GitHub release
  - [ ] Navigate to https://github.com/angular-dynamic/plugin-system/releases/new
  - [ ] Select version tag
  - [ ] Title: "v1.0.0"
  - [ ] Copy release notes from CHANGELOG.md
  - [ ] Mark as latest release
  - [ ] Publish release

- [ ] Attach build artifacts (optional)

- [ ] Release notes include:
  - [ ] What's new
  - [ ] Breaking changes
  - [ ] Bug fixes
  - [ ] Contributors
  - [ ] Installation instructions

## Post-Release Tasks

### Verification

- [ ] Package appears on npm registry
  ```
  https://www.npmjs.com/package/@angular-dynamic/plugin-system
  ```

- [ ] Installation works globally
  ```bash
  npm install @angular-dynamic/plugin-system
  ```

- [ ] Documentation links work

- [ ] GitHub release visible

### Communication

- [ ] Announce on GitHub Discussions

- [ ] Update project README badges

- [ ] Notify major users (if any)

- [ ] Post on social media (optional)
  - [ ] Twitter
  - [ ] LinkedIn
  - [ ] Reddit (r/Angular)

### Monitoring

- [ ] Monitor GitHub issues for problems

- [ ] Watch npm download stats

- [ ] Check for immediate bug reports

- [ ] Review community feedback

### Prepare Next Version

- [ ] Create milestone for next version

- [ ] Update roadmap if needed

- [ ] Plan next features

- [ ] Update project board

## Rollback Procedure

If issues are discovered post-release:

### Critical Issues

1. **Deprecate the version on npm**
   ```bash
   npm deprecate @angular-dynamic/plugin-system@1.0.0 "Critical bug - use 1.0.1 instead"
   ```

2. **Publish patch version immediately**
   ```bash
   # Fix the issue
   # Bump to 1.0.1
   npm publish
   ```

3. **Update GitHub release notes**
   - Mark as deprecated
   - Link to fixed version

4. **Communicate to users**
   - GitHub issue
   - Social media
   - Direct notification if possible

### Minor Issues

1. **Document workarounds** in GitHub issues

2. **Plan fix for next patch release**

3. **Update CHANGELOG.md** with known issues

## Emergency Contacts

- **NPM Account Owner**: [contact info]
- **GitHub Organization Owner**: [contact info]
- **Technical Lead**: [contact info]

## Release Schedule

### Regular Releases

- **Patch releases**: As needed for bug fixes
- **Minor releases**: Quarterly (new features)
- **Major releases**: Annually (breaking changes)

### Security Releases

- Critical security issues: Immediate
- High severity: Within 48 hours
- Medium severity: Within 1 week
- Low severity: Next regular release

## Version History

| Version | Release Date | Type | Status |
|---------|--------------|------|--------|
| 1.0.0   | 2026-02-03   | Major | Current |

---

## Notes

- Always test in a clean environment
- Never skip steps, even if they seem unnecessary
- Document any deviations from this checklist
- Update this checklist based on lessons learned

## Automation Opportunities

Consider automating:
- [ ] Version bumping
- [ ] Changelog generation
- [ ] Build verification
- [ ] NPM publishing
- [ ] GitHub release creation
- [ ] Notification system

## Additional Resources

- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github)

---

**Last Updated:** 2026-02-03
**Maintained By:** Release Engineering Team
