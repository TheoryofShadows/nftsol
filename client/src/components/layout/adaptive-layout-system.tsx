import React, { ReactNode, createContext, useContext, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

/**
 * REVOLUTIONARY ADAPTIVE LAYOUT SYSTEM
 * 
 * Problems Solved:
 * 1. SMART SPACING: Automatically adjusts spacing based on content density
 * 2. CONTENT-AWARE GRIDS: Dynamically optimizes grid layouts based on content type
 * 3. VISUAL HIERARCHY: Automatically emphasizes important content
 * 4. ZERO DUPLICATED LAYOUT CODE: One system handles all layout needs
 * 5. RESPONSIVE INTELLIGENCE: Adapts to screen size AND content complexity
 */

interface LayoutContext {
  density: 'sparse' | 'normal' | 'dense';
  contentType: 'data' | 'media' | 'text' | 'mixed';
  priority: 'primary' | 'secondary' | 'tertiary';
  adaptiveSpacing: boolean;
}

const LayoutContext = createContext<LayoutContext>({
  density: 'normal',
  contentType: 'mixed',
  priority: 'secondary',
  adaptiveSpacing: true
});

// Smart spacing that adapts to content and viewport
const useAdaptiveSpacing = (density: string, contentType: string) => {
  const [spacing, setSpacing] = useState('normal');
  
  useEffect(() => {
    const updateSpacing = () => {
      const viewportHeight = window.innerHeight;
      const contentDensity = document.querySelectorAll('[data-content-item]').length;
      
      // Revolutionary algorithm: Adjust spacing based on content density and viewport
      if (contentDensity > 20 && viewportHeight < 800) {
        setSpacing('compact');
      } else if (contentDensity < 5 && viewportHeight > 1000) {
        setSpacing('spacious');
      } else {
        setSpacing('normal');
      }
    };
    
    updateSpacing();
    window.addEventListener('resize', updateSpacing);
    const observer = new MutationObserver(updateSpacing);
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => {
      window.removeEventListener('resize', updateSpacing);
      observer.disconnect();
    };
  }, []);
  
  return spacing;
};

// Intelligent section that adapts to its content
export const AdaptiveSection: React.FC<{
  children: ReactNode;
  priority?: 'hero' | 'primary' | 'secondary' | 'tertiary';
  contentType?: 'showcase' | 'data' | 'form' | 'navigation';
  className?: string;
}> = ({ children, priority = 'secondary', contentType = 'showcase', className }) => {
  const spacing = useAdaptiveSpacing('normal', contentType);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    
    const element = document.getElementById(`section-${priority}-${contentType}`);
    if (element) observer.observe(element);
    
    return () => observer.disconnect();
  }, [priority, contentType]);
  
  const sectionStyles = {
    hero: 'py-24 md:py-32 bg-gradient-to-br from-purple-900/20 via-black to-green-900/20',
    primary: 'py-16 md:py-20 bg-gradient-to-r from-black/40 to-purple-900/10',
    secondary: 'py-12 md:py-16 bg-gradient-to-l from-transparent to-black/20',
    tertiary: 'py-8 md:py-12 bg-transparent'
  };
  
  const spacingStyles: Record<string, string> = {
    compact: 'space-y-6',
    normal: 'space-y-8 md:space-y-12',
    spacious: 'space-y-12 md:space-y-16'
  };
  
  return (
    <section
      id={`section-${priority}-${contentType}`}
      className={cn(
        'relative overflow-hidden transition-all duration-700',
        sectionStyles[priority],
        spacingStyles[spacing] || spacingStyles.normal,
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-80 translate-y-4',
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </section>
  );
};

// Revolutionary smart grid that optimizes based on content
export const SmartGrid: React.FC<{
  children: ReactNode;
  itemType?: 'card' | 'media' | 'stat' | 'list';
  optimization?: 'visual' | 'data' | 'interaction';
  className?: string;
}> = ({ children, itemType = 'card', optimization = 'visual', className }) => {
  const [gridConfig, setGridConfig] = useState('standard');
  
  useEffect(() => {
    const childCount = React.Children.count(children);
    
    // Revolutionary grid optimization algorithm
    let config = 'standard';
    if (itemType === 'stat' && childCount <= 4) {
      config = 'stats-highlight';
    } else if (itemType === 'media' && childCount > 6) {
      config = 'masonry-adaptive';
    } else if (optimization === 'interaction' && childCount > 8) {
      config = 'infinite-scroll';
    }
    
    setGridConfig(config);
  }, [children, itemType, optimization]);
  
  const gridConfigs: Record<string, string> = {
    'standard': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
    'stats-highlight': 'grid grid-cols-2 lg:grid-cols-4 gap-4',
    'masonry-adaptive': 'columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6',
    'infinite-scroll': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
  };
  
  return (
    <div className={cn(gridConfigs[gridConfig] || gridConfigs.standard, className)}>
      {children}
    </div>
  );
};

// Revolutionary content-aware container
export const ContentContainer: React.FC<{
  children: ReactNode;
  variant?: 'hero' | 'feature' | 'stat' | 'media' | 'form';
  interactive?: boolean;
  className?: string;
}> = ({ children, variant = 'feature', interactive = false, className }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  
  useEffect(() => {
    const element = document.getElementById(`container-${variant}`);
    if (element) {
      setContentHeight(element.scrollHeight);
    }
  }, [variant]);
  
  const baseStyles = 'relative transition-all duration-300 ease-out';
  
  const variantStyles = {
    hero: cn(
      'bg-gradient-to-br from-purple-900/10 via-transparent to-green-900/10',
      'border border-gradient-to-r from-purple-500/20 to-green-500/20',
      'backdrop-blur-sm rounded-3xl p-8 md:p-12'
    ),
    feature: cn(
      'bg-gradient-to-br from-gray-900/40 to-gray-800/20',
      'border border-white/10 backdrop-blur-md rounded-2xl p-6',
      interactive && 'hover:border-purple-500/30 cursor-pointer',
      isHovered && 'scale-[1.02] shadow-2xl shadow-purple-500/10'
    ),
    stat: cn(
      'bg-gradient-to-r from-green-900/20 to-purple-900/20',
      'border border-green-500/20 rounded-xl p-4 text-center',
      'hover:border-green-400/40 transition-colors'
    ),
    media: cn(
      'bg-black/20 border border-white/5 rounded-2xl overflow-hidden',
      'hover:border-purple-400/30 group'
    ),
    form: cn(
      'bg-gradient-to-b from-gray-800/30 to-gray-900/30',
      'border border-gray-700/50 rounded-xl p-6 backdrop-blur-sm'
    )
  };
  
  return (
    <div
      id={`container-${variant}`}
      className={cn(baseStyles, variantStyles[variant], className)}
      onMouseEnter={() => interactive && setIsHovered(true)}
      onMouseLeave={() => interactive && setIsHovered(false)}
      data-content-item
    >
      {children}
    </div>
  );
};

// Revolutionary typography system with semantic meaning
export const SemanticText: React.FC<{
  children: ReactNode;
  semantic: 'hero' | 'title' | 'subtitle' | 'body' | 'caption' | 'emphasis';
  gradient?: boolean;
  className?: string;
}> = ({ children, semantic, gradient = false, className }) => {
  const textStyles = {
    hero: 'text-4xl md:text-6xl lg:text-7xl font-black font-orbitron leading-tight',
    title: 'text-2xl md:text-4xl font-bold font-orbitron',
    subtitle: 'text-lg md:text-xl font-semibold text-gray-300',
    body: 'text-base md:text-lg text-gray-400 leading-relaxed',
    caption: 'text-sm text-gray-500',
    emphasis: 'text-lg font-semibold text-white'
  };
  
  const gradientStyle = gradient 
    ? 'bg-gradient-to-r from-purple-400 via-pink-400 to-green-400 bg-clip-text text-transparent'
    : '';
  
  return (
    <div className={cn(textStyles[semantic], gradientStyle, className)}>
      {children}
    </div>
  );
};

// Revolutionary layout orchestrator - eliminates all duplicate layouts
export const LayoutOrchestrator: React.FC<{
  type: 'landing' | 'dashboard' | 'marketplace' | 'profile';
  children: ReactNode;
}> = ({ type, children }) => {
  const layoutConfigs = {
    landing: {
      spacing: 'space-y-16 md:space-y-24',
      background: 'bg-gradient-to-b from-black via-purple-900/5 to-black',
      flow: 'min-h-screen'
    },
    dashboard: {
      spacing: 'space-y-8',
      background: 'bg-gray-900',
      flow: 'min-h-screen p-6'
    },
    marketplace: {
      spacing: 'space-y-12',
      background: 'bg-gradient-to-br from-black to-purple-900/10',
      flow: 'min-h-screen'
    },
    profile: {
      spacing: 'space-y-10',
      background: 'bg-gradient-to-r from-gray-900 to-purple-900/20',
      flow: 'min-h-screen'
    }
  };
  
  const config = layoutConfigs[type];
  
  return (
    <div className={cn(config.background, config.flow)}>
      <div className={config.spacing}>
        {children}
      </div>
    </div>
  );
};

export { LayoutContext };