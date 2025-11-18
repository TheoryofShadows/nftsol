# Dependabot Guide for NFTSol

**Status**: ✅ IMPLEMENTATION COMPLETE
**Date**: November 18, 2025
**Technology**: GitHub Dependabot
**Configuration**: `.github/dependabot.yml`

---

## Quick Start (5 minutes)

### Step 1: Enable Dependabot (Already Configured)
Dependabot is enabled and configured via `.github/dependabot.yml`

### Step 2: Watch for Update PRs
Dependabot will automatically create PRs for:
- ✅ NPM package updates (root, client, backend)
- ✅ GitHub Actions updates
- ✅ Docker image updates

### Step 3: Review & Merge
1. Check the PR details
2. Review changelog/release notes
3. Verify tests pass
4. Merge when ready

### Step 4: Monitor
- Go to GitHub → Security → Dependabot
- Check for security advisories
- Review weekly update schedule

---

## What is Dependabot?

Dependabot is GitHub's automated dependency management tool that:

✅ **Scans dependencies** - Checks for outdated packages
✅ **Creates PRs** - Automatically opens pull requests for updates
✅ **Runs tests** - Verifies compatibility with CI/CD
✅ **Groups updates** - Can combine related updates
✅ **Handles security** - Prioritizes security patches
✅ **Auto-merges** - Can automatically merge safe updates

---

## Configuration

### What Updates?

The configuration in `.github/dependabot.yml` monitors:

1. **Root dependencies** (`/package.json`)
   - Monorepo shared dependencies
   - Schedule: Monday 3:00 AM UTC
   - Limit: 5 open PRs

2. **Frontend dependencies** (`/client/package.json`)
   - React, Vite, UI libraries
   - Schedule: Monday 4:00 AM UTC
   - Limit: 5 open PRs

3. **Backend dependencies** (`/apps/backend/package.json`)
   - Express, database, API libraries
   - Schedule: Monday 3:30 AM UTC
   - Limit: 5 open PRs

4. **GitHub Actions** (`.github/workflows/`)
   - CI/CD workflow dependencies
   - Schedule: Tuesday 2:00 AM UTC
   - Limit: 5 open PRs

5. **Docker** (`Dockerfile`, `docker-compose.yml`)
   - Base images, container dependencies
   - Schedule: Sunday 2:00 AM UTC
   - Limit: 3 open PRs

### Update Strategy

```yaml
rebase-strategy: auto    # Auto-rebase if parent is updated
open-pull-requests-limit: 5  # Max 5 simultaneous PRs per ecosystem
commit-message:
  prefix: "chore(deps):"  # Use conventional commits
```

### Schedules

- **Weekly**: Check every Monday for npm, Tuesday for Actions
- **Auto-rebase**: If main branch updates, rebase the PR
- **Staggered times**: Each ecosystem has different time to avoid conflicts

---

## How to Use Dependabot

### 1. Review Update PRs

When Dependabot creates a PR:

```
Title: chore(deps): bump react from 18.2.0 to 18.3.0
Labels: dependencies, frontend

Changelog:
- New hooks API improvements
- Performance optimizations
- Bug fixes

Tests: ✅ All passing
```

**Review Steps**:
1. Check the changelog link
2. Look at migration guide (if breaking)
3. Review the diff
4. Run locally if concerned
5. Check CI/CD status

### 2. Merge Safe Updates

**Patch versions** (1.2.3 → 1.2.4) - Usually safe to merge immediately
```bash
✅ Can auto-merge patch updates
- Bug fixes only
- No API changes
- Backward compatible
```

**Minor versions** (1.2.0 → 1.3.0) - Review but usually safe
```bash
⚠️  Review before merging
- New features
- No breaking changes
- Backward compatible
```

**Major versions** (1.0.0 → 2.0.0) - Manual review required
```bash
❌ Always review
- Breaking changes
- API removals
- Migration required
```

### 3. Handle Conflicts

If a PR has conflicts:

**Approach 1: Rebase automatically**
```bash
# Let Dependabot rebase it
Comment: @dependabot rebase
```

**Approach 2: Resolve locally**
```bash
git fetch origin
git checkout dependabot/npm_and_yarn/react-18-3-0
git rebase main
git push
```

### 4. Security Updates

Security updates get **high priority**:

```
Title: chore(deps): bump lodash from 4.17.15 to 4.17.21
Labels: security, dependencies

⚠️ SECURITY ALERT: Prototype pollution vulnerability
CVSS Score: 7.5 (High)

Action Required: ASAP
```

**Always merge security updates immediately** (after testing)

### 5. Grouped Updates

Group related updates together:

