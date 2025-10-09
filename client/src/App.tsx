import { TooltipProvider } from "@/components/ui/tooltip";
import CloutRewardsNotification from "@/components/clout-rewards-notification";
import { useState, useEffect } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Router, Route, Switch } from "wouter";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { useAnalytics } from "@/components/analytics";
import { Suspense, lazy } from "react";
import UnifiedOnboardingGuide from "@/components/unified-onboarding-guide";
import MobileCloutTracker from "@/components/mobile-clout-tracker";
import { Toaster } from "@/components/ui/toaster";
import { AIChatbot } from "@/components/ai-chatbot";
import { AuthProvider } from "@/hooks/use-auth";
import SimpleWalletButton from "@/components/simple-wallet-button";

// Lazy load pages for better performance
const LazyHome = lazy(() => import("@/pages/home"));
const LazyOptimizedHome = lazy(() => import("@/pages/optimized-home"));
const LazyLayoutComparison = lazy(() => import("@/pages/layout-comparison"));
const LazyMarketplace = lazy(() => import("@/pages/marketplace"));
const LazyPortfolio = lazy(() => import("@/pages/Portfolio"));
const LazyCreate = lazy(() => import("@/pages/create"));
const LazyAuth = lazy(() => import("@/pages/auth"));
const LazyAdmin = lazy(() => import("@/pages/admin"));
const LazyCloutAbout = lazy(() => import("@/pages/clout-about"));
const LazyCloutCenter = lazy(() => import("@/pages/clout-center"));
const LazyRecommendations = lazy(() => import("@/pages/recommendations"));
const LazySocialHub = lazy(() => import("@/pages/social-hub"));
const LazyAIEnhancer = lazy(() => import("@/pages/ai-enhancer"));
const LazyWalletPage = lazy(() => import("@/pages/wallet"));
const LazyMintWizard = lazy(() => import("@/pages/mint-wizard"));
const LazyAIStudio = lazy(() => import("@/pages/ai-studio"));
const LazyNotFound = lazy(() => import("@/pages/not-found"));

// Loading component
import { LoadingPage } from "@/components/ui/loading-spinner";

function PageLoader() {
  return <LoadingPage />;
}

function ErrorFallback({error, resetErrorBoundary}: {error: Error, resetErrorBoundary: () => void}) {
  console.error("App render error:", error);

  // Comprehensive cleanup
  try {
    sessionStorage.removeItem('analytics_initialized');
    // Clear any cached data to free memory
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
  } catch (e) {
    console.warn('Could not clear storage:', e);
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
        <p className="mb-4 text-gray-400">Please refresh the page or try again</p>
        <p className="mb-4 text-xs text-gray-500">Error: {error.message}</p>
        <button 
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
function App() {
  const { trackPageView } = useAnalytics();
    const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      trackPageView(window.location.pathname);
    }
  }, [isClient, trackPageView]);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading NFTSol...</div>
      </div>
    );
  }


  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error("App render error:", error, errorInfo);
      }}
    >
      <TooltipProvider>
        <Router>
          <AuthProvider>
            <Navbar />
            <Toaster />
            <CloutRewardsNotification />
            <MobileCloutTracker />
            <AIChatbot />
            <div className="pt-20 md:pt-16">
              <Suspense fallback={<PageLoader />}>
                <Switch>
                  <Route path="/" component={LazyOptimizedHome} />
                  <Route path="/home" component={LazyHome} />
                  <Route path="/old-home" component={LazyHome} />
                  <Route path="/marketplace" component={LazyMarketplace} />
                  <Route path="/portfolio" component={LazyPortfolio} />
                  <Route path="/create" component={LazyCreate} />
                  <Route path="/auth" component={LazyAuth} />
                  <Route path="/admin" component={LazyAdmin} />
                  <Route path="/clout-about" component={LazyCloutAbout} />
                  <Route path="/clout-center" component={LazyCloutCenter} />
                  <Route path="/recommendations" component={LazyRecommendations} />
                  <Route path="/social-hub" component={LazySocialHub} />
                  <Route path="/ai-enhancer" component={LazyAIEnhancer} />
                  <Route path="/wallet" component={LazyWalletPage} />
                  <Route path="/mint-wizard" component={LazyMintWizard} />
                  <Route path="/ai-studio" component={LazyAIStudio} />
                  <Route path="/layout-comparison" component={LazyLayoutComparison} />
                  <Route path="/not-found" component={LazyNotFound} />
                  <Route component={LazyNotFound} />
                </Switch>
              </Suspense>
            </div>
            <Footer />
          </AuthProvider>
        </Router>
      </TooltipProvider>
    </ErrorBoundary>
  );
}

export default App;
