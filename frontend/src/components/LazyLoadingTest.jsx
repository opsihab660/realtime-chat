import { useState, useEffect } from 'react';

const LazyLoadingTest = ({ enabled = false }) => {
  const [stats, setStats] = useState({
    initialLoadTime: 0,
    totalApiCalls: 0,
    memoryUsage: 0,
    renderTime: 0
  });

  useEffect(() => {
    if (!enabled) return;

    const startTime = performance.now();
    let apiCallCount = 0;

    // Monitor fetch requests
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      apiCallCount++;
      setStats(prev => ({ ...prev, totalApiCalls: apiCallCount }));
      return originalFetch.apply(this, args);
    };

    // Monitor performance
    const updateStats = () => {
      const currentTime = performance.now();
      const loadTime = currentTime - startTime;
      
      let memoryUsage = 0;
      if (performance.memory) {
        memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
      }

      setStats(prev => ({
        ...prev,
        initialLoadTime: Math.round(loadTime),
        memoryUsage,
        renderTime: Math.round(performance.now())
      }));
    };

    const interval = setInterval(updateStats, 1000);
    updateStats();

    return () => {
      clearInterval(interval);
      window.fetch = originalFetch;
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="fixed top-4 right-4 bg-green-900/90 text-green-100 text-xs p-3 rounded-lg font-mono z-50 min-w-[200px] hidden">
      <div className="text-green-300 font-bold mb-2">🚀 Lazy Loading Stats</div>
      <div className="space-y-1">
        <div>Load Time: {stats.initialLoadTime}ms</div>
        <div>API Calls: {stats.totalApiCalls}</div>
        <div>Memory: {stats.memoryUsage}MB</div>
        <div className="text-green-400 text-[10px] mt-2">
          Performance optimized ✓
        </div>
      </div>
    </div>
  );
};

export default LazyLoadingTest;