```yaml
# Example: Group all React updates
groups:
  frontend:
    patterns:
      - "react*"
      - "@react-*"
```

Request: `@dependabot group my-updates`

---

## Common Scenarios

### Scenario 1: Security Patch

```
PR: chore(deps): bump json-stringify from 1.0.1 to 1.0.2
Security: CVE-2024-1234 - DoS vulnerability

Action:
1. ✅ Tests passing
2. ✅ No breaking changes
3. ✅ Merge immediately

Risk: HIGH if not merged
```

### Scenario 2: Major Version Update

```
PR: chore(deps): bump vite from 4.0.0 to 5.0.0
Breaking Changes: API restructuring required

Action:
1. 📖 Read migration guide
2. 🧪 Run locally and test
3. 🔍 Check for deprecation warnings
4. ✏️ Update code if needed
5. ✅ Merge after verification

Risk: MEDIUM - requires code changes
```

### Scenario 3: Many Updates

```
Dependabot created 8 PRs this week
- 5 patch updates
- 2 minor updates
- 1 major update

Action:
1. Merge patches immediately (5)
2. Review and merge minors (2)
3. Schedule time for major (1)
4. Set labels for triage

PR Management: Use labels and milestones
```

---

## Workflow Commands

### Rebase PR
```bash
@dependabot rebase
```

### Squash & Merge
```bash
# GitHub merges with squash
# Keeps clean commit history
```

### Dismiss Notification
```bash
@dependabot ignore this version
# Skip this specific version

@dependabot ignore this minor version
# Ignore all future patches of this minor

@dependabot ignore this major version
# Ignore all future updates of this major
```

### Create Group
```bash
@dependabot group react-updates
# Groups all react-related updates

@dependabot group critical-security
# Groups security updates
```

---

## Best Practices

✅ **DO**:
- Review patch updates (usually safe)
- Test major updates locally before merging
- Merge security updates immediately
- Keep dependencies up to date (reduces debt)
- Use labels to organize updates
- Check changelogs for breaking changes
- Run CI/CD before merging

❌ **DON'T**:
- Ignore security updates
- Merge major updates without testing
- Allow too many PRs to accumulate
- Ignore Dependabot settings
- Disable Dependabot (stay current!)
- Update right before release
- Skip reading changelogs

---

## Monitoring

### Dependabot Dashboard

1. Go to GitHub repository
2. Security → Dependabot
3. See:
   - Open pull requests
   - Security alerts
   - Dependency graph
   - Version updates

### Alerts

Dependabot sends alerts for:
- **Security vulnerabilities** - Action required
- **Version updates** - For review
- **PR checks** - Test status

### Dependency Graph

View:
- All dependencies
- Versions used
- Vulnerability status
- Update available

Access: Insights → Network → Dependency graph

---

## Security Updates

### Automatic Security Patches

GitHub automatically creates PRs for:

```
Critical vulnerabilities (CVSS 9.0-10.0)
├── Action: Immediate merge
├── Review: Minimal (security priority)
└── Risk: Failure to update = exposed vulnerability

High vulnerabilities (CVSS 7.0-8.9)
├── Action: Merge within 24 hours
├── Review: Check if you use the affected function
└── Risk: Moderate to high

Medium/Low vulnerabilities
├── Action: Review in regular cycle
├── Review: Determine if applicable
└── Risk: Low in most cases
```

### Workflow for Security Updates

```
1. Dependabot creates PR
   Title: chore(deps): bump package [SECURITY]

2. GitHub runs CI/CD
   ✅ Tests pass?
   ❌ Tests fail → investigate

3. Review PR
   - Check vulnerability details
   - Verify affected code isn't used
   - Check migration requirements

4. Merge
   - Use merge strategy (squash recommended)
   - Delete branch

5. Monitor
   - Verify in production
   - Watch for related issues
```

---

## Troubleshooting

### Dependabot PR Won't Merge

**Problem**: PR blocked by status checks

**Solutions**:
```bash
# 1. Check failing check
# Go to PR → Checks tab
# See which check is failing

# 2. Fix the failing test
git fetch origin
git checkout dependabot/npm_and_yarn/react-18-3-0
npm test
# Fix locally

# 3. Push fix
git push

# 4. Or request rebase
@dependabot rebase
```

### Dependabot Creating Too Many PRs

**Problem**: 10+ open PRs at once

**Solution**:
```yaml
# Reduce limits in dependabot.yml
open-pull-requests-limit: 3  # Was 5
```

Then:
```bash
# Close excess PRs
# Dependabot will respect new limit
```

### Dependency Conflict

**Problem**: Two dependencies want different versions

