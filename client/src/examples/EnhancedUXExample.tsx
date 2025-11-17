/**
 * Enhanced UX Example
 *
 * This file demonstrates the new console logging system and UI components
 * inspired by professional NFT marketplaces like Magic Eden and Tensor.
 *
 * Features:
 * - Styled console output with emojis and colors
 * - Professional progress indicators
 * - Enhanced notifications with shimmer effects
 * - Performance tracking
 * - User action logging
 */

import React, { useState } from 'react';
import { logger } from '../utils/logger';
import { ProgressIndicator, InlineSpinner, LoadingOverlay } from '../components/ProgressIndicator';
import { useNotification } from '../components/NotificationSystem';

export function EnhancedUXExample() {
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { addNotification } = useNotification();

  // Example 1: Basic Logging
  const handleBasicLogging = () => {
    logger.info('This is an info message');
    logger.success('Operation completed successfully!');
    logger.warn('This is a warning message');
    logger.error('This is an error message', new Error('Example error'));
    logger.debug('Debug information for developers');
  };

  // Example 2: API Logging
  const handleApiExample = async () => {
    logger.api('GET', '/api/nfts', { limit: 10 });

    // Simulate API call
    logger.timeStart('API Request');
    await new Promise(resolve => setTimeout(resolve, 1500));
    logger.timeEnd('API Request');

    logger.apiResponse('/api/nfts', 200, 1500, { count: 42 });
  };

  // Example 3: User Action Logging
  const handleUserAction = () => {
    logger.userAction('NFT Purchase Initiated', {
      nftId: 'abc123',
      price: 1.5,
      currency: 'SOL',
    });

    addNotification({
      type: 'info',
      title: 'Action Logged',
      message: 'Check the console to see the user action log',
    });
  };

  // Example 4: Performance Tracking
  const handlePerformanceTest = async () => {
    logger.group('Performance Test', 'perf');

    logger.timeStart('Data Processing');
    await new Promise(resolve => setTimeout(resolve, 800));
    logger.timeEnd('Data Processing');

    logger.timeStart('Rendering');
    await new Promise(resolve => setTimeout(resolve, 200));
    logger.timeEnd('Rendering');

    logger.groupEnd();

    logger.success('Performance test completed');
  };

  // Example 5: Progress Simulation
  const handleProgressSimulation = () => {
    setIsLoading(true);
    setProgress(0);

    logger.info('Starting progress simulation...');

    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + 10;
        if (next >= 100) {
          clearInterval(interval);
          setIsLoading(false);
          logger.success('Progress complete!');
          addNotification({
            type: 'success',
            title: 'Complete',
            message: 'Operation finished successfully',
          });
          return 100;
        }
        return next;
      });
    }, 300);
  };

  // Example 6: Grouped Operations
  const handleGroupedOperations = async () => {
    logger.groupCollapsed('NFT Minting Process', 'info');

    logger.info('Step 1: Validating metadata');
    await new Promise(resolve => setTimeout(resolve, 500));

    logger.info('Step 2: Creating transaction');
    await new Promise(resolve => setTimeout(resolve, 500));

    logger.info('Step 3: Signing transaction');
    await new Promise(resolve => setTimeout(resolve, 500));

    logger.info('Step 4: Submitting to blockchain');
    await new Promise(resolve => setTimeout(resolve, 500));

    logger.groupEnd();
    logger.success('NFT minted successfully!');
  };

  // Example 7: Table Output
  const handleTableExample = () => {
    const nfts = [
      { id: 1, name: 'Cool NFT #1', price: 1.5, rarity: 'Rare' },
      { id: 2, name: 'Epic NFT #2', price: 3.2, rarity: 'Epic' },
      { id: 3, name: 'Common NFT #3', price: 0.5, rarity: 'Common' },
    ];

    logger.table(nfts, '📊 NFT Collection Data');
  };

  // Example 8: All Notification Types
  const handleAllNotifications = () => {
    addNotification({
      type: 'success',
      title: 'Success!',
      message: 'Your NFT has been minted successfully',
      duration: 4000,
    });

    setTimeout(() => {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to connect to wallet',
        duration: 4000,
      });
    }, 500);

    setTimeout(() => {
      addNotification({
        type: 'warning',
        title: 'Warning',
        message: 'Network fees are higher than usual',
        duration: 4000,
      });
    }, 1000);

    setTimeout(() => {
      addNotification({
        type: 'info',
        title: 'Info',
        message: 'New NFT collection just dropped!',
        duration: 4000,
      });
    }, 1500);
  };

  // Example 9: Loading Overlay
  const handleLoadingOverlay = async () => {
    setIsLoading(true);
    logger.info('Showing loading overlay...');

    await new Promise(resolve => setTimeout(resolve, 3000));

    setIsLoading(false);
    logger.success('Loading complete!');
  };

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      {/* Header */}
      <div className="text-center mb-12 animate-fade-in-up">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Enhanced UX Examples
        </h1>
        <p className="text-gray-400 text-lg">
          Professional console output and UI components inspired by Magic Eden & Tensor
        </p>
      </div>

      {/* Console Logging Examples */}
      <section className="glass p-6 rounded-2xl space-y-4 animate-scale-in">
        <h2 className="text-2xl font-bold text-purple-400 mb-4">🎨 Console Logging</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleBasicLogging}
            className="btn-primary p-4 rounded-xl hover:scale-105 transition-transform"
          >
            Basic Logging
          </button>

          <button
            onClick={handleApiExample}
            className="btn-primary p-4 rounded-xl hover:scale-105 transition-transform"
          >
            API Logging
          </button>

          <button
            onClick={handleUserAction}
            className="btn-primary p-4 rounded-xl hover:scale-105 transition-transform"
          >
            User Action
          </button>

          <button
            onClick={handlePerformanceTest}
            className="btn-primary p-4 rounded-xl hover:scale-105 transition-transform"
          >
            Performance Test
          </button>

          <button
            onClick={handleGroupedOperations}
            className="btn-primary p-4 rounded-xl hover:scale-105 transition-transform"
          >
            Grouped Operations
          </button>

          <button
            onClick={handleTableExample}
            className="btn-primary p-4 rounded-xl hover:scale-105 transition-transform"
          >
            Table Output
          </button>
        </div>
      </section>

      {/* Progress Indicators */}
      <section className="glass p-6 rounded-2xl space-y-6 animate-scale-in">
        <h2 className="text-2xl font-bold text-purple-400 mb-4">⚡ Progress Indicators</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Circular Progress */}
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4 text-gray-300">Circular</h3>
            <ProgressIndicator
              variant="circular"
              progress={progress}
              message="Processing..."
              size="lg"
            />
          </div>

          {/* Linear Progress */}
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4 text-gray-300">Linear</h3>
            <ProgressIndicator
              variant="linear"
              progress={progress}
              message="Loading assets..."
            />
          </div>

          {/* Dots Progress */}
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4 text-gray-300">Dots</h3>
            <ProgressIndicator
              variant="dots"
              message="Please wait..."
              size="md"
            />
          </div>
        </div>

        <button
          onClick={handleProgressSimulation}
          disabled={isLoading}
          className="btn-primary w-full p-4 rounded-xl hover:scale-105 transition-transform disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <InlineSpinner className="w-5 h-5 mr-2" />
              Running...
            </span>
          ) : (
            'Start Progress Simulation'
          )}
        </button>
      </section>

      {/* Notifications */}
      <section className="glass p-6 rounded-2xl space-y-4 animate-scale-in">
        <h2 className="text-2xl font-bold text-purple-400 mb-4">🔔 Notifications</h2>

        <button
          onClick={handleAllNotifications}
          className="btn-primary w-full p-4 rounded-xl hover:scale-105 transition-transform"
        >
          Show All Notification Types
        </button>
      </section>

      {/* Loading Overlay */}
      <section className="glass p-6 rounded-2xl space-y-4 animate-scale-in">
        <h2 className="text-2xl font-bold text-purple-400 mb-4">🌀 Loading Overlay</h2>

        <button
          onClick={handleLoadingOverlay}
          className="btn-primary w-full p-4 rounded-xl hover:scale-105 transition-transform"
        >
          Show Loading Overlay (3s)
        </button>
      </section>

      {/* Tips */}
      <section className="glass p-6 rounded-2xl animate-scale-in">
        <h2 className="text-2xl font-bold text-purple-400 mb-4">💡 Usage Tips</h2>

        <ul className="space-y-3 text-gray-300">
          <li className="flex items-start">
            <span className="text-green-400 mr-2">✓</span>
            <span>Open the browser console (F12) to see the styled logging output</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-400 mr-2">✓</span>
            <span>All logging is automatically disabled in production builds</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-400 mr-2">✓</span>
            <span>Use logger.timeStart() and logger.timeEnd() for performance tracking</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-400 mr-2">✓</span>
            <span>Group related operations with logger.group() for better organization</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-400 mr-2">✓</span>
            <span>Progress indicators support different variants and sizes</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-400 mr-2">✓</span>
            <span>Notifications auto-dismiss and support stacking</span>
          </li>
        </ul>
      </section>

      {/* Loading Overlay Component */}
      {isLoading && <LoadingOverlay message="Processing your request..." progress={progress} />}
    </div>
  );
}

export default EnhancedUXExample;
