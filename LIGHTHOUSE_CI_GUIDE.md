# Lighthouse CI Performance Monitoring Guide for NFTSol

**Status**: ✅ IMPLEMENTATION COMPLETE
**Date**: November 18, 2025
**Technology**: Lighthouse CI with Performance Budgets
**Files Created**: 3 (.lighthouserc.json, .lighthouserc-budgets.json, lighthouse-ci.yml)

---

## Quick Start (10 minutes)

### Step 1: Install Lighthouse CI Globally
```bash
npm install -g @lhci/cli@0.12.x
```

### Step 2: Install Dependencies
```bash
cd client
npm install
```

### Step 3: Build Frontend
```bash
npm run build
```

### Step 4: Run Lighthouse CI Locally
```bash
cd ..  # Back to project root
lhci autorun
```

### Step 5: View Results
```bash
# HTML report will be displayed
# Check .lighthouseci/ directory for JSON results
```

---

## What is Lighthouse CI?

Lighthouse CI is an automated performance testing tool that:

✅ **Runs Lighthouse audits** on every push/PR
✅ **Enforces performance budgets** (fail builds if too slow)
✅ **Tracks metrics over time** (trends and regressions)
✅ **Prevents performance degradation** in CI/CD
✅ **Provides detailed reports** with optimization hints
✅ **Integrates with GitHub** (comments on PRs)

---

## Configuration Explained

### `.lighthouserc.json` - Main Configuration

```json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3,              // Run audit 3 times, use median
      "url": [                        // Pages to audit
        "http://localhost:5173",
        "http://localhost:5173/marketplace",
        "http://localhost:5173/dashboard"
      ],
      "staticDistDir": "./client/dist",  // Pre-built app location
      "settings": {
        "onlyCategories": [
          "performance",              // Core Web Vitals
          "accessibility",            // WCAG compliance
          "best-practices",          // Security & standards
          "seo"                      // Search engine optimization
        ]
      }
    },
    "assert": {
      "categories:performance": [
        "error",
        { "minScore": 0.85 }         // Fail if < 85/100
      ],
      "largest-contentful-paint": [
        "error",
        { "maxNumericValue": 2500 }  // Fail if > 2.5 seconds
      ]
    }
  }
}
```

### Key Performance Thresholds

| Metric | Threshold | Severity | Why |
|--------|-----------|----------|-----|
| **Performance Score** | 85/100 | FAIL | Overall page speed |
| **Accessibility Score** | 90/100 | FAIL | WCAG compliance |
| **LCP** | 2500ms | FAIL | User perceives visual progress |
| **FCP** | 1800ms | FAIL | First visual feedback |
| **CLS** | 0.1 | FAIL | Layout stability (no jumps) |
| **INP** | 200ms | FAIL | Responsiveness to clicks |
| **TBT** | 200ms | FAIL | Main thread not blocked |
| **TTFB** | 600ms | FAIL | Server response time |

---

## Running Lighthouse CI

### Locally (For Development)

**Option 1: Pre-built app**
```bash
# Build once
cd client && npm run build && cd ..

# Run tests repeatedly
lhci autorun
```

**Option 2: Against live server**
```bash
# Terminal 1: Start dev servers
npm run dev              # Backend on :3001
cd client && npm run dev # Frontend on :5173

# Terminal 2: Run Lighthouse
cd ..
lhci autorun --config=.lighthouserc.json
```

**Option 3: Single URL test**
```bash
lhci collect --url=http://localhost:5173 --staticDistDir=./client/dist
lhci assert
```

### In GitHub Actions

The workflow (`.github/workflows/lighthouse-ci.yml`) automatically:

1. Triggers on push to `main` or `develop`
2. Triggers on every PR
3. Builds the frontend
4. Runs Lighthouse audits on 3 key pages
5. Comments PR with results
6. Fails build if performance budget exceeded

---

## Interpreting Results

### Lighthouse Report Structure

When you run `lhci autorun`, you get:

