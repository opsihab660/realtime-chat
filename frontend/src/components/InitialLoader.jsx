import { useState, useEffect } from 'react';
import { ConversationListSkeleton } from './skeletons/ConversationSkeleton';
import { MessageListSkeleton } from './skeletons/MessageSkeleton';

const InitialLoader = ({ 
  isLoading, 
  hasData, 
  children, 
  type = 'conversations',
  className = '',
  minLoadTime = 500 // Minimum loading time to prevent flash
}) => {
  const [showLoader, setShowLoader] = useState(true);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, minLoadTime);

    return () => clearTimeout(timer);
  }, [minLoadTime]);

  useEffect(() => {
    if (!isLoading && minTimeElapsed) {
      setShowLoader(false);
    }
  }, [isLoading, minTimeElapsed]);

  if (showLoader) {
    return (
      <div className={className}>
        {type === 'conversations' ? (
          <ConversationListSkeleton
            count={6}
            variant="shimmer"
            staggered={true}
            className="p-2"
          />
        ) : type === 'messages' ? (
          <MessageListSkeleton
            count={4}
            variant="shimmer"
            randomPattern={true}
            className="p-4"
          />
        ) : (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-500 dark:text-gray-400">Loading...</span>
          </div>
        )}
      </div>
    );
  }

  return children;
};

export default InitialLoader;
