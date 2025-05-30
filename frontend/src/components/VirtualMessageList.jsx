import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { memoryManager } from '../utils/memoryManager';

// 🚀 VIRTUAL SCROLLING - Render only visible messages for smooth performance
const VirtualMessageList = ({ 
  messages, 
  renderMessage, 
  itemHeight = 80, 
  containerHeight = 400,
  overscan = 5,
  onLoadMore,
  hasMore,
  isLoading 
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const containerRef = useRef(null);
  const scrollTimeoutRef = useRef(null);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      messages.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, overscan, messages.length]);

  // Get visible items
  const visibleItems = useMemo(() => {
    const { startIndex, endIndex } = visibleRange;
    return messages.slice(startIndex, endIndex + 1).map((message, index) => ({
      message,
      index: startIndex + index,
      top: (startIndex + index) * itemHeight
    }));
  }, [messages, visibleRange, itemHeight]);

  // Handle scroll with throttling
  const handleScroll = useCallback(
    memoryManager.throttle((e) => {
      const newScrollTop = e.target.scrollTop;
      setScrollTop(newScrollTop);
      setIsScrolling(true);

      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Set scrolling to false after scroll ends
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);

      // Load more when near top
      if (newScrollTop < itemHeight * 3 && hasMore && !isLoading && onLoadMore) {
        onLoadMore();
      }
    }, 16),
    [itemHeight, hasMore, isLoading, onLoadMore]
  );

  // Setup scroll listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cleanup = memoryManager.registerEventListener(
      container,
      'scroll',
      handleScroll,
      { passive: true }
    );

    return cleanup;
  }, [handleScroll]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      const maxScrollTop = messages.length * itemHeight - containerHeight;
      containerRef.current.scrollTop = Math.max(0, maxScrollTop);
    }
  }, [messages.length, itemHeight, containerHeight]);

  // Scroll to specific message
  const scrollToMessage = useCallback((messageIndex) => {
    if (containerRef.current) {
      const targetScrollTop = messageIndex * itemHeight;
      containerRef.current.scrollTop = targetScrollTop;
    }
  }, [itemHeight]);

  return (
    <div className="virtual-message-list">
      {/* Loading indicator at top */}
      {isLoading && (
        <div className="flex justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Virtual scroll container */}
      <div
        ref={containerRef}
        className="overflow-auto"
        style={{ height: containerHeight }}
      >
        {/* Total height spacer */}
        <div style={{ height: messages.length * itemHeight, position: 'relative' }}>
          {/* Visible items */}
          {visibleItems.map(({ message, index, top }) => (
            <div
              key={message._id || `message-${index}`}
              style={{
                position: 'absolute',
                top,
                left: 0,
                right: 0,
                height: itemHeight,
                transform: isScrolling ? 'translateZ(0)' : 'none' // GPU acceleration during scroll
              }}
              className="virtual-message-item"
            >
              {renderMessage(message, index)}
            </div>
          ))}
        </div>
      </div>

      {/* Scroll controls */}
      <div className="virtual-scroll-controls absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={scrollToBottom}
          className="bg-blue-500 text-white p-2 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
          title="Scroll to bottom"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Enhanced Virtual Message List with dynamic heights
const DynamicVirtualMessageList = ({ 
  messages, 
  renderMessage, 
  estimatedItemHeight = 80,
  containerHeight = 400,
  overscan = 5,
  onLoadMore,
  hasMore,
  isLoading 
}) => {
  const [itemHeights, setItemHeights] = useState(new Map());
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);
  const itemRefs = useRef(new Map());

  // Measure item heights
  const measureItem = useCallback((index, element) => {
    if (element) {
      const height = element.getBoundingClientRect().height;
      setItemHeights(prev => {
        const newHeights = new Map(prev);
        newHeights.set(index, height);
        return newHeights;
      });
    }
  }, []);

  // Calculate positions
  const itemPositions = useMemo(() => {
    const positions = [];
    let totalHeight = 0;

    for (let i = 0; i < messages.length; i++) {
      positions[i] = totalHeight;
      const height = itemHeights.get(i) || estimatedItemHeight;
      totalHeight += height;
    }

    return { positions, totalHeight };
  }, [messages.length, itemHeights, estimatedItemHeight]);

  // Calculate visible range for dynamic heights
  const visibleRange = useMemo(() => {
    const { positions } = itemPositions;
    let startIndex = 0;
    let endIndex = messages.length - 1;

    // Find start index
    for (let i = 0; i < positions.length; i++) {
      if (positions[i] >= scrollTop - overscan * estimatedItemHeight) {
        startIndex = Math.max(0, i - 1);
        break;
      }
    }

    // Find end index
    for (let i = startIndex; i < positions.length; i++) {
      if (positions[i] >= scrollTop + containerHeight + overscan * estimatedItemHeight) {
        endIndex = i;
        break;
      }
    }

    return { startIndex, endIndex };
  }, [scrollTop, containerHeight, overscan, estimatedItemHeight, itemPositions]);

  // Get visible items with dynamic positioning
  const visibleItems = useMemo(() => {
    const { startIndex, endIndex } = visibleRange;
    const { positions } = itemPositions;
    
    return messages.slice(startIndex, endIndex + 1).map((message, index) => ({
      message,
      index: startIndex + index,
      top: positions[startIndex + index] || 0
    }));
  }, [messages, visibleRange, itemPositions]);

  // Handle scroll
  const handleScroll = useCallback(
    memoryManager.throttle((e) => {
      setScrollTop(e.target.scrollTop);
      
      // Load more when near top
      if (e.target.scrollTop < estimatedItemHeight * 3 && hasMore && !isLoading && onLoadMore) {
        onLoadMore();
      }
    }, 16),
    [estimatedItemHeight, hasMore, isLoading, onLoadMore]
  );

  // Setup scroll listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cleanup = memoryManager.registerEventListener(
      container,
      'scroll',
      handleScroll,
      { passive: true }
    );

    return cleanup;
  }, [handleScroll]);

  return (
    <div className="dynamic-virtual-message-list">
      <div
        ref={containerRef}
        className="overflow-auto"
        style={{ height: containerHeight }}
      >
        <div style={{ height: itemPositions.totalHeight, position: 'relative' }}>
          {visibleItems.map(({ message, index, top }) => (
            <div
              key={message._id || `message-${index}`}
              ref={(el) => {
                if (el) {
                  itemRefs.current.set(index, el);
                  measureItem(index, el);
                }
              }}
              style={{
                position: 'absolute',
                top,
                left: 0,
                right: 0
              }}
            >
              {renderMessage(message, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VirtualMessageList;
export { DynamicVirtualMessageList };
