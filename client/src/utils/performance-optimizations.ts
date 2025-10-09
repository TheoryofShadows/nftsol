// Performance optimization utilities

/**
 * Debounce function to limit the rate of function execution
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
 * Throttle function to limit the rate of function execution
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
 * Memoize function results to avoid expensive recalculations
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  getKey?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Lazy load images with intersection observer
 */
export function lazyLoadImages() {
  const images = document.querySelectorAll('img[data-src]');
  
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        img.src = img.dataset.src || '';
        img.classList.remove('lazy');
        observer.unobserve(img);
      }
    });
  });

  images.forEach(img => imageObserver.observe(img));
}

/**
 * Preload critical resources
 */
export function preloadCriticalResources() {
  const criticalResources = [
    '/fonts/inter-var.woff2',
    '/fonts/orbitron-var.woff2',
    '/icons/solana-logo.svg'
  ];

  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource;
    link.as = resource.endsWith('.woff2') ? 'font' : 'image';
    if (resource.endsWith('.woff2')) {
      link.crossOrigin = 'anonymous';
    }
    document.head.appendChild(link);
  });
}

/**
 * Optimize scroll performance
 */
export function optimizeScrollPerformance() {
  let ticking = false;
  
  function updateScrollPosition() {
    // Perform scroll-related updates here
    ticking = false;
  }
  
  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(updateScrollPosition);
      ticking = true;
    }
  }
  
  window.addEventListener('scroll', requestTick, { passive: true });
}

/**
 * Bundle size analyzer
 */
export function analyzeBundleSize() {
  if (process.env.NODE_ENV !== 'development') return;
  
  const scripts = document.querySelectorAll('script[src]');
  let totalSize = 0;
  const chunks: { name: string; size: number }[] = [];
  
  scripts.forEach(script => {
    const src = script.getAttribute('src');
    if (src && src.includes('assets/')) {
      const size = script.textContent?.length || 0;
      totalSize += size;
      chunks.push({
        name: src.split('/').pop() || 'unknown',
        size
      });
    }
  });
  
  console.group('📊 Bundle Analysis');
  console.log(`Total Size: ${(totalSize / 1024).toFixed(2)}KB`);
  console.table(chunks.sort((a, b) => b.size - a.size));
  console.groupEnd();
  
  return { totalSize, chunks };
}

/**
 * Memory usage monitor
 */
export function monitorMemoryUsage() {
  if (process.env.NODE_ENV !== 'development') return;
  
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    console.group('🧠 Memory Usage');
    console.log(`Used: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`Total: ${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`Limit: ${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`);
    console.groupEnd();
  }
}

/**
 * Initialize all performance optimizations
 */
export function initializePerformanceOptimizations() {
  // Preload critical resources
  preloadCriticalResources();
  
  // Optimize scroll performance
  optimizeScrollPerformance();
  
  // Lazy load images
  if (typeof window !== 'undefined') {
    lazyLoadImages();
  }
  
  // Monitor performance in development
  if (process.env.NODE_ENV === 'development') {
    setTimeout(() => {
      analyzeBundleSize();
      monitorMemoryUsage();
    }, 2000);
  }
}