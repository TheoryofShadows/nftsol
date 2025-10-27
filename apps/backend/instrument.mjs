// ESM version for modern Node.js
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

// Initialize Sentry only if DSN is provided
if (process.env.SENTRY_DSN) {
  try {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      integrations: [
        nodeProfilingIntegration(),
      ],
      // Performance Monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      environment: process.env.NODE_ENV || 'development',
  
  // Enhanced request data capturing
  beforeSend(event, hint) {
    // Capture full request context
    if (event.request) {
      // Include sensitive data only in development
      if (process.env.NODE_ENV === 'development') {
        event.request.data = hint.originalException?.req?.body;
      }
    }
    return event;
  },

  // Configure what request data to capture
  requestDataIntegrationOptions: {
    include: {
      cookies: false, // Avoid capturing sensitive cookies
      data: process.env.NODE_ENV === 'development', // Only in dev
      headers: ['content-type', 'user-agent', 'x-request-id'],
      ip: true,
      query_string: true,
      url: true,
      user: {
        id: true,
        email: false, // Don't capture email for privacy
      }
    }
    }
  });
  } catch (error) {
    console.warn('Sentry initialization failed:', error.message);
  }
} else {
  console.log('Sentry DSN not provided, monitoring disabled');
}

export default Sentry;