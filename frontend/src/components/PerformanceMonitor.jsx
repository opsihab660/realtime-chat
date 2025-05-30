import { useEffect, useState } from 'react';

const PerformanceMonitor = ({ enabled = false }) => {
  const [metrics, setMetrics] = useState({
    inputLag: 0,
    renderTime: 0,
    socketEvents: 0
  });

  useEffect(() => {
    if (!enabled) return;

    let socketEventCount = 0;
    let lastInputTime = 0;
    let renderStartTime = 0;

    // Monitor input lag
    const handleInput = () => {
      const now = performance.now();
      if (lastInputTime > 0) {
        const lag = now - lastInputTime;
        setMetrics(prev => ({ ...prev, inputLag: Math.round(lag) }));
      }
      lastInputTime = now;
    };

    // Monitor render performance
    const handleRenderStart = () => {
      renderStartTime = performance.now();
    };

    const handleRenderEnd = () => {
      if (renderStartTime > 0) {
        const renderTime = performance.now() - renderStartTime;
        setMetrics(prev => ({ ...prev, renderTime: Math.round(renderTime) }));
      }
    };

    // Monitor socket events
    const originalEmit = window.socket?.emit;
    if (window.socket && originalEmit) {
      window.socket.emit = function(...args) {
        socketEventCount++;
        setMetrics(prev => ({ ...prev, socketEvents: socketEventCount }));
        return originalEmit.apply(this, args);
      };
    }

    // Add event listeners
    document.addEventListener('input', handleInput);
    
    // Use MutationObserver for render monitoring
    const observer = new MutationObserver(() => {
      handleRenderEnd();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true
    });

    // Cleanup
    return () => {
      document.removeEventListener('input', handleInput);
      observer.disconnect();
      
      if (window.socket && originalEmit) {
        window.socket.emit = originalEmit;
      }
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="fixed top-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs z-50">
      <div>Input Lag: {metrics.inputLag}ms</div>
      <div>Render: {metrics.renderTime}ms</div>
      <div>Socket Events: {metrics.socketEvents}</div>
    </div>
  );
};

export default PerformanceMonitor;
