# NPM Publication Checklist - v1.1.0

**Package:** @angular-dynamic/plugin-system
**Version:** 1.1.0
**Release Date:** 2026-02-04
**Release Type:** Non-breaking stability release

---

## Pre-Publication Checklist

Complete all items before running `npm publish`.

### 1. Version and Package Verification

- [ ] `package.json` version is `1.1.0`
- [ ] `package.json` name is `@angular-dynamic/plugin-system`
- [ ] `package.json` description is accurate
- [ ] `package.json` keywords include: angular, plugin, dynamic, runtime, modular
- [ ] `package.json` repository URL is correct
- [ ] `package.json` license is `MIT`
- [ ] `package.json` author and contributors are listed
- [ ] `package.json` peer dependencies are correct:
  - `@angular/common: ">=16.0.0"`
  - `@angular/core: ">=16.0.0"`
  - `rxjs: "^7.5.0"`
- [ ] `package.json` files array includes only: `dist`, `README.md`, `LICENSE`
- [ ] `package.json` main points to `dist/index.js`
- [ ] `package.json` types points to `dist/index.d.ts`

### 2. Code Quality Verification

- [ ] All TypeScript code compiles without errors
- [ ] No TypeScript strict mode violations
- [ ] All tests pass (run `npm test` if implemented)
- [ ] No console.log or debug statements in production code
- [ ] All new APIs are exported from main index
- [ ] No TODO or FIXME comments in critical paths

### 3. Documentation Verification

- [ ] README.md is complete and accurate
- [ ] README.md mentions v1.1.0 features
- [ ] CHANGELOG.md has v1.1.0 entry
- [ ] RELEASE_NOTES_v1.1.0_FINAL.md exists
- [ ] LICENSE file exists and is MIT
- [ ] All documentation references correct version (1.1.0)
- [ ] All code examples in documentation are tested
- [ ] No broken links in documentation

### 4. Build Verification

- [ ] Run clean build: `rm -rf dist && npm run build`
- [ ] Verify `dist/` directory exists
- [ ] Verify `dist/index.js` exists
- [ ] Verify `dist/index.d.ts` exists
- [ ] Verify all type definitions are generated
- [ ] Check bundle size is reasonable (~20-30KB uncompressed)
- [ ] Verify no source maps in production build (or include if desired)

### 5. Git Repository Verification

- [ ] All changes committed to git
- [ ] Working directory is clean (`git status`)
- [ ] On correct branch (main or release branch)
- [ ] Version tag created: `git tag v1.1.0`
- [ ] Tag includes release notes in annotation
- [ ] Remote repository is up to date

### 6. NPM Authentication

- [ ] Logged into NPM: `npm whoami`
- [ ] Have publish permissions for `@angular-dynamic` scope
- [ ] 2FA configured on NPM account (required for publishing)
- [ ] 2FA device available

### 7. Dry Run

- [ ] Run `npm publish --dry-run`
- [ ] Review files that will be published
- [ ] Verify no sensitive files included (.env, credentials, etc.)
- [ ] Verify total package size is reasonable

---

## Publication Steps

Execute these steps in order.

### Step 1: Final Build

```bash
# Clean previous builds
rm -rf dist

# Build the library
npm run build

# Verify build output
ls -la dist/
```

**Expected output:**
- `dist/index.js`
- `dist/index.d.ts`
- All service, component, and type files

**Verification:**
- [ ] Build completed without errors
- [ ] All expected files present in `dist/`

---

### Step 2: Test Package Locally (Optional but Recommended)

```bash
# Create tarball
npm pack

# Expected output: angular-dynamic-plugin-system-1.1.0.tgz

# Test installation in separate test project
cd /path/to/test-project
npm install /path/to/angular-plugin-system/angular-dynamic-plugin-system-1.1.0.tgz

# Verify import works
# Create test file that imports from package
```

**Verification:**
- [ ] Tarball created successfully
- [ ] Test installation works
- [ ] Test import works
- [ ] Test TypeScript compilation works

---

### Step 3: Git Tag and Push

```bash
# Create annotated tag
git tag -a v1.1.0 -m "Release v1.1.0 - Stability and reliability release

- Lifecycle hook timeout protection
- Memory leak fixes
- Race condition protection
- Enhanced debugging capabilities
- 100% backward compatible with v1.0.0

See RELEASE_NOTES_v1.1.0_FINAL.md for details."

# Push tag to remote
git push origin v1.1.0

# Verify tag on GitHub
```

