// 🚀 MEMORY MANAGER - Optimize memory usage and prevent memory leaks
class MemoryManager {
  constructor() {
    this.observers = new Set();
    this.timers = new Set();
    this.eventListeners = new Map();
    this.cleanupTasks = new Set();
    this.memoryThreshold = 100 * 1024 * 1024; // 100MB threshold
    this.lastCleanup = Date.now();
    this.cleanupInterval = 5 * 60 * 1000; // 5 minutes
    
    // Start periodic cleanup
    this.startPeriodicCleanup();
  }

  // Register intersection observer for cleanup
  registerObserver(observer) {
    this.observers.add(observer);
    return () => this.unregisterObserver(observer);
  }

  // Unregister intersection observer
  unregisterObserver(observer) {
    if (observer && typeof observer.disconnect === 'function') {
      observer.disconnect();
    }
    this.observers.delete(observer);
  }

  // Register timer for cleanup
  registerTimer(timerId) {
    this.timers.add(timerId);
    return () => this.unregisterTimer(timerId);
  }

  // Unregister timer
  unregisterTimer(timerId) {
    clearTimeout(timerId);
    clearInterval(timerId);
    this.timers.delete(timerId);
  }

  // Register event listener for cleanup
  registerEventListener(element, event, handler, options) {
    const key = `${element}_${event}`;
    const listener = { element, event, handler, options };
    
    if (!this.eventListeners.has(key)) {
      this.eventListeners.set(key, new Set());
    }
    this.eventListeners.get(key).add(listener);
    
    element.addEventListener(event, handler, options);
    
    return () => this.unregisterEventListener(element, event, handler);
  }

  // Unregister event listener
  unregisterEventListener(element, event, handler) {
    const key = `${element}_${event}`;
    const listeners = this.eventListeners.get(key);
    
    if (listeners) {
      for (const listener of listeners) {
        if (listener.handler === handler) {
          element.removeEventListener(event, handler, listener.options);
          listeners.delete(listener);
          break;
        }
      }
      
      if (listeners.size === 0) {
        this.eventListeners.delete(key);
      }
    }
  }

  // Register cleanup task
  registerCleanupTask(task) {
    this.cleanupTasks.add(task);
    return () => this.cleanupTasks.delete(task);
  }

  // Force cleanup of all registered resources
  cleanup() {
    // Cleanup observers
    this.observers.forEach(observer => {
      if (observer && typeof observer.disconnect === 'function') {
        observer.disconnect();
      }
    });
    this.observers.clear();

    // Cleanup timers
    this.timers.forEach(timerId => {
      clearTimeout(timerId);
      clearInterval(timerId);
    });
    this.timers.clear();

    // Cleanup event listeners
    this.eventListeners.forEach(listeners => {
      listeners.forEach(({ element, event, handler, options }) => {
        element.removeEventListener(event, handler, options);
      });
    });
    this.eventListeners.clear();

    // Run custom cleanup tasks
    this.cleanupTasks.forEach(task => {
      try {
        task();
      } catch (error) {
        console.error('Cleanup task failed:', error);
      }
    });
    this.cleanupTasks.clear();

    console.log('🧹 Memory cleanup completed');
  }

  // Get memory usage info
  getMemoryInfo() {
    if (performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
        percentage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
      };
    }
    return null;
  }

  // Check if memory usage is high
  isMemoryHigh() {
    const memInfo = this.getMemoryInfo();
    return memInfo ? memInfo.used > this.memoryThreshold : false;
  }

  // Start periodic cleanup
  startPeriodicCleanup() {
    const cleanup = () => {
      const now = Date.now();
      if (now - this.lastCleanup > this.cleanupInterval) {
        this.performPeriodicCleanup();
        this.lastCleanup = now;
      }
    };

    // Register the cleanup interval
    const intervalId = setInterval(cleanup, this.cleanupInterval);
    this.registerTimer(intervalId);
  }

  // Perform periodic cleanup
  performPeriodicCleanup() {
    const memInfo = this.getMemoryInfo();
    
    if (memInfo && memInfo.percentage > 80) {
      console.warn('🚨 High memory usage detected:', memInfo);
      
      // Force garbage collection if available
      if (window.gc) {
        window.gc();
      }
      
      // Clear old cache entries
      if (window.cacheManager) {
        window.cacheManager.cleanExpiredEntries();
      }
      
      // Dispatch memory warning event
      window.dispatchEvent(new CustomEvent('memoryWarning', { detail: memInfo }));
    }
  }

  // Optimize images for memory
  optimizeImage(img, maxWidth = 800, quality = 0.8) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Calculate new dimensions
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(resolve, 'image/jpeg', quality);
    });
  }

  // Debounce function to prevent excessive calls
  debounce(func, wait) {
    let timeout;
    return (...args) => {
      const later = () => {
        this.unregisterTimer(timeout);
        func.apply(this, args);
      };
      this.unregisterTimer(timeout);
      timeout = setTimeout(later, wait);
      this.registerTimer(timeout);
    };
  }

  // Throttle function to limit call frequency
  throttle(func, limit) {
    let inThrottle;
    return (...args) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        const timeoutId = setTimeout(() => {
          inThrottle = false;
          this.unregisterTimer(timeoutId);
        }, limit);
        this.registerTimer(timeoutId);
      }
    };
  }

  // Create optimized scroll handler
  createOptimizedScrollHandler(handler, options = {}) {
    const { throttle = 16, passive = true } = options;
    const throttledHandler = this.throttle(handler, throttle);
    
    return (element) => {
      this.registerEventListener(element, 'scroll', throttledHandler, { passive });
      return () => this.unregisterEventListener(element, 'scroll', throttledHandler);
    };
  }

  // Create optimized resize handler
  createOptimizedResizeHandler(handler, options = {}) {
    const { debounce = 250 } = options;
    const debouncedHandler = this.debounce(handler, debounce);
    
    this.registerEventListener(window, 'resize', debouncedHandler);
    return () => this.unregisterEventListener(window, 'resize', debouncedHandler);
  }
}

// Create singleton instance
export const memoryManager = new MemoryManager();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  memoryManager.cleanup();
});

// Export for debugging
window.memoryManager = memoryManager;
