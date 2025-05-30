import { useState, useEffect, useRef, useMemo, memo } from 'react';

const TypingIndicator = memo(({ typingUsers, timestamp, className = '', onVisibilityChange }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [animationClass, setAnimationClass] = useState('');
  const [animationKey, setAnimationKey] = useState(0);
  const animationTimeoutRef = useRef(null);
  const lastTimestampRef = useRef(0);
  const visibilityTimeoutRef = useRef(null);

  // Memoize typing users to prevent unnecessary re-renders
  const hasTypingUsers = useMemo(() => typingUsers.length > 0, [typingUsers.length]);

  // Ultra-fast visibility handling - reduced delays for instant response
  useEffect(() => {
    // Clear any existing visibility timeout
    if (visibilityTimeoutRef.current) {
      clearTimeout(visibilityTimeoutRef.current);
      visibilityTimeoutRef.current = null;
    }

    if (hasTypingUsers) {
      // ✅ INSTANT visibility (0ms lag)
      setIsVisible(true);
      setAnimationClass('ultra-fast-typing-enter');

      // Notify parent immediately for instant auto-scroll
      if (onVisibilityChange) {
        onVisibilityChange(true);
      }
    } else {
      setAnimationClass('ultra-fast-typing-exit');

      // Reduced hide delay from 1200ms to 300ms for faster cleanup
      visibilityTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
        if (onVisibilityChange) {
          onVisibilityChange(false);
        }
      }, 300);
    }
  }, [hasTypingUsers, onVisibilityChange]);

  // Ultra-fast animation restart - reduced throttle for instant response
  useEffect(() => {
    if (timestamp && hasTypingUsers && timestamp !== lastTimestampRef.current) {
      lastTimestampRef.current = timestamp;

      // Clear any existing timeout to prevent animation conflicts
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }

      // Reduced throttle from 50ms to 16ms (60fps) for ultra-smooth tracking
      animationTimeoutRef.current = setTimeout(() => {
        setAnimationKey(prev => prev + 1);
      }, 16);
    }

    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [timestamp, hasTypingUsers]);

  // Enhanced cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
      }
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`flex justify-start ${className}`}>
      <div className={`
        bg-white dark:bg-gray-700
        border border-gray-200 dark:border-gray-600
        rounded-2xl px-3 py-2.5
        shadow-sm
        ${animationClass}
        ultra-fast-typing-container
        transform-gpu
      `}>
        {/* Ultra-fast typing dots with hardware acceleration */}
        <div className="flex items-center justify-center space-x-1.5" key={animationKey}>
          <div className="ultra-fast-typing-dot ultra-fast-typing-dot-1"></div>
          <div className="ultra-fast-typing-dot ultra-fast-typing-dot-2"></div>
          <div className="ultra-fast-typing-dot ultra-fast-typing-dot-3"></div>
        </div>
      </div>
    </div>
  );
});

export default TypingIndicator;
