import React from 'react';
import { useOnboarding } from '../context/OnboardingContext';

export default function OnboardingProgress() {
  const { getProgress, completedSteps, startOnboarding, resetOnboarding } = useOnboarding();
  const progress = getProgress();
  const [isExpanded, setIsExpanded] = React.useState(false);

  if (progress === 100) {
    return (
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="glass-card p-4 rounded-full shadow-lg hover:shadow-xl transition-all"
        >
          <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-xl">
            ✅
          </div>
        </button>

        {isExpanded && (
          <div className="absolute bottom-16 right-0 glass-card p-6 rounded-2xl w-80 animate-fade-in animate-slide-up">
            <h3 className="text-lg font-bold gradient-text-primary mb-2">
              Onboarding Complete! 🎉
            </h3>
            <p className="text-sm text-gray-300 mb-4">
              You&apos;ve completed the tour. Want to restart it?
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  resetOnboarding();
                  startOnboarding('welcome');
                  setIsExpanded(false);
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-gradient-primary text-white text-sm font-semibold hover:shadow-lg transition-all"
              >
                Restart Tour
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="glass-card p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all min-w-[200px]"
      >
        <div className="flex items-center space-x-3">
          <div className="relative w-12 h-12">
            <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 48 48">
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="4"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="url(#progressGradient)"
                strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 20}`}
                strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress / 100)}`}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#9945ff" />
                  <stop offset="100%" stopColor="#14f195" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold gradient-text-primary">{progress}%</span>
            </div>
          </div>
          <div className="text-left flex-1">
            <div className="text-sm font-semibold text-white">Getting Started</div>
            <div className="text-xs text-gray-400">
              {completedSteps.length} of 6 steps completed
            </div>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="absolute bottom-20 right-0 glass-card p-6 rounded-2xl w-80 animate-fade-in animate-slide-up">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-bold gradient-text-primary">Your Progress</h3>
            <button
              onClick={() => setIsExpanded(false)}
              aria-label="Close progress panel"
              className="w-7 h-7 -mt-1 -mr-1 rounded-full bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white text-lg leading-none flex items-center justify-center transition-colors"
            >
              ×
            </button>
          </div>

          <div className="space-y-3 mb-4">
            {[
              { step: 'wallet-connect', label: 'Connect Wallet', icon: '👛' },
              { step: 'dashboard-tour', label: 'Dashboard Tour', icon: '📊' },
              { step: 'marketplace-tour', label: 'Marketplace', icon: '🏪' },
              { step: 'mint-tour', label: 'Mint NFT', icon: '✨' },
              { step: 'portfolio-tour', label: 'Portfolio', icon: '🎨' },
              { step: 'completed', label: 'Complete', icon: '🎉' },
            ].map((item) => {
              const isCompleted = completedSteps.includes(item.step as any);
              return (
                <div
                  key={item.step}
                  className={`flex items-center space-x-3 p-2 rounded-lg transition-all ${
                    isCompleted ? 'bg-green-500/20' : 'bg-white/5'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span
                    className={`text-sm flex-1 ${isCompleted ? 'text-green-400' : 'text-gray-400'}`}
                  >
                    {item.label}
                  </span>
                  {isCompleted && <span className="text-green-400">✓</span>}
                </div>
              );
            })}
          </div>

          <button
            onClick={() => {
              startOnboarding();
              setIsExpanded(false);
            }}
            className="w-full px-4 py-2 rounded-lg bg-gradient-primary text-white text-sm font-semibold hover:shadow-lg transition-all"
          >
            Continue Tour
          </button>
        </div>
      )}
    </div>
  );
}
