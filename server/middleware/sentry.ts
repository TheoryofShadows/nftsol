/**
 * Sentry Error Tracking
 * Full Sentry integration for error tracking and performance monitoring
 */

import { envConfig } from '@shared/config/environment';
import { logger } from '@shared/utils/logger';

// Lazy import Sentry to avoid errors if not installed
let Sentry: any = null;
try {
  Sentry = require('@sentry/node');
} catch (error) {
  // Sentry not installed, will use fallback
}

export function initializeSentry() {
  if (!Sentry) {
    logger.warn('Sentry not installed, error tracking disabled');
    return;
  }

  const dsn = process.env.SENTRY_DSN;
  
  if (!dsn) {
    logger.warn('Sentry DSN not configured, error tracking disabled');
    return;
  }

  try {
    Sentry.init({
    dsn,
    environment: envConfig.nodeEnv,
    tracesSampleRate: envConfig.isProduction ? 0.1 : 1.0, // 10% in prod, 100% in dev
    profilesSampleRate: envConfig.isProduction ? 0.1 : 1.0,
    
    // Performance monitoring
    integrations: [
      // Enable HTTP instrumentation
      new Sentry.Integrations.Http({ tracing: true }),
      // Enable Express instrumentation
      new Sentry.Integrations.Express({ app: undefined as any }),
    ],

    // Ignore common errors
    ignoreErrors: [
      'NetworkError',
      'AbortError',
      'ResizeObserver loop limit exceeded',
    ],

    // Before send hook
    beforeSend(event, hint) {
      // Filter out non-critical errors in production
      if (envConfig.isProduction) {
        const error = hint.originalException;
        if (error instanceof Error) {
          // Don't send validation errors to Sentry
          if (error.message.includes('validation') || error.message.includes('Validation')) {
            return null;
          }
        }
      }
      return event;
    },
    });

    logger.info('Sentry initialized', { environment: envConfig.nodeEnv });
  } catch (error) {
    logger.warn('Failed to initialize Sentry', error);
  }
}

// Request handler for Express
export const sentryRequestHandler = Sentry 
  ? Sentry.Handlers.requestHandler()
  : (req: any, res: any, next: any) => next();

// Tracing handler for performance monitoring
export const sentryTracingHandler = Sentry
  ? Sentry.Handlers.tracingHandler()
  : (req: any, res: any, next: any) => next();

// Error handler
export const sentryErrorHandler = Sentry
  ? Sentry.Handlers.errorHandler({
      shouldHandleError(error: any) {
        // Only send critical errors in production
        if (envConfig.isProduction) {
          return error.statusCode >= 500;
        }
        return true;
      },
    })
  : (err: any, req: any, res: any, next: any) => next(err);

