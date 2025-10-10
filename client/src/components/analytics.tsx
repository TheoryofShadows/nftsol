import { useEffect, useState } from 'react';

// Only initialize in production
const isProduction = import.meta.env.MODE === 'production';
const GA_MEASUREMENT_ID = 'G-GQJWV3M3QL';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
    analyticsInitialized?: boolean;
  }
}

export function initializeAnalytics() {
  // Prevent multiple initializations
  if (window.analyticsInitialized || !isProduction) {
    return;
  }

  try {
    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];

    // Define gtag function
    window.gtag = function(...args: any[]) {
      window.dataLayer.push(args);
    };

    // Configure Google Analytics
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_title: 'NFTSol - Solana NFT Marketplace',
      page_location: window.location.href,
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      debug_mode: false
    });

    window.analyticsInitialized = true;
    console.log('Analytics initialized successfully');
  } catch (error) {
    console.warn('Analytics initialization failed:', error);
  }
}

export function trackEvent(eventName: string, parameters?: Record<string, any>) {
  if (!isProduction || !window.analyticsInitialized) return;

  try {
    window.gtag('event', eventName, {
      event_category: 'NFT Marketplace',
      event_label: 'User Interaction',
      value: 1,
      ...parameters
    });
  } catch (error) {
    console.warn('Event tracking failed:', error);
  }
}

export function trackPageView(path: string, title?: string) {
  if (!isProduction || !window.analyticsInitialized) return;

  try {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: path,
      page_title: title || document.title,
      page_location: window.location.href,
      send_page_view: true
    });
  } catch (error) {
    console.warn('Page view tracking failed:', error);
  }
}

// Analytics Hook for React components
export function useAnalytics() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isProduction && !window.analyticsInitialized) {
      initializeAnalytics();
      setIsReady(true);
    } else if (window.analyticsInitialized) {
      setIsReady(true);
    }
  }, []);

  return {
    isReady: isReady && isProduction,
    trackEvent: isProduction ? trackEvent : () => {},
    trackPageView: isProduction ? trackPageView : () => {}
  };
}
