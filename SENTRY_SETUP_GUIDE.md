# Sentry Error Tracking Setup for NFTSol

**Date:** November 17, 2025
**Status:** Implementation Guide Ready
**Time to Complete:** ~2 hours

---

## Overview

This guide will help you set up Sentry error tracking for both the NFTSol backend and frontend. Your organization token is already configured.

**What Sentry Does:**
- Captures all application errors in real-time
- Sends instant alerts for critical issues
- Tracks error trends and patterns
- Provides detailed stack traces with source maps
- Monitors performance and Web Vitals
- Creates issues for error grouping and tracking

---

## Your Sentry Organization

**Organization:** nftsol
**Organization Token:** `sntrys_[YOUR_TOKEN_HERE]` (See Sentry dashboard for your actual token)

**Next Steps:**
1. Go to https://sentry.io/organizations/nftsol/projects/
2. Create two projects:
   - NFTSol Backend (Node.js)
   - NFTSol Frontend (React)
3. Copy the DSN for each project

---

## Backend Setup (Node.js/Express)

### Step 1: Packages Already Installed

```bash
# Already installed in apps/backend:
npm install @sentry/node @sentry/integrations --save
```

### Step 2: Create Sentry Config File

Create `apps/backend/src/lib/sentry.ts`:

```typescript
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { appConfig } from '../config/index';

// Only initialize if DSN is provided
export function initializeSentry() {
  if (!process.env.SENTRY_DSN) {
    console.warn('⚠️  SENTRY_DSN not configured - error tracking disabled');
    return false;
  }

  Sentry.init({
    // DSN from your Sentry project
    dsn: process.env.SENTRY_DSN,

    // Set the environment (development, staging, production)
    environment: appConfig.nodeEnv,

    // Sample 100% of transactions for development, 10% for production
    tracesSampleRate: appConfig.nodeEnv === 'production' ? 0.1 : 1.0,

    // Release tracking for better error grouping
    release: process.env.APP_VERSION || '1.0.0',

    // Server name for identifying the source server
    serverName: process.env.SERVER_NAME || 'nftsol-backend',

    // Integrations for error handling
    integrations: [
      nodeProfilingIntegration(),
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.OnUncaughtException(),
      new Sentry.Integrations.OnUnhandledRejection(),
    ],

    // Capture performance metrics
    beforeSend(event) {
      // Filter out sensitive information
      if (event.request) {
        // Remove sensitive headers
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }

      if (event.contexts?.client) {
        delete event.contexts.client.ip_address;
      }

      return event;
    },
  });

  console.log('✅ Sentry initialized for error tracking');
  return true;
}

export { Sentry };
```

### Step 3: Update Backend index.ts

Add to the top of `apps/backend/src/index.ts` (after imports, before creating app):

```typescript
// Add these imports
import { initializeSentry, Sentry } from './lib/sentry';

// Initialize Sentry early
initializeSentry();

const app = express();

// Add Sentry middleware right after creating the Express app
// This must be before other middleware
app.use(Sentry.Handlers.requestHandler());

// ... rest of your middleware ...

// Add Sentry error handler at the END of your routes (before server.listen)
// This must be the last error middleware
app.use(Sentry.Handlers.errorHandler());

// Error handling middleware should be last
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Unhandled error:', err);

  // Capture to Sentry
  Sentry.captureException(err);

  res.status(500).json({
    success: false,
    error: {
      message: process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
    },
  });
});
```

### Step 4: Add Environment Variables

Add to `apps/backend/.env`:

```env
# Sentry Configuration
SENTRY_DSN=YOUR_BACKEND_PROJECT_DSN
APP_VERSION=1.0.0
SERVER_NAME=nftsol-backend-dev
```

### Step 5: Test Backend Error Capture

Create a test endpoint to verify Sentry is working:

```typescript
// Add this test route to apps/backend/src/index.ts
app.get('/api/test-sentry-error', (req, res) => {
  try {
    throw new Error('Test error from Sentry');
  } catch (error) {
    Sentry.captureException(error);
    res.status(500).json({
      success: false,
      error: { message: 'Test error sent to Sentry' },
    });
  }
});
```

---

## Frontend Setup (React)

