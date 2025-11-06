// client/src/utils/analytics.ts

declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
    dataLayer?: any[];
  }
}

// Initialize Google Analytics
export const initAnalytics = (trackingId: string) => {
  if (typeof window === 'undefined' || !trackingId) return;

  // Check if already initialized
  if (window.gtag && window.dataLayer) {
    // eslint-disable-next-line no-console
    if (import.meta.env.DEV) console.log('Google Analytics already initialized');
    return;
  }

  // Load gtag script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
  document.head.appendChild(script);

  // Initialize dataLayer
  if (!window.dataLayer) {
    window.dataLayer = [];
  }
  window.gtag = function (...args: any[]) {
    if (window.dataLayer) {
      window.dataLayer.push(...args);
    }
  };
  window.gtag('js', new Date());
  window.gtag('config', trackingId, {
    page_path: window.location.pathname,
    anonymize_ip: true, // Privacy-friendly
  });

  // eslint-disable-next-line no-console
  if (import.meta.env.DEV) console.log('Google Analytics initialized:', trackingId);
};

// Track page views
export const trackPageView = (path: string) => {
  const trackingId = import.meta.env.VITE_GA_TRACKING_ID;
  if (typeof window !== 'undefined' && window.gtag && trackingId) {
    window.gtag('config', trackingId, {
      page_path: path,
    });
  }
};

// Track events
export const trackEvent = (
  eventName: string,
  eventParams?: {
    event_category?: string;
    event_label?: string;
    value?: number;
    [key: string]: any;
  }
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
};

// Track NFT mints
export const trackMint = (nftName: string, mintAddress: string) => {
  trackEvent('nft_mint', {
    event_category: 'NFT',
    event_label: nftName,
    nft_address: mintAddress,
  });
};

// Track purchases
export const trackPurchase = (nftName: string, price: number, currency: string = 'SOL') => {
  trackEvent('nft_purchase', {
    event_category: 'NFT',
    event_label: nftName,
    value: price,
    currency: currency,
  });
};

// Track wallet connections
export const trackWalletConnect = (walletType: string) => {
  trackEvent('wallet_connect', {
    event_category: 'Wallet',
    event_label: walletType,
  });
};

// Track button clicks
export const trackButtonClick = (buttonName: string, location: string) => {
  trackEvent('button_click', {
    event_category: 'UI',
    event_label: buttonName,
    location: location,
  });
};

// Track tab changes
export const trackTabChange = (tabName: string) => {
  trackEvent('tab_change', {
    event_category: 'Navigation',
    event_label: tabName,
  });
};
