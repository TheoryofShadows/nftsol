# E2E Test Commands Quick Reference

## Installation

```bash
npm install --save-dev @playwright/test
npx playwright install --with-deps
```

---

## Running Tests

### Run All Tests
```bash
# Default (all tests, headless)
npm run test:e2e

# Or direct Playwright command
npx playwright test
```

### Run Specific Test File
```bash
npx playwright test tests/e2e/auth.spec.ts
npx playwright test tests/e2e/minting.spec.ts
npx playwright test tests/e2e/marketplace.spec.ts
```

### Run Specific Test
```bash
npx playwright test -g "should connect wallet"
npx playwright test -g "should mint NFT"
```

### Run by Tag
```bash
npx playwright test --grep @critical
npx playwright test --grep @smoke
```

---

## Browser Testing

### Single Browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
npx playwright test --project="Mobile Chrome"
npx playwright test --project="iPhone 12"
```

### All Browsers (Parallel)
```bash
npx playwright test
```

### Desktop Browsers Only
```bash
npx playwright test --project=chromium --project=firefox --project=webkit
```

---

## Debug & Interactive Modes

### UI Mode (Interactive)
```bash
# Run tests with interactive UI
npx playwright test --ui

# Run specific test in UI
npx playwright test tests/e2e/auth.spec.ts --ui
```

### Debug Mode (Step Through)
```bash
# Pause on each step
npx playwright test --debug

# Specific test
npx playwright test tests/e2e/auth.spec.ts --debug
```

### Headed Mode (See Browser)
```bash
npx playwright test --headed
```

### Trace Viewer
```bash
npx playwright show-trace test-results/auth-should-connect-wallet-chromium/trace.zip
```

---

## Reporting & Results

### Generate HTML Report
```bash
npx playwright test
npx playwright show-report
```

### View Latest Report
```bash
npx playwright show-report playwright-report/
```

### JSON Report
```bash
cat test-results.json | jq .
```

### JUnit Report (for CI)
```bash
cat junit-results.xml
```

---

## Parallel Execution

### Custom Worker Count
```bash
# 2 workers
npx playwright test --workers=2

# 4 workers
npx playwright test --workers=4

# Single worker (for debugging)
npx playwright test --workers=1
```

### Retry Failed Tests
```bash
# Retry each failed test 2 times
npx playwright test --retries=2
```

---

## Filtering Tests

### Run Only Failing Tests
```bash
npx playwright test --only-changed
```

### Run Tests Matching Pattern
```bash
npx playwright test -g "wallet|minting"
```

### Skip Tests
```bash
# Skip tests with @skip tag
npx playwright test --grep -v @skip
```

---

## Output & Logging

### Verbose Output
```bash
npx playwright test --reporter=list
```

### Quiet Output
```bash
npx playwright test --reporter=json
```

### Custom Report
```bash
npx playwright test --reporter=html,json,junit
```

---

## Recording & Artifacts

### Record Tests (Video)
```bash
npx playwright test --video=on

# Only on failure
npx playwright test --video=retain-on-failure
```

### Take Screenshots
```bash
npx playwright test --screenshot=on

# Only on failure
npx playwright test --screenshot=only-on-failure
```

### Collect Trace
```bash
npx playwright test --trace=on

# Only on failure
npx playwright test --trace=on-first-retry
```

---

## Configuration

### Use Custom Config
```bash
npx playwright test --config=playwright.custom.config.ts
```

### Set Environment Variables
```bash
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000 npx playwright test
PLAYWRIGHT_TEST_API_URL=http://localhost:8000 npx playwright test
```

### Set Timeout
```bash
npx playwright test --timeout=60000  # 60 seconds
```

---

## NPM Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:chrome": "playwright test --project=chromium",
    "test:e2e:firefox": "playwright test --project=firefox",
    "test:e2e:webkit": "playwright test --project=webkit",
    "test:e2e:mobile": "playwright test --project='Mobile Chrome'",
    "test:e2e:report": "playwright show-report",
    "test:e2e:quick": "playwright test --workers=4 --retries=0",
    "test:e2e:slow": "playwright test --workers=1 --timeout=120000",
    "test:e2e:auth": "playwright test tests/e2e/auth.spec.ts",
    "test:e2e:minting": "playwright test tests/e2e/minting.spec.ts",
    "test:e2e:marketplace": "playwright test tests/e2e/marketplace.spec.ts"
  }
}
```

Then run with:

```bash
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:debug
npm run test:e2e:headed
npm run test:e2e:chrome
npm run test:e2e:report
npm run test:e2e:quick
npm run test:e2e:auth
```

---

## CI/CD Commands

### GitHub Actions
```yaml
- name: Run E2E tests
  run: npx playwright test
```

### Jenkins
```groovy
stage('E2E Tests') {
  steps {
    sh 'npx playwright test --reporter=junit'
  }
  post {
    always {
      junit 'junit-results.xml'
    }
  }
}
```

### GitLab CI
```yaml
e2e-tests:
  script:
    - npx playwright test
  artifacts:
    reports:
      junit: junit-results.xml
```

---

## Common Workflows

### Before Pushing
```bash
npm run test:e2e:quick
npm run test:e2e:report
```

### Debugging Failed Test
```bash
npm run test:e2e:debug
# Then open DevTools in browser that opens
```

### Local Full Test
```bash
npm run test:e2e:headed --project=chromium
```

### CI Full Test
```bash
npx playwright test --reporter=html,junit
```

### Generate Report for Team
```bash
npm run test:e2e
npm run test:e2e:report
# Share playwright-report/ folder
```

---

## Tips & Tricks

### Run Tests in Order
```bash
npx playwright test --workers=1  # Single worker = sequential
```

### List All Tests
```bash
npx playwright test --list
```

### Dry Run (No Execution)
```bash
npx playwright test --list --reporter=list
```

### Extract Test Names
```bash
npx playwright test --list | grep "✓"
```

### Run Last Failed
```bash
npx playwright test --last-failed
```

### Slow Motion (50ms between actions)
```bash
npx playwright test --slow-mo=50
```

---

## Troubleshooting

### Browsers Not Found
```bash
npx playwright install --with-deps
```

### Tests Running Too Slow
```bash
# Use more workers
npx playwright test --workers=4

# Or focus on faster tests
npx playwright test -g "smoke"
```

### Tests Hanging
```bash
# Reduce timeout
npx playwright test --timeout=30000

# Kill hanging processes
pkill -f playwright
```

### Cannot Find Server
```bash
# Check if frontend/backend are running
curl http://localhost:5173
curl http://localhost:3001/health

# Set custom URLs
PLAYWRIGHT_TEST_BASE_URL=http://your-url:port npx playwright test
```

---

## Performance

### Quick Run
```bash
npx playwright test \
  --workers=4 \
  --retries=0 \
  --reporter=list
```

### Full Run with Reports
```bash
npx playwright test \
  --workers=2 \
  --retries=1 \
  --reporter=html,json,junit
```

### Diagnostic Run
```bash
npx playwright test \
  --trace=on \
  --screenshot=on \
  --video=on \
  --workers=1
```

---

**Remember**: Always run tests before committing!

```bash
npm run test:e2e && git commit
```
