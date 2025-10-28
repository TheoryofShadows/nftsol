// Mobile Wallet Detection Script
// This script helps detect mobile wallets that might not be immediately available

(function() {
  'use strict';
  
  console.log('🔍 Mobile Wallet Detection Script Loaded');
  
  // Function to detect mobile wallets
  function detectMobileWallets() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (!isMobile) {
      console.log('🖥️ Desktop detected, skipping mobile wallet detection');
      return;
    }
    
    console.log('📱 Mobile device detected, running enhanced wallet detection');
    
    // Enhanced Phantom detection for mobile
    if (window.phantom || window.solana?.isPhantom) {
      console.log('👻 Phantom wallet detected on mobile');
      window.phantomDetected = true;
    }
    
    // Enhanced Solflare detection for mobile
    if (window.solflare || window.solana?.isSolflare) {
      console.log('☀️ Solflare wallet detected on mobile');
      window.solflareDetected = true;
    }
    
    // Check for other mobile wallets
    const mobileWallets = [
      'backpack',
      'glow',
      'sollet',
      'slope',
      'torus',
      'coinbase'
    ];
    
    mobileWallets.forEach(wallet => {
      if (window[wallet] || window.solana?.[`is${wallet.charAt(0).toUpperCase() + wallet.slice(1)}`]) {
        console.log(`✅ ${wallet} wallet detected on mobile`);
        window[`${wallet}Detected`] = true;
      }
    });
    
    // Dispatch custom event for wallet detection
    window.dispatchEvent(new CustomEvent('mobileWalletsDetected', {
      detail: {
        phantom: !!window.phantomDetected,
        solflare: !!window.solflareDetected,
        backpack: !!window.backpackDetected,
        glow: !!window.glowDetected,
        sollet: !!window.solletDetected,
        slope: !!window.slopeDetected,
        torus: !!window.torusDetected,
        coinbase: !!window.coinbaseDetected
      }
    }));
  }
  
  // Run detection immediately and with delays
  detectMobileWallets();
  
  // Run detection after DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', detectMobileWallets);
  }
  
  // Run detection after window is fully loaded
  window.addEventListener('load', detectMobileWallets);
  
  // Run detection with intervals for delayed wallet loading
  setTimeout(detectMobileWallets, 1000);
  setTimeout(detectMobileWallets, 3000);
  setTimeout(detectMobileWallets, 5000);
  
  // Listen for wallet injection events
  window.addEventListener('solana#initialized', detectMobileWallets);
  window.addEventListener('phantom#initialized', detectMobileWallets);
  window.addEventListener('solflare#initialized', detectMobileWallets);
  
})();
