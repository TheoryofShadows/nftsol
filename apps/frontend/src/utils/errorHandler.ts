export interface ErrorInfo {
  message: string;
  code?: string;
  details?: any;
  timestamp: number;
  userAgent: string;
  url: string;
}

export class NFTSolError extends Error {
  public code: string;
  public details: any;
  public timestamp: number;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', details?: any) {
    super(message);
    this.name = 'NFTSolError';
    this.code = code;
    this.details = details;
    this.timestamp = Date.now();
  }
}

export class WalletError extends NFTSolError {
  constructor(message: string, details?: any) {
    super(message, 'WALLET_ERROR', details);
    this.name = 'WalletError';
  }
}

export class APIError extends NFTSolError {
  constructor(message: string, details?: any) {
    super(message, 'API_ERROR', details);
    this.name = 'APIError';
  }
}

export class NetworkError extends NFTSolError {
  constructor(message: string, details?: any) {
    super(message, 'NETWORK_ERROR', details);
    this.name = 'NetworkError';
  }
}

export function createErrorInfo(error: Error, additionalInfo?: any): ErrorInfo {
  return {
    message: error.message,
    code: (error as any).code || 'UNKNOWN',
    details: {
      ...additionalInfo,
      stack: error.stack,
      name: error.name
    },
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
    url: window.location.href
  };
}

export function logError(error: Error, context?: string): void {
  const errorInfo = createErrorInfo(error, { context });
  
  console.error(`🚨 NFTSol Error${context ? ` in ${context}` : ''}:`, errorInfo);
  
  // In production, you might want to send this to an error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Example: send to error tracking service
    // errorTrackingService.captureException(error, errorInfo);
  }
}

export function handleWalletError(error: any): string {
  if (error.code === 4001) {
    return 'User rejected the request';
  } else if (error.code === -32002) {
    return 'Wallet is already processing a request';
  } else if (error.code === -32603) {
    return 'Internal wallet error';
  } else if (error.message?.includes('User rejected')) {
    return 'Transaction was cancelled by user';
  } else if (error.message?.includes('Insufficient funds')) {
    return 'Insufficient SOL balance for transaction';
  } else if (error.message?.includes('Network')) {
    return 'Network connection error. Please check your internet connection.';
  } else {
    return error.message || 'An unexpected wallet error occurred';
  }
}

export function handleAPIError(error: any): string {
  if (error.status === 401) {
    return 'Authentication required. Please connect your wallet.';
  } else if (error.status === 403) {
    return 'Access denied. You do not have permission for this action.';
  } else if (error.status === 404) {
    return 'The requested resource was not found.';
  } else if (error.status === 429) {
    return 'Too many requests. Please wait a moment and try again.';
  } else if (error.status >= 500) {
    return 'Server error. Please try again later.';
  } else if (error.message?.includes('Network')) {
    return 'Network error. Please check your connection.';
  } else {
    return error.message || 'An unexpected error occurred';
  }
}

export function handleNetworkError(error: any): string {
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return 'Network connection failed. Please check your internet connection.';
  } else if (error.name === 'AbortError') {
    return 'Request was cancelled due to timeout.';
  } else {
    return 'Network error. Please check your connection and try again.';
  }
}

export function getErrorMessage(error: any): string {
  if (error instanceof WalletError) {
    return handleWalletError(error);
  } else if (error instanceof APIError) {
    return handleAPIError(error);
  } else if (error instanceof NetworkError) {
    return handleNetworkError(error);
  } else if (error instanceof NFTSolError) {
    return error.message;
  } else {
    // Generic error handling
    if (error.message?.includes('wallet')) {
      return handleWalletError(error);
    } else if (error.message?.includes('fetch') || error.message?.includes('network')) {
      return handleNetworkError(error);
    } else {
      return error.message || 'An unexpected error occurred';
    }
  }
}