**Verification:**
- [ ] Tag created locally
- [ ] Tag pushed to remote
- [ ] Tag visible on GitHub releases page

---

### Step 4: Publish to NPM

```bash
# Ensure on correct directory
pwd
# Should be: /Users/addinn/Documents/workSpace/Angular Dynamic Plugin System

# Verify npm login
npm whoami

# Publish (will prompt for 2FA code)
npm publish --access public

# Expected output:
# + @angular-dynamic/plugin-system@1.1.0
```

**During publish:**
- Have 2FA device ready
- Enter 2FA code when prompted
- Wait for upload to complete

**Verification:**
- [ ] Publish command succeeded
- [ ] No errors in output
- [ ] Version 1.1.0 shown in output

---

### Step 5: Verify NPM Publication

```bash
# Check package on NPM
npm view @angular-dynamic/plugin-system

# Verify version
npm view @angular-dynamic/plugin-system version
# Should output: 1.1.0

# Verify dist-tags
npm view @angular-dynamic/plugin-system dist-tags
# Should show: latest: 1.1.0

# Test installation from NPM
cd /tmp
mkdir test-install
cd test-install
npm init -y
npm install @angular-dynamic/plugin-system@1.1.0
```

**Verification:**
- [ ] Package visible on npmjs.com
- [ ] Version 1.1.0 is published
- [ ] Latest tag points to 1.1.0
- [ ] Installation from NPM works
- [ ] README appears correctly on npmjs.com

---

### Step 6: Create GitHub Release

```bash
# Using GitHub CLI (recommended)
gh release create v1.1.0 \
  --title "v1.1.0 - Stability and Reliability Release" \
  --notes-file GITHUB_RELEASE_v1.1.0.md

# Or manually:
# 1. Go to https://github.com/angular-dynamic/plugin-system/releases/new
# 2. Select tag: v1.1.0
# 3. Title: v1.1.0 - Stability and Reliability Release
# 4. Copy content from GITHUB_RELEASE_v1.1.0.md
# 5. Publish release
```

**Verification:**
- [ ] GitHub release created
- [ ] Release notes are correct
- [ ] Tag is linked correctly
- [ ] Release marked as latest

---

### Step 7: Update NPM Package Tags (If Needed)

```bash
# If you want to add additional tags (usually not needed)
# npm dist-tag add @angular-dynamic/plugin-system@1.1.0 stable
# npm dist-tag add @angular-dynamic/plugin-system@1.1.0 latest

# Verify tags
npm dist-tag ls @angular-dynamic/plugin-system
```

**Expected output:**
```
latest: 1.1.0
```

**Verification:**
- [ ] `latest` tag points to 1.1.0

---

## Post-Publication Verification

Complete within 1 hour of publication.

### 1. NPM Package Verification

- [ ] Visit https://www.npmjs.com/package/@angular-dynamic/plugin-system
- [ ] Version 1.1.0 is listed
- [ ] README renders correctly
- [ ] All metadata is correct (license, repository, etc.)
- [ ] Download statistics are tracking

### 2. Installation Test

```bash
# Fresh installation test
mkdir /tmp/npm-test-v1.1.0
cd /tmp/npm-test-v1.1.0
npm init -y

# Install latest
npm install @angular-dynamic/plugin-system

# Verify version
npm list @angular-dynamic/plugin-system
# Should show: @angular-dynamic/plugin-system@1.1.0
```

- [ ] Installation works
- [ ] Correct version installed
- [ ] No peer dependency warnings (with Angular 16+)

### 3. TypeScript Integration Test

Create test file: `test.ts`

```typescript
import {
  PluginManager,
  PluginRegistration,
  PluginLifecycleTimeoutError,
  PluginOperationInProgressError
} from '@angular-dynamic/plugin-system';

// Test v1.1.0 APIs exist
const manager = {} as PluginManager;
const isUnloading: boolean = manager.isUnloading('test');
const info = manager.getPluginInfo('test');

console.log('Import test passed');
```

```bash
# Compile test
npx tsc test.ts --skipLibCheck
```

- [ ] TypeScript compilation succeeds
- [ ] All v1.1.0 exports are available
- [ ] No type errors

### 4. GitHub Release Verification

- [ ] Visit https://github.com/angular-dynamic/plugin-system/releases
- [ ] v1.1.0 release is visible
- [ ] Release notes are formatted correctly
- [ ] Assets are attached (if any)
- [ ] Release is marked as "Latest release"

### 5. Search and Discovery

- [ ] Search "angular dynamic plugin" on npmjs.com - package appears
- [ ] Package appears in Angular ecosystem searches
- [ ] README badges show correct version

