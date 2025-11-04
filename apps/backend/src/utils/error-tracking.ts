/**
 * Error Tracking Utility
 * Sends errors to tracking service if configured
 */

const ERROR_TRACKING_URL = process.env.ERROR_TRACKING_URL || process.env.SENTRY_DSN;

interface ErrorContext {
  endpoint?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  [key: string]: any;
}

export async function trackError(error: Error, context: ErrorContext = {}) {
  if (!ERROR_TRACKING_URL) {
    // No error tracking configured
    return;
  }

  try {
    // If it's a Sentry DSN, use Sentry SDK
    if (ERROR_TRACKING_URL.startsWith('https://') && ERROR_TRACKING_URL.includes('sentry.io')) {
      // Sentry would be initialized elsewhere
      // This is just a placeholder for manual tracking
      await fetch(ERROR_TRACKING_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          context,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {
        // Silently fail - don't break app if tracking fails
      });
    } else {
      // Custom error tracking endpoint
      await fetch(ERROR_TRACKING_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name,
          },
          context,
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'development',
        }),
      }).catch(() => {
        // Silently fail
      });
    }
  } catch (e) {
    // Silently fail - error tracking should never break the app
  }
}

export function trackErrorSync(error: Error, context: ErrorContext = {}) {
  // Fire and forget - don't await
  trackError(error, context).catch(() => {
    // Ignore
  });
}

