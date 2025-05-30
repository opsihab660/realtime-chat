import React, { useState, useEffect } from 'react';
import { ConversationListSkeleton } from './skeletons/ConversationSkeleton';
import { MessageListSkeleton } from './skeletons/MessageSkeleton';

/**
 * Component to showcase skeleton loading in a realistic chat interface
 */
const SkeletonShowcase = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState(0);

  // Simulate loading sequence
  useEffect(() => {
    const steps = [
      { duration: 2000, step: 0 }, // Show conversation skeletons
      { duration: 1500, step: 1 }, // Show message skeletons
      { duration: 1000, step: 2 }, // Show both
      { duration: 500, step: 3 },  // Hide loading
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setLoadingStep(steps[currentStep].step);
        if (steps[currentStep].step === 3) {
          setIsLoading(false);
        }
        currentStep++;
      } else {
        clearInterval(interval);
      }
    }, steps[currentStep]?.duration || 1000);

    return () => clearInterval(interval);
  }, []);

  const resetDemo = () => {
    setIsLoading(true);
    setLoadingStep(0);
  };

  return (
    <div className="h-screen w-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            Skeleton Loading Demo
          </h1>
          <button
            onClick={resetDemo}
            className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
          >
            Restart Demo
          </button>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-hidden">
          {isLoading && (loadingStep === 0 || loadingStep === 2) ? (
            <ConversationListSkeleton 
              count={8} 
              variant="shimmer"
              staggered={true}
            />
          ) : (
            <div className="p-4">
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">U{i}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">User {i}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Last message...</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium">JD</span>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">John Doe</h2>
              <p className="text-sm text-green-600 dark:text-green-400">Online</p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
          {isLoading && (loadingStep === 1 || loadingStep === 2) ? (
            <MessageListSkeleton 
              count={6} 
              variant="shimmer"
              randomPattern={true}
            />
          ) : (
            <div className="space-y-4">
              {/* Sample messages */}
              <div className="flex justify-start">
                <div className="max-w-xs bg-white dark:bg-gray-700 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600">
                  <p className="text-sm text-gray-900 dark:text-white">Hey! How are you doing?</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">10:30 AM</p>
                </div>
              </div>
              
              <div className="flex justify-end">
                <div className="max-w-xs bg-blue-600 text-white px-4 py-2 rounded-lg">
                  <p className="text-sm">I'm doing great! Thanks for asking.</p>
                  <p className="text-xs text-blue-100 mt-1">10:32 AM</p>
                </div>
              </div>
              
              <div className="flex justify-start">
                <div className="max-w-xs bg-white dark:bg-gray-700 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600">
                  <p className="text-sm text-gray-900 dark:text-white">That's awesome! Want to grab coffee later?</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">10:35 AM</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center space-x-3">
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="w-10 h-10 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonShowcase;