```
├── .lighthouseci/
│   ├── lhr.json                 # Main audit results
│   ├── lhr-*.json               # Run-specific results
│   └── manifest.json            # Metadata
│
└── Console Output:
    ├── URL: http://localhost:5173
    ├── Categories
    │   ├── performance: 92
    │   ├── accessibility: 98
    │   ├── best-practices: 96
    │   └── seo: 90
    ├── Core Web Vitals
    │   ├── FCP: 1.2s
    │   ├── LCP: 2.1s
    │   ├── CLS: 0.05
    │   └── TBT: 45ms
    └── Assertions: PASS ✅
```

### Score Interpretation

```
🟢 90-100  Green   Excellent - No action needed
🟡 80-89   Yellow  Good - Monitor for regressions
🟠 50-79   Orange  Needs improvement - Optimize
🔴 0-49    Red     Poor - Critical issues to fix
```

### Example Report

```
⚡ Lighthouse CI Results

Performance Score: 92/100 🟢
├── First Contentful Paint: 1.2s ✅
├── Largest Contentful Paint: 2.1s ✅
├── Cumulative Layout Shift: 0.05 ✅
├── Total Blocking Time: 45ms ✅
└── Time to First Byte: 280ms ✅

Accessibility Score: 98/100 🟢
Best Practices Score: 96/100 🟢
SEO Score: 90/100 🟢

✅ All assertions passed!
```

---

## Understanding Core Web Vitals

### 1. FCP - First Contentful Paint

**What**: Time until first pixel of content appears on screen

**Good**: < 1.8 seconds
**Acceptable**: 1.8-3.0 seconds
**Poor**: > 3.0 seconds

```
Timeline:
0ms     500ms       1.2s (FCP) 2.1s (LCP)
|-------|-----------|----------|
        User sees     User sees largest
        something!    content is loaded
```

**How to improve**:
```typescript
// ❌ Slow - Large bundle blocks rendering
import { Dashboard } from './pages/Dashboard'; // 500kb

// ✅ Fast - Lazy load heavy components
const Dashboard = lazy(() => import('./pages/Dashboard'));
```

### 2. LCP - Largest Contentful Paint

**What**: Time until the largest visual element loads

**Good**: < 2.5 seconds
**Acceptable**: 2.5-4.0 seconds
**Poor**: > 4.0 seconds

**Elements tracked**: Images, videos, text blocks, SVGs

**How to improve**:
```html
<!-- ❌ Slow - Image loads from network -->
<img src="https://cdn.example.com/hero.jpg" />

<!-- ✅ Fast - Image preloaded with optimal size -->
<img
  src="hero-optimized.webp"
  width="1200"
  height="600"
  loading="eager"
  fetchpriority="high"
/>
```

### 3. CLS - Cumulative Layout Shift

**What**: How much page layout shifts/jumps while loading

**Good**: < 0.1 (minimal shifts)
**Acceptable**: 0.1-0.25 (some shifts)
**Poor**: > 0.25 (lots of jank)

**Common causes**:
- Images without height specified
- Ads/embeds resizing
- Font loading causing reflow
- Late-loaded content

**How to fix**:
```typescript
// ❌ Bad - Image height unknown, causes layout shift
<img src="nft.png" />

// ✅ Good - Height specified, reserved space
<img src="nft.png" width="400" height="400" />

// ✅ Better - Using next/image for automatic sizing
<Image
  src={nft}
  width={400}
  height={400}
  placeholder="blur"
/>
```

### 4. INP - Interaction to Next Paint

**What**: Time from user click to visual feedback

**Good**: < 200 milliseconds
**Acceptable**: 200-500 milliseconds
**Poor**: > 500 milliseconds

**How to improve**:
```typescript
// ❌ Slow - Heavy computation on click blocks UI
const handleClick = () => {
  const results = expensiveComputation(); // 300ms
  setResults(results);
};

// ✅ Fast - Defer heavy work
const handleClick = async () => {
  setLoading(true);
  const results = await computeAsync(); // Async
  setResults(results);
  setLoading(false);
};
```

