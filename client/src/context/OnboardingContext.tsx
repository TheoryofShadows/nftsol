import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export type OnboardingStep =
  | 'welcome'
  | 'wallet-connect'
  | 'dashboard-tour'
  | 'marketplace-tour'
  | 'mint-tour'
  | 'portfolio-tour'
  | 'completed';

interface OnboardingState {
  isOnboardingActive: boolean;
  currentStep: OnboardingStep | null;
  completedSteps: OnboardingStep[];
  skipped: boolean;
  showWelcome: boolean;
  lastShownAt: number | null;
}

interface OnboardingContextType extends OnboardingState {
  startOnboarding: (step?: OnboardingStep) => void;
  completeStep: (step: OnboardingStep) => void;
  skipOnboarding: () => void;
  resetOnboarding: () => void;
  dismissWelcome: () => void;
  isStepCompleted: (step: OnboardingStep) => boolean;
  getProgress: () => number;
}

const initialState: OnboardingState = {
  isOnboardingActive: false,
  currentStep: null,
  completedSteps: [],
  skipped: false,
  showWelcome: true,
  lastShownAt: null,
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [storedState, setStoredState] = useLocalStorage<OnboardingState>(
    'nftsol-onboarding',
    initialState
  );

  const [state, setState] = useState<OnboardingState>(() => {
    // Check if user is new (first visit in last 30 days)
    const isNewUser =
      !storedState.lastShownAt || Date.now() - storedState.lastShownAt > 30 * 24 * 60 * 60 * 1000;

    return {
      ...storedState,
      showWelcome: storedState.skipped
        ? false
        : isNewUser && !storedState.completedSteps.includes('completed'),
    };
  });

  // Sync state to localStorage
  useEffect(() => {
    setStoredState(state);
  }, [state, setStoredState]);

  const startOnboarding = useCallback((step: OnboardingStep = 'welcome') => {
    setState((prev) => ({
      ...prev,
      isOnboardingActive: true,
      currentStep: step,
      showWelcome: step === 'welcome',
    }));
  }, []);

  const completeStep = useCallback((step: OnboardingStep) => {
    setState((prev) => {
      const newCompletedSteps = [...prev.completedSteps, step];
      const isFullyCompleted = newCompletedSteps.length >= 6; // All major steps

      return {
        ...prev,
        completedSteps: newCompletedSteps,
        currentStep: isFullyCompleted ? 'completed' : prev.currentStep,
        isOnboardingActive: !isFullyCompleted,
        showWelcome: false,
        lastShownAt: Date.now(),
      };
    });
  }, []);

  const skipOnboarding = useCallback(() => {
    setState((prev) => ({
      ...prev,
      skipped: true,
      isOnboardingActive: false,
      showWelcome: false,
      currentStep: null,
      lastShownAt: Date.now(),
    }));
  }, []);

  const resetOnboarding = useCallback(() => {
    setState({
      ...initialState,
      showWelcome: true,
    });
  }, []);

  const dismissWelcome = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showWelcome: false,
      lastShownAt: Date.now(),
    }));
  }, []);

  const isStepCompleted = useCallback(
    (step: OnboardingStep) => {
      return state.completedSteps.includes(step);
    },
    [state.completedSteps]
  );

  const getProgress = useCallback(() => {
    const totalSteps = 6;
    return Math.round((state.completedSteps.length / totalSteps) * 100);
  }, [state.completedSteps.length]);

  const value: OnboardingContextType = {
    ...state,
    startOnboarding,
    completeStep,
    skipOnboarding,
    resetOnboarding,
    dismissWelcome,
    isStepCompleted,
    getProgress,
  };

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
