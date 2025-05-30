import React from 'react';
import { SkeletonText, SkeletonContainer } from '../SkeletonLoader';

/**
 * Skeleton for individual chat messages
 */
const MessageSkeleton = ({
  isOwn = false,
  className = '',
  variant = 'shimmer',
  messageLength = 'medium' // 'short', 'medium', 'long'
}) => {
  const lengthConfig = {
    short: { lines: 1, lastLineWidth: '60%' },
    medium: { lines: 2, lastLineWidth: '75%' },
    long: { lines: 3, lastLineWidth: '45%' }
  };

  const config = lengthConfig[messageLength];

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 ${className}`}>
      <div className={`
        max-w-xs lg:max-w-md px-4 py-3 rounded-lg
        ${isOwn
          ? 'bg-blue-100 dark:bg-blue-900/30'
          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
        }
      `}>
        {/* Message content skeleton */}
        <SkeletonText
          lines={config.lines}
          lastLineWidth={config.lastLineWidth}
          variant={variant}
          className="mb-2"
        />

        {/* Timestamp skeleton */}
        <div className={`flex items-center justify-between ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>
          <SkeletonText
            lines={1}
            variant={variant}
            className="w-16 text-xs"
          />

          {/* Read status for own messages */}
          {isOwn && (
            <div className="ml-2 w-4 h-4 rounded-full bg-blue-200 dark:bg-blue-700 animate-pulse"></div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Multiple message skeletons for loading state
 */
export const MessageListSkeleton = ({
  count = 6,
  className = '',
  variant = 'shimmer',
  randomPattern = true
}) => {
  const patterns = ['short', 'medium', 'long'];

  return (
    <SkeletonContainer className={`space-y-2 p-4 ${className}`}>
      {Array.from({ length: count }).map((_, index) => {
        const isOwn = Math.random() > 0.5;
        const messageLength = randomPattern
          ? patterns[Math.floor(Math.random() * patterns.length)]
          : 'medium';

        return (
          <div
            key={index}
            className="skeleton-fade-in"
            style={{ animationDelay: `${index * 150}ms` }}
          >
            <MessageSkeleton
              isOwn={isOwn}
              messageLength={messageLength}
              variant={variant}
            />
          </div>
        );
      })}
    </SkeletonContainer>
  );
};

/**
 * Typing message skeleton (for when someone is typing)
 */
export const TypingMessageSkeleton = ({
  className = '',
  username = 'Someone'
}) => {
  return (
    <div className={`flex justify-start mb-4 ${className}`}>
      <div className="max-w-xs lg:max-w-md px-4 py-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        {/* Typing indicator */}
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {username} is typing...
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * Empty chat skeleton (when no messages exist)
 */
export const EmptyChatSkeleton = ({
  className = '',
  variant = 'pulse'
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      {/* Chat icon skeleton */}
      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 animate-pulse mb-4"></div>

      {/* Text skeletons */}
      <SkeletonText
        lines={1}
        variant={variant}
        className="w-48 mb-2"
      />
      <SkeletonText
        lines={1}
        variant={variant}
        className="w-64"
      />
    </div>
  );
};

export default MessageSkeleton;
