import { useEffect, useState } from 'react';
import { PerformanceMetrics } from '../types';

export function usePerformance() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    apiResponseTime: 0,
    memoryUsage: 0,
  });

  useEffect(() => {
    // Measure page load time
    const loadTime = performance.now();
    setMetrics(prev => ({ ...prev, loadTime }));

    // Measure memory usage if available
    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: memory.usedJSHeapSize / 1024 / 1024, // Convert to MB
        }));
      }
    };

    updateMemoryUsage();
    const memoryInterval = setInterval(updateMemoryUsage, 5000);

    // Measure render time
    const renderStart = performance.now();
    requestAnimationFrame(() => {
      const renderTime = performance.now() - renderStart;
      setMetrics(prev => ({ ...prev, renderTime }));
    });

    return () => {
      clearInterval(memoryInterval);
    };
  }, []);

  const measureApiCall = async <T>(
    apiCall: () => Promise<T>
  ): Promise<T> => {
    const start = performance.now();
    try {
      const result = await apiCall();
      const responseTime = performance.now() - start;
      setMetrics(prev => ({ ...prev, apiResponseTime: responseTime }));
      return result;
    } catch (error) {
      const responseTime = performance.now() - start;
      setMetrics(prev => ({ ...prev, apiResponseTime: responseTime }));
      throw error;
    }
  };

  const getPerformanceReport = () => {
    return {
      ...metrics,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      connection: (navigator as any).connection?.effectiveType || 'unknown',
    };
  };

  return {
    metrics,
    measureApiCall,
    getPerformanceReport,
  };
}