### Step 1: Packages Already Installed

```bash
# Already installed in client:
npm install @sentry/react @sentry/tracing --save
```

### Step 2: Create Sentry Config File

Create `client/src/lib/sentry.ts`:

```typescript
import * as Sentry from '@sentry/react';
import { useLocation, useNavigationType, createRoutesFromChildren, matchRoutes } from 'react-router-dom';

export function initializeSentryReact() {
  if (!import.meta.env.VITE_SENTRY_DSN) {
    console.warn('⚠️  VITE_SENTRY_DSN not configured - error tracking disabled');
    return;
  }

  Sentry.init({
    // DSN from your Sentry project
    dsn: import.meta.env.VITE_SENTRY_DSN,

    // Environment
    environment: import.meta.env.MODE,

    // Release version
    release: import.meta.env.VITE_APP_VERSION || '1.0.0',

    // Sample rate for transactions
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,

    // Integrations
    integrations: [
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Session replay sampling
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });

  console.log('✅ Sentry React initialized');
}

// Router integration (if using React Router)
export function useSentryRouting() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const routeMatch = matchRoutes(createRoutesFromChildren([]), location);

  // Capture route changes
  Sentry.captureMessage(`Navigation to ${location.pathname}`, 'info');
}
```

### Step 3: Update Frontend main.tsx

Update `client/src/main.tsx`:

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Import Sentry
import { initializeSentryReact } from './lib/sentry'

// Initialize Sentry first, before rendering
initializeSentryReact()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### Step 4: Add Environment Variables

Add to `client/.env` and `client/.env.production`:

```env
# Sentry Configuration
VITE_SENTRY_DSN=YOUR_FRONTEND_PROJECT_DSN
VITE_APP_VERSION=1.0.0
```

### Step 5: Update App.tsx for Error Boundary

Wrap your main App component with Sentry's ErrorBoundary:

```typescript
import * as Sentry from '@sentry/react';

// At the end of App.tsx, export with ErrorBoundary
const SentryErrorBoundary = Sentry.withErrorBoundary(App, {
  fallback: <h1>An error has occurred and has been reported to Sentry</h1>,
  showDialog: true,
  dialogOptions: {
    title: 'It looks like we\'re having issues.',
    subtitle: 'Our team has been notified.',
    subtitle2: 'If you\'d like to help, tell us what happened below.',
    labelComments: 'What happened?',
    labelClose: 'Close',
    labelSubmit: 'Submit',
    onClose: () => { /* no-op */ },
    onSubmit: () => { /* no-op */ },
  },
});

export default SentryErrorBoundary;
```

### Step 6: Test Frontend Error Capture

Add a test component that throws an error:

```typescript
// Create client/src/components/TestSentryError.tsx
import React from 'react';
import * as Sentry from '@sentry/react';

export const TestSentryError: React.FC = () => {
  const handleTestError = () => {
    try {
      throw new Error('Test error from React component');
    } catch (error) {
      Sentry.captureException(error);
      alert('Test error sent to Sentry');
    }
  };

  return (
    <button onClick={handleTestError}>
      Test Sentry Error
    </button>
  );
};
```

---

## Creating Sentry Projects

### Step 1: Go to Sentry

1. Visit https://sentry.io/auth/login/
2. Log in with your account
3. Go to nftsol organization

### Step 2: Create Backend Project

1. Click "Projects" in the sidebar
2. Click "Create Project"
3. Select **Node.js** as the platform
4. Name it: `nftsol-backend`
5. Create the project
6. Copy the **DSN** (looks like: `https://key@o123456.ingest.sentry.io/123456`)

### Step 3: Create Frontend Project

1. Repeat steps 1-2
2. Select **React** as the platform
3. Name it: `nftsol-frontend`
4. Create the project
5. Copy the **DSN**

---

## Configuration Checklist

### Backend

- [ ] Installed `@sentry/node` and `@sentry/integrations`
- [ ] Created `apps/backend/src/lib/sentry.ts`
- [ ] Updated `apps/backend/src/index.ts` with Sentry middleware
- [ ] Added `SENTRY_DSN` to `apps/backend/.env`
- [ ] Added test error endpoint
- [ ] Tested error capture at `GET /api/test-sentry-error`

