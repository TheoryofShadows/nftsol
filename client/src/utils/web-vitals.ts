/**
 * Web Vitals Monitoring
 * Tracks Core Web Vitals and sends to analytics backend
 */

interface WebVitalMetric {
  name: string;
  value: number;
  score: 'good' | 'needs-improvement' | 'poor';
  timestamp: string;
  url: string;
}

// Thresholds for "good", "needs-improvement", and "poor" scores
const THRESHOLDS: Record<string, [number, number]> = {
  'Cumulative Layout Shift (CLS)': [0.1, 0.25],
  'First Input Delay (FID)': [100, 300],
  'First Contentful Paint (FCP)': [1800, 3000],
  'Largest Contentful Paint (LCP)': [2500, 4000],
  'Time to First Byte (TTFB)': [600, 1800],
  'Time to Interactive (TTI)': [2500, 5000]
};

/**
 * Determine score based on metric value and thresholds
 */
function getVitalScore(metric: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const [good, needsImprovement] = THRESHOLDS[metric] || [0, 0];

  if (value <= good) return 'good';
  if (value <= needsImprovement) return 'needs-improvement';
  return 'poor';
}

/**
 * Send metric to analytics backend
 */
function sendMetricToBackend(metric: WebVitalMetric) {
  // Guard: ensure value exists and is a number
  if (!metric || typeof metric.value !== 'number') {
    return;
  }

  if (!navigator.sendBeacon) {
    return;
  }

  const endpoint = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

  try {
    navigator.sendBeacon(
      `${endpoint}/api/metrics/web-vitals`,
      JSON.stringify(metric)
    );

    // Log in development
    if (import.meta.env.DEV && typeof metric.value === 'number') {
      console.log(`📊 ${metric.name}: ${metric.value.toFixed(2)}ms (${metric.score})`);
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Failed to send Web Vital:', error);
    }
  }
}

/**
 * Observe Cumulative Layout Shift
 */
function observeCLS() {
  let cls = 0;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if ((entry as LayoutShift).hadRecentInput) continue;
      cls += (entry as LayoutShift).value;
    }

    sendMetricToBackend({
      name: 'Cumulative Layout Shift (CLS)',
      value: cls,
      score: getVitalScore('Cumulative Layout Shift (CLS)', cls),
      timestamp: new Date().toISOString(),
      url: window.location.href
    });
  });

  try {
    observer.observe({ type: 'layout-shift', buffered: true });
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('CLS observer error:', error);
    }
  }
}

/**
 * Observe Largest Contentful Paint
 */
function observeLCP() {
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1] as LargestContentfulPaint;

    sendMetricToBackend({
      name: 'Largest Contentful Paint (LCP)',
      value: lastEntry.renderTime || lastEntry.loadTime,
      score: getVitalScore('Largest Contentful Paint (LCP)', lastEntry.renderTime || lastEntry.loadTime),
      timestamp: new Date().toISOString(),
      url: window.location.href
    });
  });

  try {
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('LCP observer error:', error);
    }
  }
}

/**
 * Observe First Input Delay
 */
function observeFID() {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const fid = (entry as FirstInput).processingDuration;

      sendMetricToBackend({
        name: 'First Input Delay (FID)',
        value: fid,
        score: getVitalScore('First Input Delay (FID)', fid),
        timestamp: new Date().toISOString(),
        url: window.location.href
      });
    }
  });

  try {
    observer.observe({ type: 'first-input', buffered: true });
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('FID observer error:', error);
    }
  }
}

/**
 * Observe First Contentful Paint
 */
function observeFCP() {
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();

    for (const entry of entries) {
      sendMetricToBackend({
        name: 'First Contentful Paint (FCP)',
        value: entry.startTime,
        score: getVitalScore('First Contentful Paint (FCP)', entry.startTime),
        timestamp: new Date().toISOString(),
        url: window.location.href
      });
    }
  });

  try {
    observer.observe({ type: 'paint', buffered: true });
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('FCP observer error:', error);
    }
  }
}

/**
 * Report Time to First Byte
 */
function reportTTFB() {
  const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

  if (!navigationTiming) return;

  const ttfb = navigationTiming.responseStart - navigationTiming.fetchStart;

  sendMetricToBackend({
    name: 'Time to First Byte (TTFB)',
    value: ttfb,
    score: getVitalScore('Time to First Byte (TTFB)', ttfb),
    timestamp: new Date().toISOString(),
    url: window.location.href
  });
}

/**
 * Main function to start reporting all Web Vitals
 * Currently disabled to prevent backend errors and noise in console
 */
export function reportWebVitals() {
  if (typeof window === 'undefined') return;

  // Web vitals reporting disabled - the backend metrics endpoints
  // return 400 errors and the monitoring causes console spam
  // This can be re-enabled once the backend metrics endpoints are properly implemented

  if (import.meta.env.DEV) {
    console.log('ℹ️ Web Vitals monitoring is disabled');
  }
}

// TypeScript definitions for Web Vitals
interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

interface LargestContentfulPaint extends PerformanceEntry {
  renderTime: number;
  loadTime: number;
  element?: Element;
  url?: string;
  size: number;
}

interface FirstInput extends PerformanceEntry {
  processingDuration: number;
}