### 6. Unpkg/CDN Verification (If Applicable)

```bash
# Check if available on unpkg
curl -I https://unpkg.com/@angular-dynamic/plugin-system@1.1.0/dist/index.js

# Should return 200 OK
```

- [ ] Package available on unpkg
- [ ] Main file accessible via CDN

---

## Communication and Announcements

### 1. Update Project Documentation

- [ ] Update main README.md badges (if version badges exist)
- [ ] Update any "current version" references
- [ ] Commit and push documentation updates

### 2. Community Announcements

- [ ] Post release announcement in GitHub Discussions (if enabled)
- [ ] Update any community forum posts
- [ ] Tweet or social media announcement (if applicable)
- [ ] Post in relevant Angular communities (Reddit, Discord, etc.)

**Suggested announcement:**
```
🎉 Angular Dynamic Plugin System v1.1.0 is now available!

This stability release addresses critical memory leaks and adds
lifecycle timeout protection while maintaining 100% backward
compatibility with v1.0.0.

Key improvements:
- Lifecycle hook timeout protection
- Memory leak prevention
- Race condition protection
- Enhanced debugging capabilities

Upgrade with: npm install @angular-dynamic/plugin-system@^1.1.0

No code changes required!

📖 Release notes: [link]
📦 NPM: [link]
```

### 3. Issue Triage

- [ ] Review open GitHub issues
- [ ] Close issues fixed in v1.1.0
- [ ] Update issue labels (add "fixed-in-v1.1.0")
- [ ] Comment on fixed issues with release info

---

## Monitoring (First 48 Hours)

### Day 1

- [ ] Monitor NPM download statistics
- [ ] Watch for GitHub issues related to v1.1.0
- [ ] Check for error reports or questions
- [ ] Monitor package size and performance reports

### Day 2

- [ ] Review any bug reports
- [ ] Check community feedback
- [ ] Verify no critical issues reported
- [ ] Document any issues for v1.1.1 (if needed)

### Metrics to Track

- NPM downloads (first 24h, 48h, 7d)
- GitHub stars and forks
- Issues opened vs closed
- Community sentiment (positive/negative feedback)

---

## Rollback Plan

If critical issues are discovered after publication:

### Minor Issues (Can wait for v1.1.1)

1. Document issue in GitHub
2. Create hotfix branch
3. Plan v1.1.1 patch release

### Critical Issues (Requires immediate action)

**Option 1: Deprecate Version**

```bash
# Deprecate the broken version
npm deprecate @angular-dynamic/plugin-system@1.1.0 "Critical bug - use 1.1.1 instead"

# Publish fixed version as 1.1.1
# Update version in package.json to 1.1.1
npm run build
npm publish --access public
```

**Option 2: Unpublish (Only within 72 hours)**

```bash
# ONLY if absolutely necessary and within 72 hours
npm unpublish @angular-dynamic/plugin-system@1.1.0

# Note: This is discouraged and may not be allowed after 72h
```

**Emergency Contacts:**
- NPM support: support@npmjs.com
- Team leads: [contact info]

---

## Success Criteria

v1.1.0 publication is successful if:

- [ ] Package published to NPM without errors
- [ ] Version 1.1.0 installable via `npm install`
- [ ] All exports work correctly
- [ ] TypeScript types are correct
- [ ] GitHub release created
- [ ] No critical bugs reported in first 48 hours
- [ ] Documentation is accurate
- [ ] Community feedback is positive
- [ ] Download metrics are healthy

---

## Post-Release Tasks

### Immediate (Within 1 week)

- [ ] Monitor for issues
- [ ] Respond to community questions
- [ ] Update documentation based on feedback
- [ ] Begin planning v1.1.1 (if hotfixes needed) or v1.2.0

### Long-term (Within 1 month)

- [ ] Analyze adoption metrics
- [ ] Gather community feedback
- [ ] Plan next release (v1.2.0 features)
- [ ] Review and close resolved issues

---

## Notes and Observations

### Publication Date and Time

- **Date:** 2026-02-04
- **Time:** _______________
- **Publisher:** _______________
- **NPM Version:** _______________

### Issues Encountered

_(Document any issues during publication)_

### Metrics

- **Package Size:** _______ KB
- **Bundle Size (gzipped):** _______ KB
- **Files Published:** _______
- **Initial Downloads (24h):** _______

---

**Checklist Status:** Ready for execution
**Last Updated:** 2026-02-04
**Next Review:** After v1.1.1 or v1.2.0 planning
