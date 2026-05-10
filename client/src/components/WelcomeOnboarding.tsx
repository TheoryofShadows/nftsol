import React from 'react';
import { useOnboarding } from '../context/OnboardingContext';
import { useWallet } from '@solana/wallet-adapter-react';

export default function WelcomeOnboarding() {
  const { showWelcome, dismissWelcome, startOnboarding } = useOnboarding();
  const { connected } = useWallet();
  const [currentSlide, setCurrentSlide] = React.useState(0);

  if (!showWelcome) return null;

  const slides = [
    {
      title: 'Welcome to NFTSol! 🎉',
      description:
        'Your gateway to the Solana NFT ecosystem. Create, discover, and trade unique digital assets with lightning-fast transactions.',
      icon: '✨',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Connect Your Wallet',
      description:
        'Securely connect your Solana wallet to start minting, buying, and selling NFTs. We support Phantom, Solflare, and more!',
      icon: '👛',
      gradient: 'from-cyan-500 to-blue-500',
    },
    {
      title: 'Explore & Create',
      description:
        'Browse our marketplace, mint your own NFTs, and build your digital collection. Everything happens on-chain on Solana.',
      icon: '🚀',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      title: 'Earn Rewards',
      description:
        'Earn CLOUT tokens for activities, participate in referrals, and unlock exclusive features as you engage with the platform.',
      icon: '⭐',
      gradient: 'from-yellow-500 to-orange-500',
    },
  ];

  const handleGetStarted = () => {
    dismissWelcome();
    if (!connected) {
      startOnboarding('wallet-connect');
    } else {
      startOnboarding('dashboard-tour');
    }
  };

  const handleSkip = () => {
    dismissWelcome();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="glass-card max-w-2xl w-full p-6 md:p-12 relative overflow-hidden my-auto">
        {/* Progress Indicator */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
          <div
            className="h-full bg-gradient-primary transition-all duration-500 progress-bar"
            data-width={Math.round(((currentSlide + 1) / slides.length) * 100 / 5) * 5}
          />
        </div>

        {/* Slide Content */}
        <div className="text-center py-4 md:py-8">
          <div
            className={`w-16 h-16 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 rounded-full bg-gradient-to-br ${slides[currentSlide].gradient} flex items-center justify-center text-3xl md:text-5xl shadow-2xl`}
          >
            {slides[currentSlide].icon}
          </div>

          <h2 className="text-2xl md:text-4xl font-bold gradient-text-primary mb-3 md:mb-4">
            {slides[currentSlide].title}
          </h2>

          <p className="text-gray-300 text-base md:text-xl mb-6 md:mb-8 max-w-md mx-auto leading-relaxed">
            {slides[currentSlide].description}
          </p>

          {/* Slide Indicators */}
          <div className="flex justify-center space-x-2 mb-8">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'bg-gradient-primary w-8'
                    : 'bg-white/30 hover:bg-white/50'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-center space-x-4">
            {currentSlide > 0 && (
              <button
                onClick={() => setCurrentSlide(currentSlide - 1)}
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-all"
              >
                Previous
              </button>
            )}

            {currentSlide < slides.length - 1 ? (
              <button
                onClick={() => setCurrentSlide(currentSlide + 1)}
                className="px-6 py-3 rounded-xl bg-gradient-primary text-white font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleGetStarted}
                className="px-8 py-3 rounded-xl bg-gradient-primary text-white font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                Get Started
              </button>
            )}
          </div>

          {/* Skip Button */}
          <button
            onClick={handleSkip}
            className="mt-6 text-gray-400 hover:text-white text-sm transition-colors"
          >
            Skip for now
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white transition-all"
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
}
