import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
  retryCount: number;
}

interface ErrorDetails {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: number;
  userAgent: string;
  url: string;
  userId?: string;
}

class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  private retryTimeout?: NodeJS.Timeout;

  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      retryCount: 0 
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { 
      hasError: true, 
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({ error, errorInfo });
    
    // Report error to monitoring service
    this.reportError(error, errorInfo);
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  private reportError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      const errorDetails: ErrorDetails = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: this.getUserId()
      };

      // In production, send to error monitoring service
      if (process.env.NODE_ENV === 'production') {
        await fetch('/api/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            errorId: this.state.errorId,
            ...errorDetails
          })
        });
      }
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  private getUserId = (): string | undefined => {
    // Try to get user ID from various sources
    try {
      // Check localStorage for user data
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.id || user.walletAddress;
      }
      
      // Check for wallet connection
      const walletData = localStorage.getItem('wallet');
      if (walletData) {
        const wallet = JSON.parse(walletData);
        return wallet.publicKey;
      }
    } catch (error) {
      console.warn('Could not extract user ID:', error);
    }
    return undefined;
  };

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: prevState.retryCount + 1
      }));
    } else {
      // Force page reload after max retries
      window.location.reload();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleReportBug = () => {
    const errorDetails = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };

    const bugReportUrl = `mailto:support@nftsol.com?subject=Bug Report - ${this.state.errorId}&body=${encodeURIComponent(JSON.stringify(errorDetails, null, 2))}`;
    window.open(bugReportUrl);
  };

  private getErrorType = (error: Error): string => {
    if (error.name === 'ChunkLoadError') {
      return 'Loading Error';
    }
    if (error.message.includes('Network')) {
      return 'Network Error';
    }
    if (error.message.includes('Wallet')) {
      return 'Wallet Error';
    }
    if (error.message.includes('Transaction')) {
      return 'Transaction Error';
    }
    return 'Application Error';
  };

  private getErrorSuggestions = (error: Error): string[] => {
    const suggestions: string[] = [];
    
    if (error.name === 'ChunkLoadError') {
      suggestions.push('Try refreshing the page');
      suggestions.push('Clear your browser cache');
      suggestions.push('Check your internet connection');
    } else if (error.message.includes('Network')) {
      suggestions.push('Check your internet connection');
      suggestions.push('Try again in a few moments');
      suggestions.push('Check if our servers are online');
    } else if (error.message.includes('Wallet')) {
      suggestions.push('Make sure your wallet is connected');
      suggestions.push('Try reconnecting your wallet');
      suggestions.push('Check if you have enough SOL for transactions');
    } else if (error.message.includes('Transaction')) {
      suggestions.push('Check your wallet balance');
      suggestions.push('Try increasing the transaction fee');
      suggestions.push('Make sure you have enough SOL');
    } else {
      suggestions.push('Try refreshing the page');
      suggestions.push('Clear your browser cache');
      suggestions.push('Contact support if the problem persists');
    }
    
    return suggestions;
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const errorType = this.getErrorType(this.state.error);
      const suggestions = this.getErrorSuggestions(this.state.error);
      const canRetry = this.state.retryCount < this.maxRetries;

      return (
        <motion.div
          className="error-boundary"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="error-container">
            <div className="error-header">
              <motion.div
                className="error-icon"
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 0.5,
                  repeat: Infinity,
                  repeatDelay: 2
                }}
              >
                ⚠️
              </motion.div>
              <h1 className="error-title">
                {errorType}
              </h1>
              <p className="error-subtitle">
                Something went wrong, but don't worry - we're here to help!
              </p>
            </div>

            <div className="error-details">
              <div className="error-message">
                <strong>Error:</strong> {this.state.error.message}
              </div>
              
              {this.state.errorId && (
                <div className="error-id">
                  <strong>Error ID:</strong> {this.state.errorId}
                </div>
              )}

              <div className="error-suggestions">
                <h3>Try these solutions:</h3>
                <ul>
                  {suggestions.map((suggestion, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      {suggestion}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="error-actions">
              {canRetry && (
                <motion.button
                  className="error-btn primary"
                  onClick={this.handleRetry}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  🔄 Try Again ({this.maxRetries - this.state.retryCount} attempts left)
                </motion.button>
              )}
              
              <motion.button
                className="error-btn secondary"
                onClick={this.handleReload}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🔄 Refresh Page
              </motion.button>
              
              <motion.button
                className="error-btn tertiary"
                onClick={this.handleReportBug}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🐛 Report Bug
              </motion.button>
            </div>

            <div className="error-footer">
              <p>
                If this problem continues, please contact our support team with the Error ID above.
              </p>
              <div className="support-links">
                <a href="mailto:support@nftsol.com">📧 Email Support</a>
                <a href="https://discord.gg/nftsol" target="_blank" rel="noopener noreferrer">
                  💬 Discord
                </a>
                <a href="https://twitter.com/NFTSolMarket" target="_blank" rel="noopener noreferrer">
                  🐦 Twitter
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;