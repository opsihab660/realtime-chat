import React, { useState } from 'react';
import { ConversationListSkeleton } from './skeletons/ConversationSkeleton';
import { MessageListSkeleton } from './skeletons/MessageSkeleton';
import { UserListSkeleton, UserProfileSkeleton, SearchBarSkeleton } from './skeletons/UserListSkeleton';
import SkeletonLoader, { SkeletonText, SkeletonAvatar, SkeletonButton, SkeletonCard } from './SkeletonLoader';

const SkeletonDemo = () => {
  const [activeVariant, setActiveVariant] = useState('shimmer');
  const [isLoading, setIsLoading] = useState(true);

  const variants = ['shimmer', 'pulse', 'wave'];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Skeleton Loading Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Beautiful skeleton loading animations for your chat application
          </p>
          
          {/* Controls */}
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Animation:
              </label>
              <select
                value={activeVariant}
                onChange={(e) => setActiveVariant(e.target.value)}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                {variants.map(variant => (
                  <option key={variant} value={variant}>
                    {variant.charAt(0).toUpperCase() + variant.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={() => setIsLoading(!isLoading)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              {isLoading ? 'Hide Skeletons' : 'Show Skeletons'}
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Basic Components */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Basic Components
              </h2>
              
              {/* Basic Skeleton Elements */}
              <SkeletonCard className="p-4">
                <SkeletonText lines={1} variant={activeVariant} className="mb-3" />
                <div className="flex items-center space-x-3 mb-4">
                  <SkeletonAvatar size={48} variant={activeVariant} />
                  <div className="flex-1">
                    <SkeletonText lines={2} variant={activeVariant} />
                  </div>
                </div>
                <SkeletonButton width="120px" variant={activeVariant} />
              </SkeletonCard>

              {/* User Profile Skeleton */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <UserProfileSkeleton variant={activeVariant} />
              </div>

              {/* Search Bar Skeleton */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <SearchBarSkeleton variant={activeVariant} />
              </div>
            </div>

            {/* Conversation List */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Conversation List
              </h2>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <ConversationListSkeleton 
                  count={5} 
                  variant={activeVariant}
                  staggered={true}
                />
              </div>
            </div>

            {/* Messages */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Chat Messages
              </h2>
              
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4 h-96 overflow-hidden">
                <MessageListSkeleton 
                  count={6} 
                  variant={activeVariant}
                  randomPattern={true}
                />
              </div>
            </div>
          </div>
        )}

        {/* User List Demo */}
        {isLoading && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              User List
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <UserListSkeleton 
                count={8} 
                variant={activeVariant}
                staggered={true}
              />
            </div>
          </div>
        )}

        {/* Code Examples */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Usage Examples
          </h2>
          
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Conversation List:</h3>
              <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-gray-800 dark:text-gray-200 overflow-x-auto">
{`<ConversationListSkeleton 
  count={6} 
  variant="shimmer"
  staggered={true}
/>`}
              </pre>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Message List:</h3>
              <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-gray-800 dark:text-gray-200 overflow-x-auto">
{`<MessageListSkeleton 
  count={8} 
  variant="shimmer"
  randomPattern={true}
/>`}
              </pre>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Basic Skeleton:</h3>
              <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-gray-800 dark:text-gray-200 overflow-x-auto">
{`<SkeletonLoader 
  width="200px" 
  height="20px" 
  variant="shimmer" 
/>`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonDemo;
