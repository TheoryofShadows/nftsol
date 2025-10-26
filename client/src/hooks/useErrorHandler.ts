import { useState, useCallback } from 'react';
import { ErrorInfo } from '../components/ErrorModal';

interface ErrorContext {
  wallet?: boolean;
  transaction?: boolean;
  network?: boolean;
  userAction?: string;
}

export function useErrorHandler() {
  const [currentError, setCurrentError] = useState<ErrorInfo | null>(null);
  const [errorHistory, setErrorHistory] = useState<ErrorInfo[]>([]);

  const handleError = useCallback((
    error: Error | string,
    context: ErrorContext = {},
    customMessage?: string
  ): void => {
    console.error('Error handled:', error, context);

    let errorInfo: ErrorInfo;

    if (typeof error === 'string') {
      errorInfo = {
        type: 'general',
        title: 'Error',
        message: error,
        retryable: false
      };
    } else {
      // Determine error type based on context and error message
      let type: ErrorInfo['type'] = 'general';
      let title = 'Something went wrong';
      let message = error.message;
      let retryable = false;
      let showTopUp = false;
      let action: string | undefined;
      let errorCode: string | undefined;

      // Wallet-related errors
      if (context.wallet || error.message.includes('wallet') || error.message.includes('Wallet')) {
        type = 'wallet';
        title = 'Wallet Connection Error';
        message = customMessage || 'There was a problem with your wallet connection.';
        retryable = true;
        action = 'Reconnect Wallet';
      }
      // Transaction errors
      else if (context.transaction || error.message.includes('transaction') || error.message.includes('Transaction')) {
        type = 'transaction';
        title = 'Transaction Failed';
        message = customMessage || 'Your transaction could not be completed.';
        retryable = true;
        showTopUp = true;
        
        // Check for specific transaction errors
        if (error.message.includes('insufficient funds') || error.message.includes('Insufficient')) {
          message = 'Insufficient SOL balance for this transaction.';
          showTopUp = true;
        } else if (error.message.includes('rejected') || error.message.includes('cancelled')) {
          message = 'Transaction was cancelled by user.';
          retryable = true;
        } else if (error.message.includes('timeout')) {
          message = 'Transaction timed out. Please try again.';
          retryable = true;
        }
      }
      // Network errors
      else if (context.network || error.message.includes('network') || error.message.includes('Network') || error.message.includes('fetch')) {
        type = 'network';
        title = 'Network Error';
        message = customMessage || 'Unable to connect to our servers. Please check your internet connection.';
        retryable = true;
      }
      // Validation errors
      else if (error.message.includes('validation') || error.message.includes('invalid') || error.message.includes('required')) {
        type = 'validation';
        title = 'Invalid Input';
        message = customMessage || 'Please check your input and try again.';
        retryable = false;
      }
      // Chunk loading errors (code splitting)
      else if (error.name === 'ChunkLoadError') {
        type = 'network';
        title = 'Loading Error';
        message = 'Failed to load application resources. This usually happens after an update.';
        retryable = true;
        action = 'Refresh Page';
      }
      // Solana-specific errors
      else if (error.message.includes('Solana')) {
        type = 'transaction';
        title = 'Solana Network Error';
        message = customMessage || 'There was an issue with the Solana network.';
        retryable = true;
      }
      // RPC errors
      else if (error.message.includes('RPC') || error.message.includes('rpc')) {
        type = 'network';
        title = 'Server Error';
        message = 'Our servers are temporarily unavailable. Please try again in a moment.';
        retryable = true;
      }

      // Extract error code if present
      const errorCodeMatch = error.message.match(/Error (\d+)/i) || error.message.match(/Code: (\d+)/i);
      if (errorCodeMatch) {
        errorCode = errorCodeMatch[1];
      }

      errorInfo = {
        type,
        title,
        message,
        details: error.stack,
        retryable,
        showTopUp,
        action,
        errorCode
      };
    }

    // Add to error history
    setErrorHistory(prev => [errorInfo, ...prev.slice(0, 9)]); // Keep last 10 errors
    setCurrentError(errorInfo);
  }, []);

  const clearError = useCallback(() => {
    setCurrentError(null);
  }, []);

  const retryLastAction = useCallback(async (retryFn: () => Promise<void>) => {
    if (!currentError?.retryable) return;

    try {
      await retryFn();
      clearError();
    } catch (error) {
      // If retry fails, show the new error
      handleError(error as Error, { userAction: 'retry' });
    }
  }, [currentError, clearError, handleError]);

  const getErrorStats = useCallback(() => {
    const stats = {
      total: errorHistory.length,
      byType: {} as Record<string, number>,
      recent: errorHistory.slice(0, 5)
    };

    errorHistory.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
    });

    return stats;
  }, [errorHistory]);

  const clearErrorHistory = useCallback(() => {
    setErrorHistory([]);
  }, []);

  // Auto-clear errors after a delay for non-critical errors
  const autoClearError = useCallback((delay: number = 5000) => {
    if (currentError && !currentError.retryable) {
      setTimeout(() => {
        clearError();
      }, delay);
    }
  }, [currentError, clearError]);

  return {
    currentError,
    errorHistory,
    handleError,
    clearError,
    retryLastAction,
    getErrorStats,
    clearErrorHistory,
    autoClearError
  };
}

// Specific error handlers for common scenarios
export const createWalletErrorHandler = (handleError: (error: Error | string, context?: ErrorContext) => void) => {
  return (error: Error) => {
    if (error.message.includes('User rejected')) {
      handleError(error, { wallet: true });
    } else if (error.message.includes('not installed')) {
      handleError(error, { wallet: true });
    } else if (error.message.includes('locked')) {
      handleError(error, { wallet: true });
    } else {
      handleError(error, { wallet: true });
    }
  };
};

export const createTransactionErrorHandler = (handleError: (error: Error | string, context?: ErrorContext) => void) => {
  return (error: Error) => {
    if (error.message.includes('insufficient funds')) {
      handleError(error, { transaction: true });
    } else if (error.message.includes('rejected')) {
      handleError(error, { transaction: true });
    } else if (error.message.includes('timeout')) {
      handleError(error, { transaction: true });
    } else if (error.message.includes('slippage')) {
      handleError(error, { transaction: true });
    } else {
      handleError(error, { transaction: true });
    }
  };
};

export const createNetworkErrorHandler = (handleError: (error: Error | string, context?: ErrorContext) => void) => {
  return (error: Error) => {
    if (error.message.includes('fetch')) {
      handleError(error, { network: true });
    } else if (error.message.includes('timeout')) {
      handleError(error, { network: true });
    } else if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
      handleError(error, { network: true });
    } else {
      handleError(error, { network: true });
    }
  };
};
