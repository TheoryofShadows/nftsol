/**
 * 📊 Google Analytics 4 Integration
 * Custom event tracking for NFTSol platform
 */

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

class Analytics {
  private measurementId: string;
  private isEnabled: boolean;

  constructor() {
    this.measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID || '';
    this.isEnabled = !!this.measurementId && import.meta.env.PROD;
  }

  /**
   * Initialize Google Analytics
   */
  init() {
    if (!this.isEnabled) {
      console.log('📊 Analytics disabled (no measurement ID or not in production)');
      return;
    }

    // Load gtag script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      window.dataLayer.push(args);
    }
    window.gtag = gtag;

    gtag('js', new Date());
    gtag('config', this.measurementId, {
      page_title: 'NFTSol - Revolutionary NFT Platform',
      page_location: window.location.href,
      custom_map: {
        'custom_parameter_1': 'platform',
        'custom_parameter_2': 'nft_type',
        'custom_parameter_3': 'wallet_type'
      }
    });

    console.log('📊 Google Analytics initialized');
  }

  /**
   * Track page view
   */
  pageView(pageName: string, pagePath?: string) {
    if (!this.isEnabled) return;

    window.gtag('event', 'page_view', {
      page_title: pageName,
      page_location: pagePath || window.location.href,
      page_path: pagePath || window.location.pathname,
      platform: 'nftsol'
    });

    console.log(`📊 Page view tracked: ${pageName}`);
  }

  /**
   * Track wallet connection
   */
  trackWalletConnection(walletType: string, success: boolean) {
    if (!this.isEnabled) return;

    window.gtag('event', 'wallet_connection', {
      event_category: 'wallet',
      event_label: walletType,
      value: success ? 1 : 0,
      platform: 'nftsol',
      wallet_type: walletType
    });

    console.log(`📊 Wallet connection tracked: ${walletType} (${success ? 'success' : 'failed'})`);
  }

  /**
   * Track NFT mint
   */
  trackNFTMint(
    nftType: 'regular' | 'compressed',
    cost: number,
    collection?: string,
    success: boolean = true
  ) {
    if (!this.isEnabled) return;

    window.gtag('event', 'nft_mint', {
      event_category: 'nft',
      event_label: nftType,
      value: cost,
      currency: 'SOL',
      platform: 'nftsol',
      nft_type: nftType,
      collection: collection || 'unknown',
      cost_sol: cost
    });

    console.log(`📊 NFT mint tracked: ${nftType} NFT for ${cost} SOL`);
  }

  /**
   * Track marketplace view
   */
  trackMarketplaceView(filterType?: string, nftCount?: number) {
    if (!this.isEnabled) return;

    window.gtag('event', 'marketplace_view', {
      event_category: 'marketplace',
      event_label: filterType || 'all',
      value: nftCount || 0,
      platform: 'nftsol',
      filter_type: filterType || 'all',
      nft_count: nftCount || 0
    });

    console.log(`📊 Marketplace view tracked: ${filterType || 'all'} (${nftCount || 0} NFTs)`);
  }

  /**
   * Track CLOUT page visit
   */
  trackCLOUTPageVisit(section?: string) {
    if (!this.isEnabled) return;

    window.gtag('event', 'clout_page_visit', {
      event_category: 'clout',
      event_label: section || 'main',
      platform: 'nftsol',
      section: section || 'main'
    });

    console.log(`📊 CLOUT page visit tracked: ${section || 'main'}`);
  }

  /**
   * Track collection view
   */
  trackCollectionView(collectionName: string, nftCount: number) {
    if (!this.isEnabled) return;

    window.gtag('event', 'collection_view', {
      event_category: 'collection',
      event_label: collectionName,
      value: nftCount,
      platform: 'nftsol',
      collection_name: collectionName,
      nft_count: nftCount
    });

    console.log(`📊 Collection view tracked: ${collectionName} (${nftCount} NFTs)`);
  }

  /**
   * Track social share
   */
  trackSocialShare(platform: string, contentType: string) {
    if (!this.isEnabled) return;

    window.gtag('event', 'social_share', {
      event_category: 'social',
      event_label: platform,
      platform: 'nftsol',
      share_platform: platform,
      content_type: contentType
    });

    console.log(`📊 Social share tracked: ${platform} (${contentType})`);
  }

  /**
   * Track error
   */
  trackError(errorType: string, errorMessage: string, context?: string) {
    if (!this.isEnabled) return;

    window.gtag('event', 'exception', {
      description: errorMessage,
      fatal: false,
      platform: 'nftsol',
      error_type: errorType,
      context: context || 'unknown'
    });

    console.log(`📊 Error tracked: ${errorType} - ${errorMessage}`);
  }

  /**
   * Track custom event
   */
  trackCustomEvent(
    eventName: string,
    parameters: Record<string, any> = {}
  ) {
    if (!this.isEnabled) return;

    window.gtag('event', eventName, {
      ...parameters,
      platform: 'nftsol'
    });

    console.log(`📊 Custom event tracked: ${eventName}`, parameters);
  }

  /**
   * Track user engagement
   */
  trackEngagement(action: string, duration?: number) {
    if (!this.isEnabled) return;

    window.gtag('event', 'user_engagement', {
      event_category: 'engagement',
      event_label: action,
      value: duration || 0,
      platform: 'nftsol',
      action: action,
      duration_seconds: duration || 0
    });

    console.log(`📊 Engagement tracked: ${action}${duration ? ` (${duration}s)` : ''}`);
  }

  /**
   * Track conversion (e.g., successful NFT purchase)
   */
  trackConversion(
    conversionType: string,
    value: number,
    currency: string = 'SOL'
  ) {
    if (!this.isEnabled) return;

    window.gtag('event', 'conversion', {
      event_category: 'conversion',
      event_label: conversionType,
      value: value,
      currency: currency,
      platform: 'nftsol',
      conversion_type: conversionType
    });

    console.log(`📊 Conversion tracked: ${conversionType} (${value} ${currency})`);
  }

  /**
   * Set user properties
   */
  setUserProperties(properties: Record<string, any>) {
    if (!this.isEnabled) return;

    window.gtag('config', this.measurementId, {
      user_properties: {
        ...properties,
        platform: 'nftsol'
      }
    });

    console.log('📊 User properties set:', properties);
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metricName: string, value: number, unit: string = 'ms') {
    if (!this.isEnabled) return;

    window.gtag('event', 'timing_complete', {
      name: metricName,
      value: value,
      platform: 'nftsol',
      metric_name: metricName,
      metric_value: value,
      metric_unit: unit
    });

    console.log(`📊 Performance tracked: ${metricName} = ${value}${unit}`);
  }
}

// Create singleton instance
const analytics = new Analytics();

// Auto-initialize in production
if (import.meta.env.PROD) {
  analytics.init();
}

export default analytics;

// Export individual tracking functions for convenience
export const {
  pageView,
  trackWalletConnection,
  trackNFTMint,
  trackMarketplaceView,
  trackCLOUTPageVisit,
  trackCollectionView,
  trackSocialShare,
  trackError,
  trackCustomEvent,
  trackEngagement,
  trackConversion,
  setUserProperties,
  trackPerformance
} = analytics;
