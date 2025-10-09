// Performance utilities for the NFTSol application

/**
 * Debounce function to limit the rate of function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function to limit function calls to once per interval
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Lazy load a component with error boundary
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  retries = 3
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    let attempt = 0;
    while (attempt < retries) {
      try {
        return await componentImport();
      } catch (error) {
        attempt++;
        if (attempt >= retries) {
          throw error;
        }
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    throw new Error('Failed to load component after retries');
  });
}

/**
 * Memory cleanup utility
 */
export function cleanupMemory() {
  try {
    // Clear any cached data
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    
    // Clear session storage items that are no longer needed
    const itemsToClean = ['analytics_initialized', 'temp_data'];
    itemsToClean.forEach(item => {
      sessionStorage.removeItem(item);
    });
    
    // Force garbage collection if available (dev only)
    if (typeof window !== 'undefined' && 'gc' in window && process.env.NODE_ENV === 'development') {
      (window as any).gc();
    }
  } catch (error) {
    console.warn('Memory cleanup failed:', error);
  }
}

/**
 * Performance observer for monitoring
 */
export function initPerformanceMonitoring() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }

  try {
    // Monitor largest contentful paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('LCP:', lastEntry.startTime);
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    // Monitor first input delay
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        console.log('FID:', entry.processingStart - entry.startTime);
      });
    });
    fidObserver.observe({ entryTypes: ['first-input'] });

    // Monitor cumulative layout shift
    const clsObserver = new PerformanceObserver((list) => {
      let clsValue = 0;
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      console.log('CLS:', clsValue);
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  } catch (error) {
    console.warn('Performance monitoring setup failed:', error);
  }
}

/**
 * Image lazy loading utility
 */
export function lazyLoadImage(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Bundle size analyzer (development only)
 */
export function analyzeBundleSize() {
  if (process.env.NODE_ENV !== 'development') return;
  
  const scripts = Array.from(document.querySelectorAll('script[src]'));
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
  
  console.group('Bundle Analysis');
  console.log('Scripts:', scripts.length);
  console.log('Stylesheets:', styles.length);
  
  // Estimate total size (rough approximation)
  let totalSize = 0;
  scripts.forEach((script: any) => {
    if (script.src.includes('chunk')) {
      totalSize += 100; // Rough estimate in KB
    }
  });
  
  console.log('Estimated bundle size:', totalSize, 'KB');
  console.groupEnd();
}

// React import for lazyWithRetry
import React from 'react';