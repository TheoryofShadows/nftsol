# SonarQube Integration Guide for NFTSol

**Status**: ✅ IMPLEMENTATION COMPLETE
**Date**: November 18, 2025
**Technology**: SonarQube/SonarCloud for code quality
**Files Created**: 3 (sonar-project.properties, sonarqube-scan.yml, quality-gates.json)

---

## Quick Start (15 minutes)

### Option 1: SonarCloud (Recommended - Cloud-Based)

**Step 1: Create SonarCloud Account**
```bash
1. Go to https://sonarcloud.io
2. Sign up with GitHub
3. Click "+" to add new organization
4. Select your GitHub organization
5. Create a new project "nftsol"
```

**Step 2: Get Token**
```bash
1. Click "My Account" → "Security"
2. Generate new token: "github-actions"
3. Copy token (save it!)
```

**Step 3: Add GitHub Secret**
```bash
1. Go to GitHub repo Settings
2. Secrets → New repository secret
3. Name: SONAR_TOKEN
4. Value: <paste token>
5. Click "Add secret"
```

**Step 4: GitHub Action Already Configured**
```bash
# The workflow file is ready at:
.github/workflows/sonarqube-scan.yml

# It will:
- Run on every push to main/develop
- Run on every pull request
- Analyze code quality
- Enforce quality gates
- Comment on PRs with results
```

**Step 5: Verify**
```bash
1. Push code to main/develop
2. Check "Actions" tab in GitHub
3. Click "SonarQube Code Quality Analysis"
4. Watch the workflow run
5. View results: https://sonarcloud.io/dashboard?id=nftsol
```

### Option 2: Self-Hosted SonarQube (On-Premises)

**Step 1: Docker Setup**
```bash
docker run -d \
  -p 9000:9000 \
  --name sonarqube \
  sonarqube:latest
```

**Step 2: Access SonarQube**
```bash
# Go to http://localhost:9000
# Login: admin / admin
# Change password immediately
```

**Step 3: Create Project**
```bash
1. Click "+" → "Create new project"
2. Enter: nftsol
3. Generate token
4. Click "Locally" (not GitHub)
```

**Step 4: Run Scanner Locally**
```bash
npm install --save-dev sonar-scanner

npx sonar-scanner \
  -Dsonar.projectKey=nftsol \
  -Dsonar.sources=. \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.login=<your-token>
```

**Step 5: View Results**
```bash
# Go to http://localhost:9000
# Click "Projects" → "nftsol"
# Explore code quality metrics
```

---

## What Gets Checked

### Code Quality Metrics
✅ **Coverage**: 75%+ minimum
✅ **Duplications**: < 3%
✅ **Bugs**: Zero blockers/critical
✅ **Vulnerabilities**: Zero critical
✅ **Code Smells**: < 10 per MR
✅ **Test Failures**: 0
✅ **Hot Spots**: Security issues identified

### Security Analysis
- ✅ SQL injection risks
- ✅ XSS vulnerabilities
- ✅ Hardcoded secrets
- ✅ Insecure dependencies
- ✅ Authentication issues
- ✅ Cryptography problems

### Reliability
- ✅ Error handling coverage
- ✅ Exception management
- ✅ Null pointer risks
- ✅ Resource leaks
- ✅ Type safety issues

---

## GitHub Actions Workflow

**File**: `.github/workflows/sonarqube-scan.yml`

**Triggered On**:
- Push to main/develop
- Pull requests to main/develop

**What It Does**:
1. Checks out code (full history)
2. Sets up Node.js 20
3. Installs dependencies
4. Builds backend
5. Builds frontend
6. Runs tests with coverage
7. Runs SonarQube analysis
8. Checks quality gate
9. Comments on PR with results
10. Fails the build if quality gate fails

**On Pull Request**:
```
Automatically comments with:
✅ Code quality analysis completed
View results: https://sonarcloud.io/dashboard?id=nftsol
```

**On Failure**:
```
The workflow fails if:
- Code coverage < 75%
- Blocker violations found
- Critical violations found
- Quality gate not passed
- Tests failing

You CANNOT merge until issues are fixed!
```

