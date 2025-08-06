
import { useEffect } from 'react';

export default function PerformanceMonitor() {
  useEffect(() => {
    // Monitor performance on mobile devices
    if ('performance' in window && 'navigation' in performance) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            if (navEntry.loadEventEnd - navEntry.navigationStart > 3000) {
              console.warn('Slow page load detected:', navEntry.loadEventEnd - navEntry.navigationStart, 'ms');
            }
          }
        });
      });
      
      observer.observe({ entryTypes: ['navigation'] });
      
      // Cleanup
      return () => observer.disconnect();
    }
    
    // Preload critical resources
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = '/api/nfts/featured';
    link.as = 'fetch';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
    
    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, []);

  return null;
}
