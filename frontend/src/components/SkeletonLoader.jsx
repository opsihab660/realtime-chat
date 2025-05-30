import React from 'react';

/**
 * Base Skeleton Component with multiple animation variants
 */
const SkeletonLoader = ({ 
  width = '100%', 
  height = '1rem', 
  className = '', 
  variant = 'shimmer', // 'shimmer', 'pulse', 'wave'
  rounded = false,
  children 
}) => {
  const baseClasses = 'inline-block';
  const variantClasses = {
    shimmer: 'skeleton',
    pulse: 'skeleton-pulse', 
    wave: 'skeleton-wave'
  };
  
  const roundedClass = rounded ? 'skeleton-avatar' : '';
  
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${roundedClass} ${className}`}
      style={style}
      aria-label="Loading..."
      role="status"
    >
      {children}
    </div>
  );
};

/**
 * Skeleton Text Component
 */
export const SkeletonText = ({ 
  lines = 1, 
  className = '', 
  variant = 'shimmer',
  lastLineWidth = '75%' 
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonLoader
          key={index}
          height="0.875rem"
          width={index === lines - 1 ? lastLineWidth : '100%'}
          variant={variant}
          className="skeleton-text"
        />
      ))}
    </div>
  );
};

/**
 * Skeleton Avatar Component
 */
export const SkeletonAvatar = ({ 
  size = 40, 
  className = '', 
  variant = 'shimmer' 
}) => {
  return (
    <SkeletonLoader
      width={size}
      height={size}
      rounded={true}
      variant={variant}
      className={className}
    />
  );
};

/**
 * Skeleton Button Component
 */
export const SkeletonButton = ({ 
  width = '100px', 
  height = '2.5rem', 
  className = '', 
  variant = 'shimmer' 
}) => {
  return (
    <SkeletonLoader
      width={width}
      height={height}
      variant={variant}
      className={`skeleton-button ${className}`}
    />
  );
};

/**
 * Skeleton Card Component
 */
export const SkeletonCard = ({ 
  className = '', 
  variant = 'shimmer',
  children 
}) => {
  return (
    <div className={`skeleton-card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 ${className}`}>
      {children}
    </div>
  );
};

/**
 * Skeleton Container with fade-in animation
 */
export const SkeletonContainer = ({ 
  className = '', 
  children,
  delay = 0 
}) => {
  const style = delay > 0 ? { animationDelay: `${delay}ms` } : {};
  
  return (
    <div 
      className={`skeleton-container ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};

export default SkeletonLoader;