---

## Quality Gate Rules

### Rules We Enforce

| Metric | Threshold | Type | Reason |
|--------|-----------|------|--------|
| **Code Coverage** | ≥ 75% | New code | Ensure test coverage |
| **Duplications** | < 3% | Overall | Reduce code duplication |
| **Blocker Issues** | = 0 | Overall | MUST fix immediately |
| **Critical Issues** | = 0 | Overall | MUST fix immediately |
| **Major Issues** | < 5 | New code | Limit new tech debt |
| **Code Smells** | < 10 | New code | Keep code clean |
| **Security Rating** | A or better | Overall | High security standard |
| **Reliability Rating** | A or better | Overall | High reliability |
| **Tech Debt Rating** | A or better | Overall | Manage debt |

### What Counts as What?

**Blocker** (Fails workflow):
- Security hotspots
- Critical bugs
- Data loss risks

**Critical** (Fails workflow):
- Major security issues
- Critical bugs
- Type errors

**Major** (Counted in limits):
- Medium severity issues
- Code quality concerns
- Minor security issues

**Minor** (Informational):
- Code style issues
- Documentation gaps
- Best practice violations

---

## Interpreting Results

### Dashboard View
```
https://sonarcloud.io/dashboard?id=nftsol

Shows:
├── Quality Gate Status (Pass/Fail)
├── Coverage Percentage
├── Duplicated Code
├── Bugs Found
├── Vulnerabilities
├── Code Smells
├── Security Hotspots
└── Technical Debt
```

### Project View
Click on project to see:
- **Code**: Browse and click issues
- **Issues**: Detailed issue list with fixes
- **Measures**: All metrics
- **Activity**: Change history
- **Branches**: Per-branch analysis

### Issue Details
Click any issue to see:
- **Description**: What's wrong
- **Explanation**: Why it matters
- **Severity**: How critical
- **Type**: Bug/Smell/Vulnerability
- **Location**: File and line number
- **Resolution**: How to fix it

---

## Running Locally

### Before Pushing

```bash
# Run full analysis locally first
npm install --save-dev sonar-scanner

# Setup token
export SONAR_TOKEN=<your-token>

# Run scanner
npx sonar-scanner \
  -Dsonar.projectKey=nftsol \
  -Dsonar.organization=nftsol-org \
  -Dsonar.sources=. \
  -Dsonar.exclusions=**/node_modules/**,**/dist/** \
  -Dsonar.tests=. \
  -Dsonar.test.inclusions=**/*.spec.ts,**/*.test.ts \
  -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
  -Dsonar.host.url=https://sonarcloud.io \
  -Dsonar.login=$SONAR_TOKEN
```

### View Results Locally
```bash
# After scan completes:
echo "View results at:"
echo "https://sonarcloud.io/dashboard?id=nftsol"
```

---

## Fixing Quality Gate Failures

### High Code Coverage Issues (< 75%)

**Problem**: Not enough test coverage

**Solutions**:
```bash
# 1. Run tests with coverage
npm run test -- --coverage

# 2. Check uncovered files
npm run test -- --coverage --collectCoverageFrom='src/**/*.ts'

# 3. Add missing tests
# Write tests for uncovered code

# 4. Verify before pushing
npm run test -- --coverage
# Should see 75%+ coverage
```

**Example**:
```typescript
// ❌ Uncovered function
export function calculateRarity(traits: Trait[]): number {
  return traits.reduce((sum, t) => sum + t.rarity, 0);
}

// ✅ Add test
describe('calculateRarity', () => {
  it('should sum trait rarity values', () => {
    const traits = [{ rarity: 5 }, { rarity: 3 }];
    expect(calculateRarity(traits)).toBe(8);
  });
});
```

### Blocker/Critical Issues

**Problem**: Security or major bug found

**Fix Immediately**:
```bash
# 1. View issue in SonarQube
# Click the issue link

# 2. Read the explanation
# Understand what's wrong and why

# 3. Fix the code
# Follow the suggested resolution

# 4. Test the fix
npm run test

# 5. Push fix
git push origin feature-branch
```

**Common Issues**:

