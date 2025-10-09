import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  fcp: number | null;
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  ttfb: number | null;
  bundleSize: number | null;
  loadTime: number | null;
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
    bundleSize: null,
    loadTime: null
  });

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach((entry) => {
        if (entry.entryType === 'paint') {
          if (entry.name === 'first-contentful-paint') {
            setMetrics(prev => ({ ...prev, fcp: entry.startTime }));
          }
        }
        
        if (entry.entryType === 'largest-contentful-paint') {
          setMetrics(prev => ({ ...prev, lcp: entry.startTime }));
        }
        
        if (entry.entryType === 'first-input') {
          setMetrics(prev => ({ ...prev, fid: entry.processingStart - entry.startTime }));
        }
        
        if (entry.entryType === 'layout-shift') {
          const clsEntry = entry as PerformanceEntry & { value: number };
          setMetrics(prev => ({ 
            ...prev, 
            cls: prev.cls ? prev.cls + clsEntry.value : clsEntry.value 
          }));
        }
      });
    });

    // Observe different performance entry types
    try {
      observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] });
    } catch (e) {
      console.warn('Performance Observer not supported');
    }

    // Measure bundle size
    const measureBundleSize = () => {
      const scripts = document.querySelectorAll('script[src]');
      let totalSize = 0;
      
      scripts.forEach(script => {
        const src = script.getAttribute('src');
        if (src && src.includes('assets/')) {
          // Estimate size based on script content
          totalSize += script.textContent?.length || 0;
        }
      });
      
      setMetrics(prev => ({ ...prev, bundleSize: totalSize }));
    };

    // Measure load time
    const measureLoadTime = () => {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      setMetrics(prev => ({ ...prev, loadTime }));
    };

    // Measure TTFB
    const measureTTFB = () => {
      const ttfb = performance.timing.responseStart - performance.timing.navigationStart;
      setMetrics(prev => ({ ...prev, ttfb }));
    };

    // Run measurements after page load
    if (document.readyState === 'complete') {
      measureBundleSize();
      measureLoadTime();
      measureTTFB();
    } else {
      window.addEventListener('load', () => {
        measureBundleSize();
        measureLoadTime();
        measureTTFB();
      });
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // Toggle visibility with Ctrl+Shift+P
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isVisible || process.env.NODE_ENV !== 'development') {
    return null;
  }

  const getScore = (value: number | null, thresholds: { good: number; poor: number }) => {
    if (value === null) return 'N/A';
    if (value <= thresholds.good) return '🟢 Good';
    if (value <= thresholds.poor) return '🟡 Needs Improvement';
    return '🔴 Poor';
  };

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-sm">Performance Monitor</h3>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white text-xs"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span>FCP:</span>
          <span className={metrics.fcp && metrics.fcp <= 1800 ? 'text-green-400' : 'text-red-400'}>
            {metrics.fcp ? `${Math.round(metrics.fcp)}ms` : 'N/A'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>LCP:</span>
          <span className={metrics.lcp && metrics.lcp <= 2500 ? 'text-green-400' : 'text-red-400'}>
            {metrics.lcp ? `${Math.round(metrics.lcp)}ms` : 'N/A'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>FID:</span>
          <span className={metrics.fid && metrics.fid <= 100 ? 'text-green-400' : 'text-red-400'}>
            {metrics.fid ? `${Math.round(metrics.fid)}ms` : 'N/A'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>CLS:</span>
          <span className={metrics.cls && metrics.cls <= 0.1 ? 'text-green-400' : 'text-red-400'}>
            {metrics.cls ? metrics.cls.toFixed(3) : 'N/A'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Load Time:</span>
          <span className={metrics.loadTime && metrics.loadTime <= 3000 ? 'text-green-400' : 'text-red-400'}>
            {metrics.loadTime ? `${Math.round(metrics.loadTime)}ms` : 'N/A'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Bundle Size:</span>
          <span className={metrics.bundleSize && metrics.bundleSize <= 500000 ? 'text-green-400' : 'text-red-400'}>
            {metrics.bundleSize ? `${Math.round(metrics.bundleSize / 1024)}KB` : 'N/A'}
          </span>
        </div>
      </div>
      
      <div className="mt-2 pt-2 border-t border-gray-600 text-xs text-gray-400">
        Press Ctrl+Shift+P to toggle
      </div>
    </div>
  );
}