import { useState, useEffect, useMemo, useRef } from 'react';

const HeaderTypingIndicator = ({ typingUsers, currentUser, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const hideTimeoutRef = useRef(null);

  // Memoize typing status to prevent unnecessary re-renders
  const hasTypingUsers = useMemo(() => typingUsers.length > 0, [typingUsers.length]);

  // Handle visibility with smooth transitions and enhanced stability
  useEffect(() => {
    // Clear any existing hide timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    if (hasTypingUsers) {
      setIsVisible(true);
      setAnimationKey(prev => prev + 1);
    } else {
      // Delay hiding for better UX and consistency - much longer for better visibility
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 1500); // Much longer delay for better consistency and visibility
    }

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [hasTypingUsers]);

  // Get typing text based on users
  const getTypingText = () => {
    if (!currentUser) return 'Someone is typing';
    return `${currentUser.username} is typing`;
  };

  if (!isVisible) return null;

  return (
    <div className={`typing-status-bar bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-blue-200 dark:border-blue-800 px-3 sm:px-4 py-2 sm:py-3 ${className}`}>
      <div className="flex items-center space-x-3" key={animationKey}>
        {/* Enhanced typing dots for header */}
        <div className="flex items-center space-x-1">
          <div className="header-typing-dot header-typing-dot-1"></div>
          <div className="header-typing-dot header-typing-dot-2"></div>
          <div className="header-typing-dot header-typing-dot-3"></div>
        </div>

        {/* Typing text with animation */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300 typing-text-animation">
            {getTypingText()}
          </span>
          <div className="typing-pulse-indicator"></div>
        </div>
      </div>
    </div>
  );
};

export default HeaderTypingIndicator;
