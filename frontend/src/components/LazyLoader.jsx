import { useEffect, useRef, useCallback } from 'react';

const LazyLoader = ({ 
  onLoadMore, 
  hasMore, 
  isLoading, 
  threshold = 100,
  children,
  className = '',
  loadingComponent = null 
}) => {
  const observerRef = useRef(null);
  const loadingRef = useRef(null);

  const handleIntersection = useCallback((entries) => {
    const [entry] = entries;
    if (entry.isIntersecting && hasMore && !isLoading) {
      console.log('🔄 LazyLoader: Triggering load more');
      onLoadMore();
    }
  }, [hasMore, isLoading, onLoadMore]);

  useEffect(() => {
    const currentRef = loadingRef.current;
    
    if (!currentRef) return;

    observerRef.current = new IntersectionObserver(handleIntersection, {
      threshold: 0.1,
      rootMargin: `${threshold}px`
    });

    observerRef.current.observe(currentRef);

    return () => {
      if (observerRef.current && currentRef) {
        observerRef.current.unobserve(currentRef);
      }
    };
  }, [handleIntersection, threshold]);

  return (
    <div className={className}>
      {children}
      {hasMore && (
        <div 
          ref={loadingRef}
          className="flex justify-center py-4"
        >
          {isLoading ? (
            loadingComponent || (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Loading...</span>
              </div>
            )
          ) : (
            <div className="h-4" /> // Invisible trigger area
          )}
        </div>
      )}
    </div>
  );
};

export default LazyLoader;