### Frontend

- [ ] Installed `@sentry/react` and `@sentry/tracing`
- [ ] Created `client/src/lib/sentry.ts`
- [ ] Updated `client/src/main.tsx` with Sentry initialization
- [ ] Updated `client/src/App.tsx` with ErrorBoundary
- [ ] Added `VITE_SENTRY_DSN` to `client/.env`
- [ ] Created test component
- [ ] Tested error capture in browser console

---

## Testing Sentry Integration

### Backend Test

```bash
# Start backend
cd apps/backend
npm run dev

# In another terminal, test error capture:
curl http://localhost:3001/api/test-sentry-error

# Check Sentry dashboard - you should see the error within seconds
```

### Frontend Test

1. Start frontend: `cd client && npm run dev`
2. Open http://localhost:5173 in your browser
3. Find the test button and click it
4. Check Sentry dashboard for the error

---

## Monitoring Issues

### View Errors in Sentry

1. Go to https://sentry.io/organizations/nftsol/issues/
2. Look for your test errors
3. Click on an error to see:
   - Full stack trace
   - Browser/OS information
   - Request details
   - Source code context
   - Similar errors

### Set Up Alerts

1. Go to Project Settings → Alerts
2. Create alert rule:
   - When: Any error event
   - For: [Your project]
   - Send to: Your email

### Create Sentry Dashboard

1. Go to Dashboards
2. Create custom dashboard to track:
   - Errors per hour
   - Error trends
   - Most common errors
   - Environment breakdown

---

## Production Considerations

### Environment Variables

For production deployment (Render/Netlify), set:

```env
# Backend (Render)
SENTRY_DSN=https://key@o123456.ingest.sentry.io/123456
APP_VERSION=1.0.0
NODE_ENV=production

# Frontend (Netlify)
VITE_SENTRY_DSN=https://key@o123456.ingest.sentry.io/654321
VITE_APP_VERSION=1.0.0
```

### Release Tracking

Set `APP_VERSION` and `VITE_APP_VERSION` to your actual version:

```bash
# Get from package.json version
export APP_VERSION=$(node -e "console.log(require('./package.json').version)")
```

### Source Maps

For production, upload source maps to Sentry for better error reporting:

```bash
# Install Sentry CLI
npm install --save-dev @sentry/cli

# Upload source maps (add to build script)
"sentry-upload": "sentry-cli releases files upload-sourcemaps dist"
```

---

## Troubleshooting

### Errors Not Appearing in Sentry

1. Check DSN is correct in `.env`
2. Check environment variable is being read
3. Check network tab in DevTools for Sentry requests
4. Verify `SENTRY_DSN` is not empty: `echo $SENTRY_DSN`

### Too Many Errors (Noise)

1. Reduce `tracesSampleRate` for production
2. Use `beforeSend` to filter errors
3. Configure error rules in Sentry dashboard
4. Ignore errors from third-party libraries

### Missing Context

1. Ensure middleware is in correct order
2. Add user context for logged-in users
3. Add breadcrumbs for user actions
4. Attach request/response data

---

## Success Metrics

After setup, you should see:

✅ **Within 5 minutes:**
- Errors appearing in Sentry dashboard
- Error details with stack traces
- Environment information

✅ **Within 1 day:**
- Error trends showing
- Multiple errors being grouped
- Alert emails for critical errors

✅ **Within 1 week:**
- Understanding most common errors
- Fixing high-impact bugs
- Monitoring performance improvements

---

## Next Steps

Once Sentry is working:

1. **Monitor in production** - Set up alerts for critical errors
2. **Fix errors** - Prioritize by impact and frequency
3. **Track trends** - Use dashboards to identify patterns
4. **Optimize** - Use performance data to improve
5. **Document** - Create runbooks for common errors

---

## Resources

- **Sentry Docs**: https://docs.sentry.io/
- **Node.js Integration**: https://docs.sentry.io/platforms/node/
- **React Integration**: https://docs.sentry.io/platforms/javascript/guides/react/
- **Best Practices**: https://docs.sentry.io/api/events/best-practices/

---

**Questions?** Check the Sentry docs or review the QUICK_START_MODERNIZATION.md for complete quick wins guide.