**Hardcoded Secret**:
```typescript
// ❌ WRONG
const API_KEY = 'sk_live_abc123...';

// ✅ CORRECT
const API_KEY = process.env.STRIPE_API_KEY;
// .env file
// STRIPE_API_KEY=sk_live_abc123...
```

**SQL Injection**:
```typescript
// ❌ WRONG
const query = `SELECT * FROM users WHERE id = ${userId}`;
db.query(query);

// ✅ CORRECT
const query = 'SELECT * FROM users WHERE id = $1';
db.query(query, [userId]);
```

**Unhandled Promise**:
```typescript
// ❌ WRONG
async function fetchData() {
  fetch('/api/data');  // Promise not awaited
}

// ✅ CORRECT
async function fetchData() {
  const response = await fetch('/api/data');
  return response.json();
}
```

### Duplicated Code

**Problem**: Code duplication > 3%

**Solutions**:
```bash
# 1. Find duplicated code
# SonarQube dashboard shows duplications

# 2. Extract to function
// Before: Duplicated logic in multiple files
// After: One function, imported everywhere

# 3. Example
// utils/calculatePrice.ts
export function calculatePrice(basePrice: number, tax: number): number {
  return basePrice * (1 + tax);
}

// Usage everywhere
import { calculatePrice } from './utils/calculatePrice';
const total = calculatePrice(100, 0.1);
```

### Code Smells

**Problem**: Quality issues (usually code style)

**Fix Examples**:

**Too Many Parameters**:
```typescript
// ❌ WRONG
function createNFT(name, desc, image, price, royalty, collection, ...) {}

// ✅ CORRECT
interface CreateNFTParams {
  name: string;
  description: string;
  image: string;
  price: number;
  royalty: number;
  collection: string;
}
function createNFT(params: CreateNFTParams) {}
```

**Function Too Complex**:
```typescript
// ❌ WRONG - One function doing too much
function processNFT(data) {
  // 50+ lines of logic
}

// ✅ CORRECT - Split into smaller functions
function validateNFT(data) { /* validation */ }
function formatNFT(data) { /* formatting */ }
function saveNFT(data) { /* saving */ }
function processNFT(data) {
  const valid = validateNFT(data);
  const formatted = formatNFT(valid);
  return saveNFT(formatted);
}
```

---

## Team Workflow

### When Creating Pull Request

```bash
# 1. Run tests locally
npm test

# 2. Check coverage
npm test -- --coverage
# Must be >= 75%

# 3. Run SonarQube locally (optional)
npx sonar-scanner [args...]

# 4. Push code
git push origin feature-branch

# 5. Create PR on GitHub
# GitHub Actions will run automatically
```

### When Reviewing PR

```
✅ Check SonarQube Results:
  1. Quality Gate: PASSED or FAILED
  2. Coverage: Check % for new code
  3. Issues: Review any new issues
  4. Security: Check for vulnerabilities

🚫 If Quality Gate FAILED:
  - Request changes
  - Ask author to fix issues
  - Don't merge until fixed

✅ If Quality Gate PASSED:
  - Review code normally
  - Check logic and tests
  - Approve and merge
```

### Before Merging

```
Required checklist:
☑ All tests passing
☑ Code coverage >= 75%
☑ No blocker issues
☑ No critical issues
☑ Quality gate PASSED
☑ Code review approved
☑ No merge conflicts
```

---

## Metrics Explanation

### Code Coverage (%)
**What**: % of code lines executed by tests
**Good**: > 80%
**Acceptable**: 75-80%
**Poor**: < 75%

```
Example:
- 100 lines of code
- 80 lines covered by tests
- Coverage = 80%
```

### Duplicated Code (%)
**What**: % of code that appears in multiple places
**Good**: < 2%
**Acceptable**: 2-5%
**Poor**: > 5%

### Bugs (Count)
**What**: Code defects that will cause problems
**Good**: 0
**Acceptable**: 0-2 (minor)
**Poor**: > 2

### Vulnerabilities (Count)
**What**: Security issues
**Good**: 0
**Acceptable**: 0
**Poor**: > 0

