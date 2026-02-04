# Post-Release Guardrails - v1.1.0

**Effective Date:** 2026-02-04 (Release of v1.1.0)
**Duration:** 30 days (until 2026-03-06)
**Purpose:** Maintain stability and backward compatibility

---

## Overview

This document defines **strict rules** for what changes are allowed in the 30 days following the v1.1.0 release. These guardrails ensure stability while the community adopts the release and provides feedback.

**Primary Goal:** Maintain trust in the v1.1.0 release as a stable, production-ready version.

---

## Allowed Changes (Next 30 Days)

### 1. Critical Bug Fixes Only

**Criteria:** Issue must be:
- Actively breaking existing functionality
- Affecting production deployments
- Reproducible with clear steps
- Not fixable with workaround

**Examples of ALLOWED bug fixes:**
- Memory leak still present after v1.1.0 fixes
- TypeScript compilation errors in consumer projects
- Runtime crashes from v1.1.0 code
- Lifecycle timeout not working as documented
- Plugin unload causing application freeze

**Release as:** v1.1.1 (patch version)

**Process:**
1. Create GitHub issue documenting bug
2. Confirm bug exists in v1.1.0 (not v1.0.0)
3. Create hotfix branch from v1.1.0 tag
4. Implement minimal fix
5. Add regression test
6. Document fix in CHANGELOG
7. Release as patch version

---

### 2. Documentation Corrections

**Criteria:** Correction must fix:
- Factual errors in documentation
- Code examples that don't work
- Incorrect API signatures
- Broken links
- Misleading statements

**Examples of ALLOWED documentation fixes:**
- Code example has syntax error
- API signature in docs doesn't match actual implementation
- Installation instructions are wrong
- Link to GitHub issues is broken
- Release notes reference wrong version

**Release as:** Documentation update (no version bump) or v1.1.1 if bundled with bug fix

**Process:**
1. Fix documentation
2. Test all code examples
3. Commit with clear message
4. Push directly to main branch (no release needed for docs-only)

---

### 3. Test Improvements

**Criteria:** Test must:
- Increase coverage of existing features
- Catch regressions
- Not require code changes to pass

**Examples of ALLOWED test additions:**
- Test for reported bug (even if bug is fixed)
- Integration test for v1.1.0 features
- Edge case test for lifecycle timeout
- Performance test for memory usage

**Release as:** No version bump (tests only)

**Process:**
1. Add test to appropriate spec file
2. Ensure all tests pass
3. Commit and push
4. No release needed

---

### 4. Type Definition Fixes

**Criteria:** Fix must:
- Correct inaccurate TypeScript types
- Not change runtime behavior
- Maintain backward compatibility

**Examples of ALLOWED type fixes:**
- Method return type is wrong
- Parameter type too restrictive
- Generic constraint incorrect
- Missing exported type

**Release as:** v1.1.1 (patch version)

**Process:**
1. Fix type definition
2. Test in consumer project
3. Ensure no breaking changes
4. Release as patch

---

## Prohibited Changes (Next 30 Days)

### 1. New Features

**NOT ALLOWED:**
- New public methods
- New configuration options
- New observables
- New error types
- New lifecycle hooks
- Any additive API

**Rationale:** New features belong in v1.2.0 after stabilization period.

**Action:** Document feature request for v1.2.0 planning.

---

### 2. Behavior Changes

**NOT ALLOWED:**
- Changing default configuration values
- Modifying error messages (except to fix incorrect info)
- Changing lifecycle order
- Altering state transition behavior
- Performance optimizations that change observable behavior

**Rationale:** Even non-breaking behavior changes can break consumer expectations.

**Action:** Defer to v1.2.0 unless truly critical.

---

### 3. Dependency Updates

**NOT ALLOWED:**
- Updating peer dependencies (Angular, RxJS)
- Adding new dependencies
- Removing dependencies
- Changing dependency versions

**Exception:** Security patches for existing dependencies

**Rationale:** Dependency changes can cause unexpected issues in consumer projects.

**Action:** Defer to v1.2.0.