**Solutions**:
1. **Update both**: Let Dependabot create combined PR
2. **Use ranges**: Modify package.json constraints
3. **Manual override**: Update one dependency first

### Skipping Certain Updates

```yaml
# In dependabot.yml
ignore:
  # Skip Jest major updates
  - dependency-name: 'jest'
    update-types:
      - 'version-update:semver-major'

  # Skip pre-releases
  - dependency-name: '@solana/*'
    update-types:
      - 'version-update:semver-prerelease'
```

---

## Auto-Merge Configuration

### Enable Auto-Merge (Optional)

Create `.github/workflows/dependabot-auto-merge.yml`:

```yaml
name: Auto Merge Dependabot PRs

on: pull_request

jobs:
  auto-merge:
    runs-on: ubuntu-latest
    if: github.actor == 'dependabot[bot]'
    steps:
      - name: Approve PR
        run: gh pr review --approve "$PR_URL"
        env:
          PR_URL: ${{ github.event.pull_request.html_url }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Enable auto-merge for patch/minor
        run: gh pr merge --auto --squash "$PR_URL"
        env:
          PR_URL: ${{ github.event.pull_request.html_url }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        if: |
          contains(github.event.pull_request.title, 'chore(deps)')
```

### Auto-Merge Conditions

```yaml
# Auto-merge enabled for:
- Patch updates (1.2.3 → 1.2.4)
- Minor updates (1.2.0 → 1.3.0) with tests passing
- Github Actions (safe updates)

# Manual review required for:
- Major updates (breaking changes)
- Security vulnerabilities (still reviewed)
- Monorepo updates (might affect multiple areas)
```

---

## Dependabot Status Checks

### Required Checks

For Dependabot PRs to merge, these must pass:

1. **GitHub Actions** - All workflows succeed
2. **Build checks** - Linting, type-checking
3. **Tests** - Unit, integration, E2E tests
4. **Code quality** - SonarQube, Lighthouse
5. **Branch protection** - Approval required

### Monitoring Checks

```bash
# View all status checks
gh pr view [PR_NUMBER] --json statusCheckRollup

# View specific check logs
gh run view [RUN_ID]

# Re-run failed checks
gh run rerun [RUN_ID]
```

---

## Integration with CI/CD

### GitHub Actions Integration

Dependabot PRs automatically trigger:

1. ✅ `.github/workflows/ci.yml` - Build & lint
2. ✅ `.github/workflows/test.yml` - Run tests
3. ✅ `.github/workflows/sonarqube-scan.yml` - Code quality
4. ✅ `.github/workflows/lighthouse-ci.yml` - Performance
5. ✅ `.github/workflows/e2e-tests.yml` - E2E tests

All checks must pass before merging.

---

## Reports & Insights

### Generate Dependency Report

```bash
# See all current dependencies
npm list --depth=0

# See outdated packages
npm outdated

# Check security vulnerabilities
npm audit

# Get advisory details
npm audit --audit-level=high
```

### Dependency Graph

View in GitHub:
1. Settings → Code security & analysis
2. Dependency graph → See all dependencies
3. Security → Vulnerabilities → Security alerts

---

## Next Steps

1. ✅ Dependabot configured
2. ✅ Watch for first PR (within 1 week)
3. ✅ Review and merge security updates
4. ✅ Monitor update schedule
5. 📋 Set up auto-merge for patches (optional)
6. 📋 Integrate with team process
7. 📋 Train team on reviewing updates

---

## Dependabot Schedule

### Weekly Update Times (UTC)

```
Sunday 02:00   - Docker image checks
Monday 03:00   - Root npm dependencies
Monday 03:30   - Backend dependencies
Monday 04:00   - Frontend dependencies
Tuesday 02:00  - GitHub Actions
```

### Expected PR Frequency

- **Quiet weeks**: 2-3 PRs
- **Normal weeks**: 5-8 PRs
- **Active weeks**: 10-15 PRs

Most are patches (safe to merge quickly)

---

## Resources

- **Dependabot Docs**: https://docs.github.com/en/code-security/dependabot
- **Security Advisories**: https://github.com/advisories
- **npm Audit**: https://docs.npmjs.com/cli/audit
- **GitHub Security**: https://github.com/security
- **OWASP Dependencies**: https://owasp.org/www-project-top-ten/

---

**Status**: ✅ COMPLETE
**Configuration**: `.github/dependabot.yml`
**Monitors**: 5 ecosystems (npm, GitHub Actions, Docker)
**Update Frequency**: Weekly
**Next Improvement**: OpenTelemetry & APM
**Effort**: 2 hours complete

---

**Document Version**: 1.0
**Last Updated**: November 18, 2025
**Maintained By**: Development Team
