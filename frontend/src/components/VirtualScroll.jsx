import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

const VirtualScroll = ({
  items,
  itemHeight = 80,
  containerHeight = 400,
  renderItem,
  overscan = 5,
  onLoadMore,
  hasMore,
  isLoading,
  className = ''
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);
  const scrollElementRef = useRef(null);

  const handleScroll = useCallback((e) => {
    const newScrollTop = e.target.scrollTop;
    setScrollTop(newScrollTop);

    // Check if we need to load more items
    if (hasMore && !isLoading && onLoadMore) {
      const { scrollTop, scrollHeight, clientHeight } = e.target;
      if (scrollHeight - scrollTop - clientHeight < 200) {
        onLoadMore();
      }
    }
  }, [hasMore, isLoading, onLoadMore]);

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  const visibleItems = useMemo(() => {
    const { startIndex, endIndex } = visibleRange;
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index,
      top: (startIndex + index) * itemHeight
    }));
  }, [items, visibleRange, itemHeight]);

  const totalHeight = items.length * itemHeight;

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div 
        ref={scrollElementRef}
        style={{ height: totalHeight, position: 'relative' }}
      >
        {visibleItems.map(({ item, index, top }) => (
          <div
            key={item._id || index}
            style={{
              position: 'absolute',
              top,
              left: 0,
              right: 0,
              height: itemHeight
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div 
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VirtualScroll;
