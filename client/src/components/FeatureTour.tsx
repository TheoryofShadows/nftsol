import React, { useCallback } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useOnboarding } from '../context/OnboardingContext';

export default function FeatureTour() {
  const { isOnboardingActive, currentStep, completeStep, skipOnboarding } =
    useOnboarding();
  // Note: connected and isStepCompleted not used in current implementation
  // const { connected } = useWallet();

  // Dashboard Tour Steps
  const dashboardSteps: Step[] = [
    {
      target: '[data-tour="wallet-connect"]',
      content: (
        <div>
          <h3 className="text-xl font-bold gradient-text-primary mb-2">Connect Your Wallet</h3>
          <p className="text-gray-300">
            Click here to connect your Solana wallet. We support Phantom, Solflare, and many others!
          </p>
        </div>
      ),
      disableBeacon: true,
      placement: 'bottom',
    },
    {
      target: '[data-tour="stats-grid"]',
      content: (
        <div>
          <h3 className="text-xl font-bold gradient-text-primary mb-2">Your Stats</h3>
          <p className="text-gray-300">
            Track your SOL balance, NFT count, portfolio value, and activity all in one place.
          </p>
        </div>
      ),
      disableBeacon: true,
      placement: 'top',
    },
    {
      target: '[data-tour="portfolio"]',
      content: (
        <div>
          <h3 className="text-xl font-bold gradient-text-primary mb-2">Portfolio Overview</h3>
          <p className="text-gray-300">
            View all your NFTs in one place. Click on any NFT to see details and manage your
            collection.
          </p>
        </div>
      ),
      disableBeacon: true,
      placement: 'left',
    },
    {
      target: '[data-tour="quick-actions"]',
      content: (
        <div>
          <h3 className="text-xl font-bold gradient-text-primary mb-2">Quick Actions</h3>
          <p className="text-gray-300">
            Quick access to mint NFTs, browse the marketplace, view your collection, and manage
            funds.
          </p>
        </div>
      ),
      disableBeacon: true,
      placement: 'right',
    },
  ];

  // Marketplace Tour Steps
  const marketplaceSteps: Step[] = [
    {
      target: '[data-tour="marketplace-header"]',
      content: (
        <div>
          <h3 className="text-xl font-bold gradient-text-primary mb-2">NFT Marketplace</h3>
          <p className="text-gray-300">
            Browse and discover unique NFTs. Filter by collection, price, and more to find exactly
            what you're looking for.
          </p>
        </div>
      ),
      disableBeacon: true,
      placement: 'bottom',
    },
    {
      target: '[data-tour="nft-grid"]',
      content: (
        <div>
          <h3 className="text-xl font-bold gradient-text-primary mb-2">NFT Gallery</h3>
          <p className="text-gray-300">
            Click on any NFT to view details, see metadata, check ownership history, and make
            purchases.
          </p>
        </div>
      ),
      disableBeacon: true,
      placement: 'top',
    },
  ];

  // Mint Tour Steps
  const mintSteps: Step[] = [
    {
      target: '[data-tour="mint-form"]',
      content: (
        <div>
          <h3 className="text-xl font-bold gradient-text-primary mb-2">Mint Your NFT</h3>
          <p className="text-gray-300">
            Create your own NFT by uploading an image, adding metadata, and setting your
            preferences. Minting happens instantly on Solana!
          </p>
        </div>
      ),
      disableBeacon: true,
      placement: 'top',
    },
  ];

  // Portfolio Tour Steps
  const portfolioSteps: Step[] = [
    {
      target: '[data-tour="portfolio"]',
      content: (
        <div>
          <h3 className="text-xl font-bold gradient-text-primary mb-2">Your Portfolio</h3>
          <p className="text-gray-300">
            View all your NFTs in one place. Click on any NFT to see details, transfer, or list it
            for sale.
          </p>
        </div>
      ),
      disableBeacon: true,
      placement: 'top',
    },
  ];

  const getSteps = (): Step[] => {
    switch (currentStep) {
      case 'dashboard-tour':
        return dashboardSteps;
      case 'marketplace-tour':
        return marketplaceSteps;
      case 'mint-tour':
        return mintSteps;
      case 'portfolio-tour':
        return portfolioSteps;
      default:
        return [];
    }
  };

  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      const { status, type } = data;

      if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
        if (status === STATUS.FINISHED) {
          completeStep(currentStep as any);
        } else {
          skipOnboarding();
        }
      }
    },
    [currentStep, completeStep, skipOnboarding]
  );

  const steps = getSteps();
  const shouldRun = isOnboardingActive && steps.length > 0 && currentStep !== 'welcome';

  // Custom styling for the tour
  const joyrideStyles = {
    options: {
      primaryColor: '#9945ff',
      textColor: '#ffffff',
      backgroundColor: 'rgba(10, 11, 13, 0.95)',
      overlayColor: 'rgba(0, 0, 0, 0.8)',
      arrowColor: '#9945ff',
      zIndex: 10000,
    },
    tooltipContainer: {
      background: 'rgba(26, 27, 35, 0.95)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '16px',
      padding: '20px',
    },
    tooltip: {
      borderRadius: '16px',
    },
    buttonNext: {
      background: 'linear-gradient(135deg, #9945ff 0%, #14f195 100%)',
      borderRadius: '8px',
      padding: '10px 20px',
      fontSize: '14px',
      fontWeight: 600,
    },
    buttonBack: {
      color: '#b8bcc8',
      marginRight: '10px',
    },
    buttonSkip: {
      color: '#8a8d9a',
    },
    spotlight: {
      borderRadius: '12px',
    },
  };

  if (!shouldRun) return null;

  return (
    <Joyride
      steps={steps}
      run={shouldRun}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={joyrideStyles as any}
      floaterProps={{
        disableAnimation: false,
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        open: 'Open',
        skip: 'Skip Tour',
      }}
    />
  );
}
