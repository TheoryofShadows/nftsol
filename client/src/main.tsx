import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@solana/wallet-adapter-react-ui/styles.css';
import './styles/solana.css';

// Performance monitoring
const startTime = performance.now();

// Error handling for unhandled promises
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault();
});

// Error handling for uncaught errors
window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error);
});

// Create root and render
const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Performance logging
const endTime = performance.now();
console.log(`App initialized in ${(endTime - startTime).toFixed(2)}ms`);
