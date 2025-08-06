// Polyfills for Node.js modules in browser environment
import { Buffer } from 'buffer';

// Make Buffer globally available
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
  window.global = window;
}

// Export for explicit imports
export { Buffer };