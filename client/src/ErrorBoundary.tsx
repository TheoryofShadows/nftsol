import React from 'react';

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { error: undefined };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(err: Error, errorInfo: React.ErrorInfo) {
    // Log error details in development only
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('App crash:', err, errorInfo);
    }
    // In production, could send to error tracking service (e.g., Sentry)
  }
  render() {
    if (this.state.error) {
      // In production, hide technical error details from users
      const isDevelopment = import.meta.env.DEV;

      return (
        <div
          style={{
            padding: 32,
            fontFamily: 'system-ui',
            textAlign: 'center',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              padding: 32,
              borderRadius: 16,
              maxWidth: 600,
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            }}
          >
            <h2 style={{ fontSize: 24, marginBottom: 16, color: '#333' }}>
              ⚠️ Something went wrong
            </h2>
            <p style={{ fontSize: 16, color: '#666', marginBottom: 24 }}>
              We&apos;re sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#667eea',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: 8,
                fontSize: 16,
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Refresh Page
            </button>
            {isDevelopment && (
              <details style={{ marginTop: 24, textAlign: 'left' }}>
                <summary style={{ cursor: 'pointer', color: '#667eea', marginBottom: 8 }}>
                  Technical Details (Development Only)
                </summary>
                <pre
                  style={{
                    background: '#f5f5f5',
                    padding: 16,
                    borderRadius: 8,
                    overflow: 'auto',
                    fontSize: 12,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {String(this.state.error.stack || this.state.error.message || this.state.error)}
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
