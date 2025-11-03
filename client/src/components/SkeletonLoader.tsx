/**
 * Modern Skeleton Loader Component
 * Replaces spinners with elegant loading states
 */

import React from 'react';

interface SkeletonLoaderProps {
  variant?: 'card' | 'text' | 'circle' | 'grid';
  count?: number;
  className?: string;
}

export default function SkeletonLoader({ 
  variant = 'card', 
  count = 1,
  className = '' 
}: SkeletonLoaderProps) {
  if (variant === 'text') {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="skeleton h-4 w-full" style={{ width: `${80 + Math.random() * 20}%` }} />
        ))}
      </div>
    );
  }

  if (variant === 'circle') {
    return (
      <div className={`flex gap-4 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="skeleton h-16 w-16 rounded-full" />
        ))}
      </div>
    );
  }

  if (variant === 'grid') {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="card-modern">
            <div className="skeleton h-48 w-full mb-4 rounded-xl" />
            <div className="skeleton h-6 w-3/4 mb-3" />
            <div className="skeleton h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  // Default: card variant
  return (
    <div className={`space-y-6 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card-modern">
          <div className="skeleton h-64 w-full mb-4 rounded-xl" />
          <div className="skeleton h-8 w-3/4 mb-3" />
          <div className="skeleton h-4 w-full mb-2" />
          <div className="skeleton h-4 w-5/6" />
        </div>
      ))}
    </div>
  );
}

// Specific skeleton components for common use cases
export function NFTCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-modern overflow-hidden">
          <div className="skeleton aspect-square w-full" />
          <div className="p-4 space-y-3">
            <div className="skeleton h-6 w-3/4" />
            <div className="skeleton h-4 w-1/2" />
            <div className="flex items-center justify-between mt-4">
              <div className="skeleton h-8 w-20" />
              <div className="skeleton h-8 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass-modern p-6">
          <div className="skeleton h-12 w-12 rounded-2xl mb-4" />
          <div className="skeleton h-8 w-24 mb-2" />
          <div className="skeleton h-4 w-32" />
        </div>
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="skeleton h-16 w-3/4 mb-6 max-w-4xl" />
      <div className="skeleton h-8 w-2/3 mb-12 max-w-2xl" />
      <div className="flex gap-4 mb-16">
        <div className="skeleton h-14 w-40 rounded-2xl" />
        <div className="skeleton h-14 w-40 rounded-2xl" />
      </div>
      <div className="flex gap-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-32 w-40 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