### 5. TBT - Total Blocking Time

**What**: Total time main thread is blocked (can't respond to user input)

**Good**: < 200ms
**Acceptable**: 200-600ms
**Poor**: > 600ms

**How to improve**:
```typescript
// ❌ Bad - Blocks main thread for 500ms
function processManyNFTs(nfts: NFT[]) {
  return nfts.map(nft => {
    // Heavy processing for each NFT
    return expensiveOperation(nft); // 500ms total
  });
}

// ✅ Good - Breaks work into chunks
async function processManyNFTsAsync(nfts: NFT[]) {
  const results = [];
  for (let i = 0; i < nfts.length; i += 10) {
    const chunk = nfts.slice(i, i + 10);
    results.push(...chunk.map(expensiveOperation));
    await new Promise(r => setTimeout(r, 0)); // Yield to browser
  }
  return results;
}
```

### 6. TTFB - Time to First Byte

**What**: Time from request to first byte received from server

**Good**: < 600ms
**Acceptable**: 600-1000ms
**Poor**: > 1000ms

**How to improve**:
- Use CDN (Cloudflare, Netlify, Vercel)
- Optimize server response time
- Enable caching
- Use edge functions

---

## Performance Optimization Strategies

### 1. Code Splitting & Lazy Loading

```typescript
// components/Router.tsx
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const Mint = lazy(() => import('./pages/Mint'));

export function Router() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/mint" element={<Mint />} />
      </Routes>
    </Suspense>
  );
}
```

**Impact**: Reduce initial bundle from 400kb to 150kb

### 2. Image Optimization

```typescript
// ❌ Raw image load
<img src="hero.jpg" />  // 2.5MB, JPEG

// ✅ Optimized with modern format
<picture>
  <source srcSet="hero.webp" type="image/webp" />
  <source srcSet="hero-optimized.jpg" type="image/jpeg" />
  <img src="hero-optimized.jpg" loading="lazy" width="1200" height="600" />
</picture>
```

**Tools to use**:
- Sharp: Local image processing
- Cloudinary: Cloud-based optimization
- ImageOptim: macOS batch processing
- TinyPNG: Online compression

### 3. JavaScript Bundle Optimization

```typescript
// Check bundle size
npm install --save-dev webpack-bundle-analyzer

// Add to build script
"analyze": "vite build && vite analyze"

// Common heavy dependencies to replace:
moment        → date-fns
lodash        → lodash-es (tree-shakeable)
axios         → fetch (built-in)
socket.io     → ws (if possible)
```

### 4. Web Fonts Optimization

```typescript
// ❌ Unoptimized
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=auto');

// ✅ Optimized
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap&subset=latin-ext');

// Better: System fonts
/* Font stack uses system fonts first, falls back to web fonts */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### 5. Third-Party Script Management

```html
<!-- ❌ Blocks rendering -->
<script src="https://analytics.example.com/tracker.js"></script>

<!-- ✅ Async loading -->
<script async src="https://analytics.example.com/tracker.js"></script>

<!-- ✅ Deferred loading (for tracking) -->
<script defer src="https://analytics.example.com/tracker.js"></script>

<!-- ✅ Worker thread (for heavy computation) -->
<script>
  // Load heavy scripts in Web Worker
  const worker = new Worker('/heavy-script-worker.js');
</script>
```

---

## Performance Budget Enforcement

### Budget Files

**`.lighthouserc.json`** - Main performance thresholds
**`.lighthouserc-budgets.json`** - Detailed budget configuration

### Resource Budgets

```json
{
  "resourceBudgets": [
    {
      "resourceType": "script",
      "budget": 300,  // Max 300kb of JavaScript
      "description": "Main app scripts"
    },
    {
      "resourceType": "image",
      "budget": 300,  // Max 300kb of images per page
      "description": "Optimized images"
    },
    {
      "resourceType": "stylesheet",
      "budget": 50,   // Max 50kb of CSS
      "description": "Critical CSS inline"
    }
  ]
}
```

### Timing Budgets

```json
{
  "timingBudgets": [
    {
      "metric": "largest-contentful-paint",
      "budget": 2500,
      "description": "LCP target: 2.5 seconds"
    },
    {
      "metric": "interaction-to-next-paint",
      "budget": 200,
      "description": "INP target: 200ms"
    }
  ]
}
```

### Per-Page Budgets

Different pages have different requirements:

```json
{
  "/": {
    "description": "Landing page",
    "performance": 90,       // Strict: users' first impression
    "maxBundleSize": 300
  },
  "/dashboard": {
    "description": "Complex dashboard",
    "performance": 80,       // Relaxed: authenticated users
    "maxBundleSize": 500
  }
}
```

---

## Team Workflow Integration

### When Creating PR

```bash
# 1. Build locally
cd client && npm run build && cd ..

# 2. Run Lighthouse CI
lhci autorun

# 3. Review results
# ✅ If passing: Create PR
# ❌ If failing: Optimize and retry

# 4. Push code
git push origin feature-branch
```

### When Reviewing PR

GitHub Actions automatically runs Lighthouse CI and comments:

```
✅ Lighthouse CI Results

Performance: 88/100  (was 85) ⬆️
Accessibility: 98/100
Best Practices: 96/100
SEO: 92/100

Core Web Vitals:
- FCP: 1.2s ✅
- LCP: 2.1s ✅
- CLS: 0.05 ✅
- INP: 85ms ✅
- TBT: 50ms ✅

✅ All performance budgets passed!
```

### Before Merging

```
Required checks:
☑ All tests passing
☑ Linting passed
☑ Lighthouse CI passed
☑ Code review approved
☑ No breaking changes
```

---

## Troubleshooting

### Lighthouse CI Not Running

**Problem**: Workflow doesn't trigger

**Check**:
1. File is at `.github/workflows/lighthouse-ci.yml`
2. Syntax is valid (no YAML errors)
3. Event trigger is correct (push, pull_request)
4. Branch matches (main, develop)

**Fix**:
```bash
# Validate YAML
cat .github/workflows/lighthouse-ci.yml | yamllint -

# Check workflow file permissions
ls -la .github/workflows/lighthouse-ci.yml
```

### Performance Score Too Low

**Problem**: Audit returns < 85 score

**Common causes**:
1. Large JavaScript bundle (code splitting)
2. Unoptimized images (use WebP)
3. Render-blocking resources (defer/async)
4. Slow server response (TTFB)
5. Heavy third-party scripts (defer)

**Diagnose**:
```bash
lhci collect --url=http://localhost:5173
# Check .lighthouseci/lhr.json for "diagnostics"
```

### Build Fails When Running Audits

**Problem**: "Failed to launch Chrome" or timeout

**Solutions**:
```bash
# 1. Ensure Chrome/Chromium is installed
sudo apt-get install chromium-browser

# 2. Check Chrome path in .lighthouserc.json
"chromePath": "/usr/bin/chromium-browser"

# 3. Allow more time for build
"timeout": 60000  # 60 seconds

# 4. Run single audit instead of 3
"numberOfRuns": 1
```

### Results Inconsistent Between Runs

**Problem**: Scores vary (e.g., 85, 92, 87)

**Why**: Network variance, CPU throttling, random factors

**Solution**:
- Lighthouse CI takes **median of 3 runs**
- This smooths out variance
- Use budget assertions (e.g., 85 minimum acceptable)

### GitHub Action Not Commenting on PR

**Problem**: No comment appears on PR

**Check**:
1. Workflow has `github.event_name == 'pull_request'` condition
2. `GITHUB_TOKEN` is available (auto-provided)
3. Results file exists (`.lighthouseci/lhr.json`)
4. Script has correct `issue_number` and `context`

**Debug**:
```yaml
- name: Debug
  run: |
    echo "Event: ${{ github.event_name }}"
    echo "Issue: ${{ github.event.pull_request.number }}"
    ls -la .lighthouseci/
```

---

## Best Practices

✅ **DO**:
- Run Lighthouse locally before pushing
- Address performance regressions immediately
- Code split and lazy load routes
- Optimize images to WebP format
- Preload critical resources
- Monitor performance trends
- Set realistic budgets for page complexity
- Defer non-critical third-party scripts

❌ **DON'T**:
- Ignore performance warnings
- Add heavy dependencies without evaluating
- Load large bundles synchronously
- Use unoptimized images
- Whitelist performance failures without fixing
- Assume desktop performance = mobile performance
- Disable audits arbitrarily
- Commit large assets directly (use CDN)

---

## Performance Metrics Over Time

### Baseline Establishment

**First run** (establish baseline):
```bash
# Run audit on stable version
lhci autorun

# Commit baseline
git add .lighthouseci/ && git commit -m "perf: establish baseline"
```

### Tracking Regressions

The workflow compares new audits against previous runs:

```
Comparison (this PR vs main branch):
Performance: 88/100  (↓3 from baseline)
├── Main thread blocking: +50ms
├── LCP: +200ms
└── Script evaluation: +100ms

⚠️ Regression detected!
```

### Monitoring Trends

Store results for historical tracking:

```bash
# Export metrics to database
lhci upload --target=temporary-public-storage

# Or send to monitoring service
curl https://your-monitoring.com/metrics \
  -d @.lighthouseci/lhr.json
```

---

## Advanced Configuration

### Custom Assertions

```json
{
  "assert": {
    "custom:web-vitals": ["error", {
      "assertions": {
        "largest-contentful-paint": { "maxNumericValue": 2500 },
        "cumulative-layout-shift": { "maxNumericValue": 0.1 },
        "interaction-to-next-paint": { "maxNumericValue": 200 }
      }
    }]
  }
}
```

### Different Audits Per Page

```json
{
  "collect": {
    "url": [
      {
        "url": "http://localhost:5173",
        "settings": { "throttleMethod": "simulate" }
      },
      {
        "url": "http://localhost:5173/marketplace",
        "settings": { "throttleMethod": "devtools" }
      }
    ]
  }
}
```

### Upload Results to Server

```json
{
  "upload": {
    "target": "lhci",
    "serverBaseUrl": "https://lhci.example.com",
    "token": "$LHCI_GITHUB_APP_TOKEN"
  }
}
```

---

## Resources

- **Lighthouse Docs**: https://developers.google.com/web/tools/lighthouse
- **Web Vitals Guide**: https://web.dev/vitals
- **Lighthouse CI**: https://github.com/GoogleChrome/lighthouse-ci
- **Performance Best Practices**: https://web.dev/performance
- **Images Guide**: https://web.dev/images
- **JavaScript Guide**: https://web.dev/javascript

---

## Next Steps

1. ✅ Install Lighthouse CI locally
2. ✅ Build frontend
3. ✅ Run audits to establish baseline
4. ✅ Review results and identify slow pages
5. 📋 Optimize images (use WebP)
6. 📋 Implement code splitting by route
7. 📋 Add lazy loading to heavy components
8. 📋 Monitor performance dashboard
9. 📋 Set up performance budgets for CI/CD

---

## Integration Checklist

- [ ] Install `@lhci/cli@0.12.x` globally
- [ ] Copy `.lighthouserc.json` to project root
- [ ] Copy `lighthouse-ci.yml` to `.github/workflows/`
- [ ] Run `npm run build && lhci autorun` locally
- [ ] Review initial performance report
- [ ] Identify optimization opportunities
- [ ] Create performance budgets in `.lighthouserc-budgets.json`
- [ ] Commit baseline results
- [ ] Test workflow on next PR
- [ ] Share results with team
- [ ] Set up performance monitoring dashboard

---

**Status**: ✅ COMPLETE
**Next Improvement**: E2E Testing with Playwright
**Effort**: 4 hours complete

---

**Document Version**: 1.0
**Last Updated**: November 18, 2025
**Maintained By**: Development Team
