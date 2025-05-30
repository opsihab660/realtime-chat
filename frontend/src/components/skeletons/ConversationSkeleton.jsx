import React from 'react';
import { SkeletonAvatar, SkeletonText, SkeletonContainer } from '../SkeletonLoader';

/**
 * Skeleton for individual conversation items in the sidebar
 */
const ConversationSkeleton = ({
  className = '',
  variant = 'shimmer',
  showTyping = false
}) => {
  return (
    <div className={`p-3 border-b border-gray-100 dark:border-gray-700 ${className}`}>
      <div className="flex items-center space-x-3">
        {/* Avatar skeleton */}
        <SkeletonAvatar
          size={48}
          variant={variant}
          className="flex-shrink-0"
        />

        {/* Content skeleton */}
        <div className="flex-1 min-w-0">
          {/* Username skeleton */}
          <div className="mb-1">
            <SkeletonText
              lines={1}
              variant={variant}
              className="w-3/4"
            />
          </div>

          {/* Last message skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex-1 mr-2">
              {showTyping ? (
                <div className="flex items-center space-x-1">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <span className="text-xs text-blue-600 dark:text-blue-400 ml-2">typing...</span>
                </div>
              ) : (
                <SkeletonText
                  lines={1}
                  variant={variant}
                  lastLineWidth="60%"
                />
              )}
            </div>

            {/* Time skeleton */}
            <div className="w-12">
              <SkeletonText
                lines={1}
                variant={variant}
                className="text-xs"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Multiple conversation skeletons for loading state
 */
export const ConversationListSkeleton = ({
  count = 5,
  className = '',
  variant = 'shimmer',
  staggered = true
}) => {
  return (
    <SkeletonContainer className={`space-y-0 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={staggered ? 'skeleton-fade-in' : ''}
          style={staggered ? { animationDelay: `${index * 100}ms` } : {}}
        >
          <ConversationSkeleton
            variant={variant}
          />
        </div>
      ))}
    </SkeletonContainer>
  );
};

/**
 * Search results skeleton
 */
export const SearchResultsSkeleton = ({
  count = 3,
  className = '',
  variant = 'pulse'
}) => {
  return (
    <div className={`p-4 ${className}`}>
      <div className="mb-4">
        <SkeletonText
          lines={1}
          variant={variant}
          className="w-1/3 text-sm"
        />
      </div>
      <ConversationListSkeleton
        count={count}
        variant={variant}
        staggered={true}
      />
    </div>
  );
};

export default ConversationSkeleton;
