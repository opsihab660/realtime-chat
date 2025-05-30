import { useCallback, useRef } from 'react';

/**
 * Custom hook for debouncing callback functions
 * @param {Function} callback - The function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Debounced callback function
 */
export const useDebounceCallback = (callback, delay) => {
  const timeoutRef = useRef(null);

  const debouncedCallback = useCallback((...args) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);

  // Cleanup function
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return [debouncedCallback, cancel];
};

/**
 * Custom hook for throttling callback functions
 * @param {Function} callback - The function to throttle
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Throttled callback function
 */
export const useThrottleCallback = (callback, delay) => {
  const lastCallRef = useRef(0);
  const timeoutRef = useRef(null);

  const throttledCallback = useCallback((...args) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallRef.current;

    if (timeSinceLastCall >= delay) {
      // Execute immediately if enough time has passed
      lastCallRef.current = now;
      callback(...args);
    } else {
      // Schedule execution for later
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        lastCallRef.current = Date.now();
        callback(...args);
      }, delay - timeSinceLastCall);
    }
  }, [callback, delay]);

  return throttledCallback;
};
