/**
 * Mobile Error Handler
 * Better error handling and user feedback for mobile devices
 */

export interface MobileError {
  message: string;
  code?: string;
  retryable?: boolean;
  userMessage: string;
}

export function getMobileFriendlyError(error: any): MobileError {
  // Network errors
  if (!navigator.onLine) {
    return {
      message: 'No internet connection',
      code: 'OFFLINE',
      retryable: true,
      userMessage: '📡 No internet connection. Please check your Wi-Fi or mobile data.',
    };
  }

  // Fetch errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      message: error.message,
      code: 'NETWORK_ERROR',
      retryable: true,
      userMessage: '🌐 Unable to connect to server. Please check your connection and try again.',
    };
  }

  // Timeout errors
  if (error?.name === 'AbortError' || error?.message?.includes('timeout')) {
    return {
      message: error.message || 'Request timeout',
      code: 'TIMEOUT',
      retryable: true,
      userMessage: '⏱️ Request took too long. Please try again.',
    };
  }

  // HTTP errors
  if (error?.status || error?.statusCode) {
    const status = error.status || error.statusCode;
    if (status === 404) {
      return {
        message: error.message || 'Not found',
        code: 'NOT_FOUND',
        retryable: false,
        userMessage: '🔍 Page or resource not found. Please check the URL.',
      };
    }
    if (status === 500) {
      return {
        message: error.message || 'Server error',
        code: 'SERVER_ERROR',
        retryable: true,
        userMessage: '⚠️ Server error. Please try again in a moment.',
      };
    }
    if (status >= 400 && status < 500) {
      return {
        message: error.message || 'Client error',
        code: 'CLIENT_ERROR',
        retryable: false,
        userMessage: '❌ Invalid request. Please check your input and try again.',
      };
    }
  }

  // CORS errors
  if (error?.message?.includes('CORS') || error?.message?.includes('cross-origin')) {
    return {
      message: error.message,
      code: 'CORS_ERROR',
      retryable: false,
      userMessage: '🔒 Connection blocked. Please contact support if this persists.',
    };
  }

  // Generic error
  return {
    message: error?.message || 'Unknown error',
    code: 'UNKNOWN',
    retryable: true,
    userMessage: error?.message || 'Something went wrong. Please try again.',
  };
}

export function isRetryableError(error: any): boolean {
  const mobileError = getMobileFriendlyError(error);
  return mobileError.retryable ?? true;
}

export function logMobileError(error: any, context?: string) {
  const mobileError = getMobileFriendlyError(error);
  
  if (import.meta.env.DEV) {
    console.error('Mobile Error:', {
      context,
      original: error,
      mobile: mobileError,
    });
  }

  // Send to Sentry if available
  if (import.meta.env.VITE_SENTRY_DSN) {
    import('@sentry/react').then((Sentry) => {
      Sentry.captureException(error, {
        tags: {
          mobile: true,
          errorCode: mobileError.code,
          retryable: mobileError.retryable,
        },
        extra: {
          context,
          mobileError,
        },
      });
    }).catch(() => {
      // Sentry not available
    });
  }
}

