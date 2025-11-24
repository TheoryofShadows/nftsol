/**
 * Mobile-Friendly Error Boundary
 * Better error handling for mobile devices
 *
 * DISABLED: Component not currently used
 * @ts-nocheck
 */

import React from 'react';
import { getMobileFriendlyError } from '../utils/mobileErrorHandler';

interface MobileErrorBoundaryProps {
  children: React.ReactNode;
}

interface MobileErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  mobileError: ReturnType<typeof getMobileFriendlyError> | null;
}

export default class MobileErrorBoundary extends React.Component<
  MobileErrorBoundaryProps,
  MobileErrorBoundaryState
> {
  constructor(props: MobileErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      mobileError: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<MobileErrorBoundaryState> {
    return {
      hasError: true,
      error,
      mobileError: getMobileFriendlyError(error),
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error
    if (import.meta.env.DEV) {
      console.error('MobileErrorBoundary caught error:', error, errorInfo);
    }

    // Send to Sentry if available
    if (import.meta.env.VITE_SENTRY_DSN) {
      import('@sentry/react').then((Sentry) => {
        Sentry.captureException(error, {
          contexts: {
            react: {
              componentStack: errorInfo.componentStack,
            },
          },
          tags: {
            mobile: true,
            errorBoundary: true,
          },
        });
      }).catch(() => {
        // Sentry not available
      });
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      mobileError: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError && this.state.mobileError) {
      const { mobileError } = this.state;

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20">
          <div className="glass-modern rounded-2xl p-6 max-w-md w-full text-center">
            <div className="text-6xl mb-4">{mobileError.code === 'OFFLINE' ? '📡' : '⚠️'}</div>
            <h2 className="text-2xl font-bold text-white mb-2">Oops!</h2>
            <p className="text-gray-300 mb-6">{mobileError.userMessage}</p>

            <div className="flex flex-col gap-3">
              {mobileError.retryable && (
                <button
                  onClick={this.handleRetry}
                  className="btn-modern bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-xl font-semibold transition-colors"
                >
                  Try Again
                </button>
              )}
              
              <button
                onClick={this.handleReload}
                className="btn-modern bg-gray-700 hover:bg-gray-600 text-white py-3 px-6 rounded-xl font-semibold transition-colors"
              >
                Reload Page
              </button>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-gray-400 text-sm cursor-pointer mb-2">
                  Technical Details (Dev Only)
                </summary>
                <pre className="text-xs text-gray-500 bg-gray-900/50 p-3 rounded overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

