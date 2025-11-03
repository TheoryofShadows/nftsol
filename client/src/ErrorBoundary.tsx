import React from 'react';
import './styles/ErrorBoundary.css';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

interface ErrorBoundaryState {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  hasError: boolean;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      error: null,
      errorInfo: null,
      hasError: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error details in development
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Store error info in state
    this.setState({
      errorInfo,
    });

    // In production, send to error tracking service
    if (import.meta.env.PROD) {
      // TODO: Send to Sentry, LogRocket, or your error tracking service
      // Example: Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
    }
  }

  resetError = (): void => {
    this.setState({
      error: null,
      errorInfo: null,
      hasError: false,
    });
  };

  render(): React.ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback: FallbackComponent } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (FallbackComponent) {
        return <FallbackComponent error={error} resetError={this.resetError} />;
      }

      // Default fallback UI
      const isDevelopment = import.meta.env.DEV;

      return (
        <div className="error-boundary-container">
          <div className="error-boundary-card">
            <div className="error-boundary-icon">⚠️</div>
            <h2 className="error-boundary-title">
              Something went wrong
            </h2>
            <p className="error-boundary-message">
              We&apos;re sorry, but something unexpected happened. Please try again or contact support
              if the problem persists.
            </p>

            <div className="error-boundary-actions">
              <button
                onClick={this.resetError}
                className="error-boundary-btn-primary"
              >
                Try Again
              </button>

              <button
                onClick={() => window.location.reload()}
                className="error-boundary-btn-secondary"
              >
                Reload Page
              </button>
            </div>

            {isDevelopment && error && (
              <details className="error-boundary-details">
                <summary className="error-boundary-summary">
                  🔍 Technical Details (Development Only)
                </summary>
                <div className="error-boundary-tech-details">
                  <p className="error-boundary-error-name">
                    {error.name}: {error.message}
                  </p>
                  <pre className="error-boundary-stack">
                    {error.stack || 'No stack trace available'}
                  </pre>
                  {this.state.errorInfo && (
                    <>
                      <p className="error-boundary-stack-label">Component Stack:</p>
                      <pre className="error-boundary-stack">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return children;
  }
}
