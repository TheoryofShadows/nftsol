import React, { ReactNode } from 'react';
import { 
  UniversalSection, 
  UniversalCard, 
  UniversalGrid, 
  UniversalText 
} from './content-deduplication-engine';
import { AutoLayoutGrid, LayoutPerformanceMonitor } from './revolutionary-grid-system';
import { AdaptiveSection, SmartGrid, LayoutOrchestrator } from './adaptive-layout-system';

/**
 * REVOLUTIONARY LAYOUT OPTIMIZER
 * 
 * This component solves the massive problem of duplicate layouts across the entire app.
 * It provides a single, intelligent interface that replaces ALL repetitive section/card/grid patterns.
 */

// Main layout optimizer that replaces all duplicate patterns
export const LayoutOptimizer: React.FC<{
  children: ReactNode;
  mode?: 'auto' | 'section' | 'cards' | 'data' | 'hero';
  optimization?: 'performance' | 'visual' | 'accessibility' | 'engagement';
  responsive?: boolean;
}> = ({ children, mode = 'auto', optimization = 'visual', responsive = true }) => {
  // Automatically detect the best layout based on content
  const detectOptimalLayout = () => {
    if (mode !== 'auto') return mode;
    
    // Analyze children to determine best layout
    const childCount = React.Children.count(children);
    const hasText = React.Children.toArray(children).some(child => 
      typeof child === 'string' || 
      (React.isValidElement(child) && child.type === 'p')
    );
    
    if (childCount === 1 && hasText) return 'hero';
    if (childCount > 6) return 'cards';
    if (childCount <= 3) return 'section';
    return 'data';
  };
  
  const optimalLayout = detectOptimalLayout();
  
  switch (optimalLayout) {
    case 'hero':
      return (
        <AdaptiveSection priority="hero" contentType="showcase">
          {children}
        </AdaptiveSection>
      );
    
    case 'section':
      return (
        <AdaptiveSection priority="primary" contentType="showcase">
          {children}
        </AdaptiveSection>
      );
    
    case 'cards':
      return (
        <AdaptiveSection priority="secondary" contentType="showcase">
          <AutoLayoutGrid optimize={optimization} adaptive={responsive}>
            {children}
          </AutoLayoutGrid>
        </AdaptiveSection>
      );
    
    case 'data':
      return (
        <AdaptiveSection priority="secondary" contentType="data">
          <SmartGrid itemType="stat" optimization="visual">
            {children}
          </SmartGrid>
        </AdaptiveSection>
      );
    
    default:
      return <>{children}</>;
  }
};

// Smart section wrapper that eliminates duplicate section patterns
export const SmartSection: React.FC<{
  title: string;
  subtitle?: string;
  children: ReactNode;
  variant?: 'hero' | 'primary' | 'secondary' | 'minimal';
  centerContent?: boolean;
  className?: string;
}> = ({ title, subtitle, children, variant = 'secondary', centerContent = true, className }) => {
  return (
    <UniversalSection
      title={title}
      subtitle={subtitle}
      variant={variant === 'hero' ? 'hero' : variant === 'primary' ? 'feature' : 'content'}
      layout={centerContent ? 'centered' : 'left'}
      background={variant === 'hero' ? 'gradient' : 'transparent'}
      className={className}
    >
      <LayoutOptimizer mode="auto" optimization="visual">
        {children}
      </LayoutOptimizer>
    </UniversalSection>
  );
};

// Smart card wrapper that eliminates duplicate card patterns  
export const SmartCard: React.FC<{
  children: ReactNode;
  variant?: 'default' | 'featured' | 'stat' | 'minimal';
  interactive?: boolean;
  className?: string;
  onClick?: () => void;
}> = ({ children, variant = 'default', interactive = false, className, onClick }) => {
  return (
    <UniversalCard
      variant={variant}
      hover={interactive}
      gradient={variant === 'featured'}
      className={className}
      onClick={onClick}
    >
      {children}
    </UniversalCard>
  );
};

// Smart grid that automatically optimizes layout
export const SmartGridLayout: React.FC<{
  items: any[];
  renderItem: (item: any, index: number) => ReactNode;
  type?: 'cards' | 'stats' | 'gallery' | 'masonry';
  optimization?: 'visual' | 'performance' | 'engagement';
  className?: string;
}> = ({ items, renderItem, type = 'cards', optimization = 'visual', className }) => {
  if (items.length > 50) {
    // Use infinite scroll for large datasets
    return (
      <div className={className}>
        <AutoLayoutGrid optimize={optimization} adaptive={true}>
          {items.slice(0, 20).map((item, index) => renderItem(item, index))}
        </AutoLayoutGrid>
        <div className="text-center mt-8">
          <button className="bg-gradient-to-r from-purple-600 to-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-80 transition-opacity">
            Load More ({items.length - 20} remaining)
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <UniversalGrid type={type} className={className}>
      {items.map((item, index) => renderItem(item, index))}
    </UniversalGrid>
  );
};

// Revolutionary text component that eliminates typography duplication
export const SmartText: React.FC<{
  children: ReactNode;
  variant?: 'hero' | 'title' | 'subtitle' | 'body' | 'caption';
  gradient?: boolean;
  center?: boolean;
  className?: string;
}> = ({ children, variant = 'body', gradient = false, center = false, className }) => {
  return (
    <UniversalText
      as={variant === 'hero' ? 'h1' : variant === 'title' ? 'h2' : variant === 'subtitle' ? 'h3' : 'p'}
      variant={variant}
      gradient={gradient}
      className={`${center ? 'text-center' : ''} ${className || ''}`}
    >
      {children}
    </UniversalText>
  );
};

// Page layout orchestrator that eliminates page duplication
export const SmartPageLayout: React.FC<{
  children: ReactNode;
  type: 'landing' | 'dashboard' | 'marketplace' | 'profile';
  showPerformanceMonitor?: boolean;
}> = ({ children, type, showPerformanceMonitor = false }) => {
  return (
    <LayoutOrchestrator type={type}>
      {children}
      {showPerformanceMonitor && process.env.NODE_ENV === 'development' && (
        <LayoutPerformanceMonitor />
      )}
    </LayoutOrchestrator>
  );
};

// Export commonly used layout components
export { AutoLayoutGrid, IntelligentMasonry, InfiniteOptimizedGrid, LayoutPerformanceMonitor } from './revolutionary-grid-system';
export { AdaptiveSection, SmartGrid } from './adaptive-layout-system';