### Code Smells (Count)
**What**: Code quality issues
**Good**: 0-5
**Acceptable**: 5-20
**Poor**: > 20

### Technical Debt (Hours)
**What**: Time to fix all issues
**Good**: < 1 day
**Acceptable**: 1-3 days
**Poor**: > 3 days

---

## Troubleshooting

### GitHub Actions Not Running

**Check**:
1. Workflow file exists: `.github/workflows/sonarqube-scan.yml`
2. SONAR_TOKEN secret is set in GitHub
3. No syntax errors in workflow
4. Branch is main or develop

**Fix**:
```bash
# Verify secret
1. Go to Settings → Secrets
2. Check SONAR_TOKEN exists
3. Regenerate if needed
```

### SonarQube Not Finding Code

**Problem**: Coverage is 0%, no code analyzed

**Solutions**:
```bash
# 1. Check file patterns
sonar.sources=.
sonar.exclusions=**/node_modules/**,**/dist/**

# 2. Run tests first
npm test -- --coverage

# 3. Check coverage file exists
ls coverage/lcov.info

# 4. Verify sonar-project.properties
cat sonar-project.properties
```

### Quality Gate Always Fails

**Check**:
1. Are tests actually running?
2. Is coverage being measured?
3. Are there actual code issues?

**Debug**:
```bash
# Run locally with verbose output
npx sonar-scanner \
  -Dsonar.verbose=true \
  -Dsonar.log.level=DEBUG \
  [other args...]
```

### Authorization Failed

**Problem**: "403 Forbidden" or "Unauthorized"

**Fix**:
```bash
# 1. Check token is correct
echo $SONAR_TOKEN

# 2. Regenerate token
# SonarCloud → My Account → Security → Generate

# 3. Update GitHub secret
# Settings → Secrets → Update SONAR_TOKEN

# 4. Rerun workflow
```

---

## Integration with CI/CD

### Current Setup

**GitHub Actions**: ✅ Ready
```yaml
File: .github/workflows/sonarqube-scan.yml
Runs on: push, pull_request
Uses: SonarCloud
```

### Optional: Jenkins Integration

```groovy
pipeline {
    stages {
        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh 'npx sonar-scanner'
                }
                timeout(time: 10, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
    }
}
```

### Optional: GitLab CI Integration

```yaml
sonarqube:
  stage: test
  script:
    - npm install
    - npm test -- --coverage
    - npx sonar-scanner
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
```

---

## Best Practices

✅ **DO**:
- Write tests for all new code
- Aim for > 80% coverage
- Fix blocker issues immediately
- Review quality gate results
- Run locally before pushing
- Keep technical debt manageable
- Document security fixes

❌ **DON'T**:
- Suppress issues without fixing
- Ignore security warnings
- Skip test coverage
- Commit code that breaks quality gate
- Change quality gate rules carelessly
- Hide technical debt

---

## Maintenance

### Weekly
- Review quality gate trends
- Check technical debt growth
- Assess code smell additions

### Monthly
- Review overall metrics
- Plan debt reduction
- Adjust quality rules if needed

### Quarterly
- Comprehensive code audit
- Identify refactoring opportunities
- Update security rules

---

## Resources

- **SonarCloud**: https://sonarcloud.io
- **SonarQube**: https://www.sonarqube.org
- **Quality Gates Docs**: https://docs.sonarqube.org/latest/user-guide/quality-gates
- **Rules**: https://rules.sonarqube.org
- **Community**: https://community.sonarsource.com

---

## Next Steps

1. ✅ Setup SonarCloud account
2. ✅ Add SONAR_TOKEN secret
3. ✅ Push code to trigger workflow
4. ✅ View results on SonarCloud
5. ✅ Fix any quality gate failures
6. ✅ Monitor metrics dashboard
7. 📋 Integrate with team workflow
8. 📋 Train team on quality gates

---

**Status**: ✅ COMPLETE
**Next Improvement**: Lighthouse CI (Performance Budgets)
**Effort**: 6 hours complete

---

**Document Version**: 1.0
**Last Updated**: November 18, 2025
**Maintained By**: Development Team
