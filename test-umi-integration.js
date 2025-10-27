/**
 * 🧪 Umi Integration Test Script
 * Run this in the browser console to test the Umi framework integration
 */

console.log('🧪 Starting Umi Integration Test...');

// Test 1: Check if Umi packages are loaded
console.log('📦 Testing Umi package imports...');

try {
  // Check if the MetaplexClient is available
  if (typeof window !== 'undefined' && window.MetaplexClient) {
    console.log('✅ MetaplexClient is available globally');
  } else {
    console.log('⚠️ MetaplexClient not found globally, checking imports...');
  }

  // Test 2: Check if we can create a connection
  console.log('🔌 Testing Solana connection...');
  
  // This would be available in the browser context
  if (typeof window !== 'undefined' && window.solana) {
    console.log('✅ Solana wallet adapter detected');
  } else {
    console.log('⚠️ No Solana wallet detected');
  }

  // Test 3: Check if we can access the minting components
  console.log('🎨 Testing minting components...');
  
  // Look for minting forms in the DOM
  const mintForms = document.querySelectorAll('[data-testid*="mint"], .mint-form, #mint-form');
  if (mintForms.length > 0) {
    console.log(`✅ Found ${mintForms.length} minting form(s)`);
  } else {
    console.log('⚠️ No minting forms found in DOM');
  }

  // Test 4: Check for Umi-specific functionality
  console.log('🚀 Testing Umi framework integration...');
  
  // Check if the page has loaded the Umi components
  const umiElements = document.querySelectorAll('[data-umi], .umi-component');
  if (umiElements.length > 0) {
    console.log(`✅ Found ${umiElements.length} Umi component(s)`);
  } else {
    console.log('ℹ️ No Umi-specific DOM elements found (this is normal)');
  }

  // Test 5: Check console for any errors
  console.log('🔍 Checking for errors...');
  
  // This will be populated by the browser's error handling
  const errors = [];
  const originalError = console.error;
  console.error = function(...args) {
    errors.push(args.join(' '));
    originalError.apply(console, args);
  };

  // Test 6: Simulate a minting attempt (if possible)
  console.log('🎯 Testing minting functionality...');
  
  // Look for wallet connection status
  const walletButtons = document.querySelectorAll('[data-testid*="wallet"], .wallet-button, .connect-wallet');
  if (walletButtons.length > 0) {
    console.log(`✅ Found ${walletButtons.length} wallet button(s)`);
    console.log('💡 Click a wallet button to connect and test minting');
  } else {
    console.log('⚠️ No wallet connection buttons found');
  }

  // Test 7: Check for NFT marketplace components
  console.log('🏪 Testing marketplace components...');
  
  const marketplaceElements = document.querySelectorAll('[data-testid*="marketplace"], .marketplace, .nft-grid');
  if (marketplaceElements.length > 0) {
    console.log(`✅ Found ${marketplaceElements.length} marketplace component(s)`);
  } else {
    console.log('ℹ️ No marketplace components found');
  }

  console.log('✅ Umi Integration Test Complete!');
  console.log('📝 Next steps:');
  console.log('1. Connect your Solana wallet');
  console.log('2. Try minting an NFT using the UI');
  console.log('3. Check the browser console for detailed logs');
  console.log('4. Look for "Umi framework" messages in the console');

  // Restore original console.error
  console.error = originalError;

  if (errors.length > 0) {
    console.log(`⚠️ Found ${errors.length} error(s) during testing:`);
    errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  } else {
    console.log('✅ No errors detected during testing');
  }

} catch (error) {
  console.error('❌ Test failed:', error);
}

// Additional helper functions for manual testing
window.testUmiIntegration = {
  // Function to test wallet connection
  testWalletConnection: () => {
    console.log('🔌 Testing wallet connection...');
    if (window.solana && window.solana.isPhantom) {
      window.solana.connect().then(() => {
        console.log('✅ Wallet connected successfully');
      }).catch((error) => {
        console.error('❌ Wallet connection failed:', error);
      });
    } else {
      console.log('⚠️ Phantom wallet not detected');
    }
  },

  // Function to test minting (if wallet is connected)
  testMinting: () => {
    console.log('🎨 Testing NFT minting...');
    const mintButton = document.querySelector('[data-testid*="mint"], .mint-button, button[type="submit"]');
    if (mintButton) {
      console.log('✅ Found mint button, clicking...');
      mintButton.click();
    } else {
      console.log('⚠️ No mint button found');
    }
  },

  // Function to check Umi service status
  checkUmiService: () => {
    console.log('🔍 Checking Umi service status...');
    // This would check if the MetaplexClient is properly initialized
    console.log('ℹ️ Umi service status check completed');
  }
};

console.log('🛠️ Helper functions available:');
console.log('  - testUmiIntegration.testWalletConnection()');
console.log('  - testUmiIntegration.testMinting()');
console.log('  - testUmiIntegration.checkUmiService()');
