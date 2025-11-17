import React from 'react';

interface ProgressIndicatorProps {
  progress?: number; // 0-100
  status?: 'loading' | 'success' | 'error' | 'warning';
  message?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'circular' | 'linear' | 'dots';
}

export function ProgressIndicator({
  progress,
  status = 'loading',
  message,
  showPercentage = true,
  size = 'md',
  variant = 'circular',
}: ProgressIndicatorProps) {
  if (variant === 'circular') {
    return (
      <CircularProgress
        progress={progress}
        status={status}
        message={message}
        showPercentage={showPercentage}
        size={size}
      />
    );
  }

  if (variant === 'linear') {
    return (
      <LinearProgress
        progress={progress}
        status={status}
        message={message}
        showPercentage={showPercentage}
      />
    );
  }

  return <DotsProgress status={status} message={message} size={size} />;
}

function CircularProgress({
  progress,
  status,
  message,
  showPercentage,
  size,
}: Omit<ProgressIndicatorProps, 'variant'>) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const strokeWidth = size === 'sm' ? 3 : size === 'md' ? 4 : 5;
  const radius = size === 'sm' ? 14 : size === 'md' ? 20 : 28;
  const circumference = 2 * Math.PI * radius;
  const offset = progress ? circumference - (progress / 100) * circumference : 0;

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return '#14f195';
      case 'error':
        return '#ff4444';
      case 'warning':
        return '#ffa500';
      default:
        return '#9945ff';
    }
  };

  const getStatusGlow = () => {
    switch (status) {
      case 'success':
        return '0 0 20px rgba(20, 241, 149, 0.5)';
      case 'error':
        return '0 0 20px rgba(255, 68, 68, 0.5)';
      case 'warning':
        return '0 0 20px rgba(255, 165, 0, 0.5)';
      default:
        return '0 0 20px rgba(153, 69, 255, 0.5)';
    }
  };

  return (
    <div className="flex flex-col items-center space-y-3">
      <div className={`${sizeClasses[size!]} relative`}>
        <svg className="transform -rotate-90" viewBox="0 0 64 64">
          {/* Background circle */}
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke={getStatusColor()}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
            style={{
              filter: `drop-shadow(${getStatusGlow()})`,
            }}
          >
            {!progress && (
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 32 32"
                to="360 32 32"
                dur="1.5s"
                repeatCount="indefinite"
              />
            )}
          </circle>
        </svg>

        {/* Center icon or percentage */}
        {showPercentage && progress !== undefined ? (
          <div
            className="absolute inset-0 flex items-center justify-center text-xs font-bold"
            style={{ color: getStatusColor() }}
          >
            {Math.round(progress)}%
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-lg">
            {status === 'success' && '✓'}
            {status === 'error' && '✕'}
            {status === 'warning' && '!'}
          </div>
        )}
      </div>

      {message && (
        <p className="text-sm text-gray-300 text-center animate-pulse">{message}</p>
      )}
    </div>
  );
}

function LinearProgress({
  progress,
  status,
  message,
  showPercentage,
}: Omit<ProgressIndicatorProps, 'variant' | 'size'>) {
  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'from-green-500 to-emerald-500';
      case 'error':
        return 'from-red-500 to-orange-500';
      case 'warning':
        return 'from-yellow-500 to-amber-500';
      default:
        return 'from-purple-500 to-pink-500';
    }
  };

  return (
    <div className="w-full space-y-2">
      {message && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-300">{message}</p>
          {showPercentage && progress !== undefined && (
            <span className="text-sm font-bold text-purple-400">
              {Math.round(progress)}%
            </span>
          )}
        </div>
      )}

      <div className="h-2 bg-gray-800/50 rounded-full overflow-hidden backdrop-blur-sm">
        <div
          className={`h-full bg-gradient-to-r ${getStatusColor()} transition-all duration-500 ease-out relative overflow-hidden`}
          style={{ width: `${progress || 0}%` }}
        >
          {/* Animated shimmer */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        </div>

        {/* Indeterminate animation when no progress */}
        {progress === undefined && (
          <div
            className={`h-full w-1/3 bg-gradient-to-r ${getStatusColor()} animate-indeterminate`}
          />
        )}
      </div>
    </div>
  );
}

function DotsProgress({
  status,
  message,
  size,
}: Omit<ProgressIndicatorProps, 'variant' | 'progress' | 'showPercentage'>) {
  const dotSizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      default:
        return 'bg-purple-500';
    }
  };

  return (
    <div className="flex flex-col items-center space-y-3">
      <div className="flex space-x-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`${dotSizes[size!]} ${getStatusColor()} rounded-full animate-bounce`}
            style={{
              animationDelay: `${i * 0.15}s`,
              animationDuration: '0.8s',
            }}
          />
        ))}
      </div>
      {message && (
        <p className="text-sm text-gray-300 text-center animate-pulse">{message}</p>
      )}
    </div>
  );
}

// Inline loading spinner for buttons and compact spaces
export function InlineSpinner({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// Loading overlay for full-screen operations
export function LoadingOverlay({
  message = 'Loading...',
  progress,
}: {
  message?: string;
  progress?: number;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="glass p-8 rounded-2xl max-w-sm w-full mx-4 text-center">
        <ProgressIndicator
          progress={progress}
          message={message}
          size="lg"
          variant="circular"
        />
      </div>
    </div>
  );
}