---

### 4. Refactoring

**NOT ALLOWED:**
- Code restructuring
- Renaming internal methods
- Splitting files
- Changing class structure
- "Cleanup" commits

**Rationale:** Even internal changes carry risk during stabilization period.

**Action:** Document refactoring ideas for v1.2.0.

---

### 5. Performance Optimizations

**NOT ALLOWED:**
- Caching changes
- Algorithm optimizations
- Bundle size reductions
- Memory optimizations

**Exception:** Fix for performance regression introduced in v1.1.0

**Rationale:** Performance changes can introduce subtle bugs.

**Action:** Collect performance improvement ideas for v1.2.0.

---

### 6. Deprecations

**NOT ALLOWED:**
- Marking any API as deprecated
- Adding deprecation warnings
- Documenting planned removals

**Rationale:** Deprecations should be planned and communicated well in advance.

**Action:** Plan deprecations for v1.2.0 or v2.0.0.

---

## Feature Request Handling

### Process for New Feature Requests

When a user requests a new feature during the guardrail period:

1. **Thank the user** for the suggestion
2. **Create GitHub issue** with label `enhancement` and `v1.2.0`
3. **Explain guardrail period:** "We're in a 30-day stabilization period after v1.1.0 release. New features are planned for v1.2.0."
4. **Ask for details:** Understand the use case
5. **Provide workaround** if possible using existing v1.1.0 APIs
6. **Add to v1.2.0 backlog**

### Response Template

```markdown
Thank you for the feature request!

We're currently in a 30-day stabilization period following the v1.1.0
release (until March 6, 2026). During this time, we're only accepting
critical bug fixes to ensure maximum stability for production users.

I've added your request to our v1.2.0 backlog for consideration. In the
meantime, here's a possible workaround using existing v1.1.0 features:

[Provide workaround if available]

You can track this feature request in issue #XXX.
```

---

## Bug Report Triage

### Severity Classification

**CRITICAL (Fix immediately in v1.1.1):**
- Application crashes
- Data corruption
- Memory leaks causing OOM
- Security vulnerabilities
- Complete feature breakdown
- TypeScript compilation failures

**HIGH (Fix in v1.1.1 if time permits, otherwise v1.2.0):**
- Feature partially broken
- Workaround exists but is complex
- Performance degradation (> 50%)
- Poor error messages causing confusion

**MEDIUM (Defer to v1.2.0):**
- Edge case failures
- Workaround is simple
- Minor performance issues
- Documentation gaps

**LOW (Defer to v1.2.0):**
- Enhancement requests disguised as bugs
- Cosmetic issues
- Nice-to-have improvements

### Triage Process

1. **Reproduce the issue** - Can you reproduce it?
2. **Check version** - Does it exist in v1.1.0? v1.0.0?
3. **Assign severity** - Use classification above
4. **Check for workaround** - Can user work around it?
5. **Determine version** - v1.1.1 or v1.2.0?
6. **Label appropriately** - `bug`, `critical`, `v1.1.1`, etc.
7. **Communicate timeline** - Set expectations

---

## Issue Labels

### Required Labels for Issues

- `bug` - Confirmed bug
- `enhancement` - Feature request
- `documentation` - Documentation issue
- `question` - User question
- `critical` - Critical severity
- `high` - High severity
- `medium` - Medium severity
- `low` - Low severity
- `v1.1.1` - Target for next patch
- `v1.2.0` - Target for next minor
- `v2.0.0` - Target for next major
- `blocked` - Blocked on something
- `wontfix` - Will not be fixed
- `duplicate` - Duplicate issue

### Label Workflow

```
New Issue → Triage → Assign Severity → Assign Target Version → Work/Defer
```

---

## Pull Request Policy

### Accepting Pull Requests During Guardrail Period

**Accept:**
- Critical bug fixes with tests
- Documentation corrections
- Test additions
- Type definition fixes

**Reject (politely):**
- New features
- Refactoring
- Performance optimizations (unless fixing regression)
- Dependency updates (unless security)

