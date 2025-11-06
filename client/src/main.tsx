import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@solana/wallet-adapter-react-ui/styles.css';
import './styles/tailwind.css';
import './styles/solana.css';
import './styles/design-system.css';
import './styles/mobile-fixes.css';
import './styles/modern-design.css';
import './styles/onboarding.css';
import './styles/wallet-adapter-fixes.css';
import './styles/shared-utilities.css';
import { Buffer } from 'buffer';
import { initAnalytics } from './utils/analytics';
import { QueryProvider } from './lib/react-query.tsx';

// Polyfill Buffer for browser
interface WindowWithBuffer extends Window {
  Buffer: typeof Buffer;
  global: typeof window;
}

if (typeof window !== 'undefined') {
  const windowWithBuffer = window as unknown as WindowWithBuffer;
  windowWithBuffer.Buffer = Buffer;
  windowWithBuffer.global = window;
}

// Performance monitoring (reserved for future use)
// const startTime = performance.now();

// Error handling for unhandled promises
window.addEventListener('unhandledrejection', (event) => {
  const error = event.reason;
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.error('Unhandled promise rejection:', error);
  }
  
  // Log error details for debugging
  if (error?.message || error?.stack) {
    // Could send to error tracking service here
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      });
    }
  }
  
  // Prevent default error handling
  event.preventDefault();
});

// Error handling for uncaught errors
window.addEventListener('error', (event) => {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.error('Uncaught error:', event.error);
    // eslint-disable-next-line no-console
    console.error('Error message:', event.message);
    // eslint-disable-next-line no-console
    console.error('Error source:', event.filename, 'line', event.lineno);
  }
  
  // Could send to error tracking service here
  // In production, might want to show user-friendly error message
});

// Initialize Google Analytics
if (import.meta.env.VITE_GA_TRACKING_ID) {
  initAnalytics(import.meta.env.VITE_GA_TRACKING_ID);
}

// Hide wallet adapter warning messages on mobile
if (typeof window !== 'undefined') {
  const hideWalletWarnings = () => {
    // Find and hide any elements containing wallet warning text
    const allElements = document.querySelectorAll('*');
    allElements.forEach((el) => {
      const text = el.textContent || '';
      if (
        text.includes('No Solana wallets detected') ||
        text.includes('Please install Phantom') ||
        text.includes('Please install Solflare') ||
        (text.includes('No Solana') && text.includes('wallet'))
      ) {
        // Check if it's a warning/alert element (not the actual wallet button)
        const isWarning = el.classList.toString().includes('alert') ||
                         el.classList.toString().includes('warning') ||
                         el.getAttribute('role') === 'alert' ||
                         (el as HTMLElement).style.backgroundColor?.includes('yellow') ||
                         (el as HTMLElement).style.backgroundColor?.includes('#FF');
        
        if (isWarning || el.tagName === 'DIV' || el.tagName === 'P') {
          (el as HTMLElement).style.display = 'none';
        }
      }
    });
  };

  // Run on load and after a short delay (for dynamic content)
  hideWalletWarnings();
  setTimeout(hideWalletWarnings, 500);
  setTimeout(hideWalletWarnings, 2000);

  // Watch for dynamically added elements
  const observer = new MutationObserver(() => {
    hideWalletWarnings();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Create root and render
const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <QueryProvider>
      <App />
    </QueryProvider>
  </React.StrictMode>
);

// Performance monitoring complete
