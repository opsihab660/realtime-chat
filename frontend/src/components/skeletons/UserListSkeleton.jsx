import React from 'react';
import { SkeletonAvatar, SkeletonText, SkeletonContainer } from '../SkeletonLoader';

/**
 * Skeleton for individual user items
 */
const UserSkeleton = ({ 
  className = '', 
  variant = 'shimmer',
  showStatus = true 
}) => {
  return (
    <div className={`flex items-center space-x-3 p-3 ${className}`}>
      {/* Avatar skeleton with status indicator */}
      <div className="relative flex-shrink-0">
        <SkeletonAvatar 
          size={40} 
          variant={variant}
        />
        {showStatus && (
          <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-green-400 animate-pulse border-2 border-white dark:border-gray-800"></div>
        )}
      </div>
      
      {/* User info skeleton */}
      <div className="flex-1 min-w-0">
        {/* Username skeleton */}
        <SkeletonText 
          lines={1} 
          variant={variant}
          className="w-3/4 mb-1"
        />
        
        {/* Status text skeleton */}
        <SkeletonText 
          lines={1} 
          variant={variant}
          className="w-1/2 text-xs"
        />
      </div>
    </div>
  );
};

/**
 * Multiple user skeletons for loading state
 */
export const UserListSkeleton = ({ 
  count = 8, 
  className = '',
  variant = 'shimmer',
  staggered = true 
}) => {
  return (
    <SkeletonContainer className={`${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <UserSkeleton
          key={index}
          variant={variant}
          className={staggered ? 'skeleton-fade-in border-b border-gray-100 dark:border-gray-700' : 'border-b border-gray-100 dark:border-gray-700'}
          style={staggered ? { animationDelay: `${index * 80}ms` } : {}}
        />
      ))}
    </SkeletonContainer>
  );
};

/**
 * User profile header skeleton
 */
export const UserProfileSkeleton = ({ 
  className = '',
  variant = 'shimmer' 
}) => {
  return (
    <div className={`p-4 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex items-center space-x-3">
        {/* Large avatar skeleton */}
        <SkeletonAvatar 
          size={56} 
          variant={variant}
          className="flex-shrink-0"
        />
        
        {/* User info skeleton */}
        <div className="flex-1 min-w-0">
          {/* Username skeleton */}
          <SkeletonText 
            lines={1} 
            variant={variant}
            className="w-2/3 mb-2"
          />
          
          {/* Email skeleton */}
          <SkeletonText 
            lines={1} 
            variant={variant}
            className="w-3/4 text-sm"
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Search bar skeleton
 */
export const SearchBarSkeleton = ({ 
  className = '',
  variant = 'pulse' 
}) => {
  return (
    <div className={`p-4 ${className}`}>
      <div className="relative">
        <div className={`
          w-full h-10 rounded-lg border border-gray-200 dark:border-gray-700
          ${variant === 'pulse' ? 'skeleton-pulse' : 'skeleton'}
        `}></div>
        
        {/* Search icon skeleton */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 rounded bg-gray-300 dark:bg-gray-600 animate-pulse"></div>
      </div>
    </div>
  );
};

/**
 * Online users section skeleton
 */
export const OnlineUsersSkeleton = ({ 
  count = 5, 
  className = '',
  variant = 'shimmer' 
}) => {
  return (
    <div className={`${className}`}>
      {/* Section header skeleton */}
      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <SkeletonText 
          lines={1} 
          variant={variant}
          className="w-24 text-sm font-medium"
        />
      </div>
      
      {/* Online users list */}
      <UserListSkeleton 
        count={count} 
        variant={variant}
        staggered={true}
      />
    </div>
  );
};

export default UserSkeleton;