### Response Template for Feature PRs

```markdown
Thank you for your contribution!

We're currently in a 30-day stabilization period following the v1.1.0
release. During this time, we're only accepting critical bug fixes.

I'd like to keep this PR open and target it for our v1.2.0 release
(planned for early March 2026). Would you be willing to:

1. Rebase on our `v1.2.0-dev` branch (or we can do this)
2. Add tests if not present
3. Update documentation

We'll review and merge as part of the v1.2.0 release cycle.

Thank you for understanding!
```

---

## Version Planning

### v1.1.1 (Patch Release)

**When:** Only if critical bugs found
**Timeline:** Within 7 days of bug discovery
**Contents:** Bug fixes only (see Allowed Changes #1)

**Release Criteria:**
- At least one critical bug fixed
- All tests pass
- No new features
- Backward compatible
- Documentation updated

### v1.2.0 (Minor Release)

**When:** After 30-day stabilization period (after March 6, 2026)
**Timeline:** 4-6 weeks after v1.1.0
**Contents:**
- Deferred bug fixes
- New features from backlog
- Performance improvements
- Refactoring
- Documentation enhancements

**Planning Starts:** February 20, 2026 (2 weeks after v1.1.0)

### v2.0.0 (Major Release)

**When:** 6-12 months after v1.1.0
**Contents:**
- Breaking changes
- Architectural improvements
- Plugin dependency resolution
- Remote loading
- Advanced features

**Planning Starts:** After v1.2.0 release

---

## Communication Guidelines

### Setting Expectations

**For bug reports:**
- "Thank you for reporting! We'll investigate within 48 hours."
- "This appears to be [severity]. We'll include a fix in v1.1.1 / v1.2.0."

**For feature requests:**
- "Great idea! We've added this to our v1.2.0 backlog."
- "We're in a stabilization period, so new features will be considered for v1.2.0."

**For questions:**
- "Thanks for asking! Here's how to do that..."
- "That's not currently supported, but it's planned for v1.2.0."

### Response Time Targets

- **Critical bugs:** 24 hours
- **High severity bugs:** 48 hours
- **Medium/Low bugs:** 1 week
- **Feature requests:** 1 week
- **Questions:** 3 days
- **Documentation:** 1 week

---

## Escalation Process

### When to Break Guardrails

In rare cases, guardrails may be bypassed. Requires:

1. **Unanimous team agreement** - All core maintainers approve
2. **Clear justification** - Document why guardrail must be broken
3. **Risk assessment** - Evaluate potential impact
4. **Communication plan** - How to inform community
5. **Rollback plan** - How to undo if needed

**Examples of valid escalations:**
- Critical security vulnerability requiring API change
- Data loss bug affecting production users
- Legal/licensing issue requiring immediate action

**Process:**
1. Create escalation document
2. Get team approval
3. Notify community in advance
4. Execute change carefully
5. Document decision

---

## Metrics to Monitor

### Health Indicators

**Good Signs:**
- NPM downloads increasing
- Few critical bugs reported
- Positive community feedback
- Low issue churn (not many reopened)
- Tests passing consistently

**Warning Signs:**
- Multiple critical bugs in first week
- Negative community sentiment
- High rate of bug reports
- Requests to revert to v1.0.0
- Breaking changes discovered

### Track Weekly

- Number of issues opened (by severity)
- Number of issues closed
- Number of PRs merged
- NPM download count
- Community feedback sentiment
- Time to respond to issues

---

## End of Guardrail Period

### After 30 Days (March 6, 2026)

1. **Review period outcomes:**
   - How many bugs were found?
   - What was community feedback?
   - Were any guardrails broken?

2. **Begin v1.2.0 planning:**
   - Review backlog
   - Prioritize features
   - Set timeline

3. **Update documentation:**
   - Remove "newly released" warnings
   - Mark v1.1.0 as stable
   - Begin v1.2.0 roadmap

4. **Communicate:**
   - Blog post: "v1.1.0 stabilization complete"
   - Announce v1.2.0 planning
   - Thank community for feedback

---

## Decision Framework

When evaluating a proposed change during the guardrail period, ask:

1. **Is it a bug or a feature?**
   - Bug → Evaluate severity
   - Feature → Defer to v1.2.0

2. **If bug, what's the severity?**
   - Critical → Fix in v1.1.1
   - High → Evaluate on case-by-case
   - Medium/Low → Defer to v1.2.0

3. **Does it change behavior?**
   - Yes → Requires strong justification
   - No → More likely to accept

4. **Can users work around it?**
   - Yes → Defer to v1.2.0
   - No → Higher priority

5. **Does it maintain backward compatibility?**
   - Yes → Can consider
   - No → Almost certainly reject

6. **What's the risk vs. reward?**
   - Low risk, high reward → Consider
   - High risk → Defer

**When in doubt, defer to v1.2.0.**

---

## Example Scenarios

### Scenario 1: User Reports Lifecycle Timeout Not Working

**Classification:** Critical bug (core feature broken)
**Action:**
1. Reproduce immediately
2. Create hotfix branch
3. Fix and add test
4. Release as v1.1.1 within 3-5 days
5. Update documentation

**Guardrail Status:** ✅ Allowed (critical bug fix)

---

### Scenario 2: User Requests New `unregisterAll()` Method

**Classification:** Feature request
**Action:**
1. Thank user
2. Create GitHub issue with `enhancement` and `v1.2.0` labels
3. Explain stabilization period
4. Add to v1.2.0 backlog
5. Suggest workaround using existing APIs

**Guardrail Status:** ❌ Not allowed (new feature)

---

### Scenario 3: Community Member Submits Refactoring PR

**Classification:** Code improvement (not a bug)
**Action:**
1. Thank contributor
2. Explain guardrail policy
3. Keep PR open for v1.2.0
4. Add `v1.2.0` label
5. Review when guardrails lift

**Guardrail Status:** ❌ Not allowed (refactoring)

---

### Scenario 4: Documentation Has Wrong Code Example

**Classification:** Documentation bug
**Action:**
1. Fix immediately
2. Test code example
3. Commit to main
4. No version bump needed

**Guardrail Status:** ✅ Allowed (documentation fix)

---

### Scenario 5: Performance is 50% Slower in Certain Cases

**Classification:** High severity bug (performance regression)
**Action:**
1. Investigate root cause
2. If introduced in v1.1.0 → Fix in v1.1.1
3. If existed in v1.0.0 → Defer to v1.2.0
4. Provide workaround if possible

**Guardrail Status:** ⚠️ Conditional (depends on when introduced)

---

## Team Responsibilities

### Release Manager

- Monitor GitHub issues daily
- Triage new issues within 24h
- Enforce guardrail policy
- Communicate decisions
- Plan v1.1.1 if needed
- Track metrics

### Core Developers

- Review critical bug fixes
- Provide technical assessment
- Write tests for fixes
- Update documentation
- Support community

### Community Manager

- Respond to questions
- Set expectations
- Gather feedback
- Update roadmap
- Write blog posts

---

## Success Criteria

The guardrail period is successful if:

1. ✅ No critical bugs in production for 30 days
2. ✅ Community feedback is positive
3. ✅ Backward compatibility maintained
4. ✅ All issues triaged and labeled
5. ✅ Clear roadmap for v1.2.0
6. ✅ Team follows guardrail policy
7. ✅ Trust in release is high

---

## Conclusion

These guardrails ensure v1.1.0 remains stable and trustworthy during the critical adoption period. By resisting the urge to add features and improvements immediately after release, we give the community time to adopt, test, and provide feedback.

**Remember:** It's better to defer a good idea to v1.2.0 than to introduce instability in v1.1.0.

---

**Guardrails Active:** 2026-02-04 to 2026-03-06 (30 days)
**Next Review:** 2026-03-06
**v1.2.0 Planning Starts:** 2026-02-20

**When in doubt, ask:** "Would I want this change if I just adopted v1.1.0 in production yesterday?"

If the answer is no, defer to v1.2.0.
