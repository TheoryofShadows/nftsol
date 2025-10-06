import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import "./index.css";

// Buffer polyfill for browser compatibility
import { Buffer } from 'buffer';
if (typeof window !== 'undefined' && !(window as any).Buffer) {
  (window as any).Buffer = Buffer;
}

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Application Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="text-gray-400 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Enhanced Query Client with better error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error && 'status' in error && (error.status as number) >= 400 && (error.status as number) < 500) {
          return false;
        }
        return failureCount < 1; // Reduced retries for faster response
      },
      staleTime: 1000 * 60 * 10, // 10 minutes - longer cache
      gcTime: 1000 * 60 * 15, // 15 minutes - garbage collection window
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false, // Disable auto-refetch for better performance
    },
    mutations: {
      retry: 0, // No retries for mutations
    },
  },
});

// Optimized mobile viewport handling
function setViewportHeight() {
  try {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  } catch (error) {
    console.warn('Viewport height setting failed:', error);
  }
}

// Debounced resize handler
let resizeTimeout: NodeJS.Timeout;
function handleResize() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(setViewportHeight, 150);
}

// Set initial viewport height
setViewportHeight();

// Add optimized event listeners
window.addEventListener('resize', handleResize, { passive: true });
window.addEventListener('orientationchange', () => {
  setTimeout(setViewportHeight, 100);
}, { passive: true });

// Cleanup function for development
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    window.removeEventListener('resize', handleResize);
    clearTimeout(resizeTimeout);
  });
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </ErrorBoundary>
);

