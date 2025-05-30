import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';

export const useTyping = (conversationId, recipientId) => {
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const { startTyping, stopTyping, socket } = useSocket();

  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const lastTypingEventRef = useRef(0);
  const typingDebounceRef = useRef(null);
  const batchTimeoutRef = useRef(null);
  const typingBatch = useRef([]);

  // Ultra-fast batch typing handler - batches events for better performance
  const batchTypingEvent = useCallback((type) => {
    if (!conversationId || !recipientId) return;

    const event = {
      type,
      conversationId,
      recipientId,
      timestamp: Date.now()
    };

    typingBatch.current.push(event);

    // Clear existing batch timeout
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }

    // Send batch after 50ms (ultra-fast batching)
    batchTimeoutRef.current = setTimeout(() => {
      if (typingBatch.current.length > 0) {
        const latestEvent = typingBatch.current[typingBatch.current.length - 1];

        // Only send the latest event to avoid spam
        if (latestEvent.type === 'start') {
          startTyping({ conversationId, recipientId });
        } else {
          stopTyping({ conversationId, recipientId });
        }

        typingBatch.current = [];
      }
    }, 50);
  }, [conversationId, recipientId, startTyping, stopTyping]);

  // Debounced typing handler - reduced from 300ms to 100ms for faster response
  const debouncedTypingStart = useCallback(() => {
    if (!conversationId || !recipientId) return;

    const now = Date.now();

    // Reduced throttle from 500ms to 200ms for faster updates
    if (now - lastTypingEventRef.current < 200) {
      return;
    }

    lastTypingEventRef.current = now;
    batchTypingEvent('start');
  }, [conversationId, recipientId, batchTypingEvent]);

  // Handle typing start - INSTANT UI update, optimized network calls
  const handleTypingStart = useCallback(() => {
    if (!conversationId || !recipientId) return;

    // ✅ INSTANT UI UPDATE (0ms lag)
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      setIsTyping(true);
    }

    // Clear existing debounce timeout
    if (typingDebounceRef.current) {
      clearTimeout(typingDebounceRef.current);
    }

    // Reduced debounce from 300ms to 100ms for faster network updates
    typingDebounceRef.current = setTimeout(() => {
      debouncedTypingStart();
    }, 100);

    // Clear existing timeout and reset
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Reduced auto-stop from 3000ms to 2000ms for faster cleanup
    typingTimeoutRef.current = setTimeout(() => {
      handleTypingStop();
    }, 2000);
  }, [conversationId, recipientId, debouncedTypingStart]);

  // Handle typing stop - INSTANT UI update, optimized cleanup
  const handleTypingStop = useCallback(() => {
    if (!conversationId || !recipientId) return;

    // Clear all timeouts
    if (typingDebounceRef.current) {
      clearTimeout(typingDebounceRef.current);
      typingDebounceRef.current = null;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
      batchTimeoutRef.current = null;
    }

    // ✅ INSTANT UI UPDATE (0ms lag)
    if (isTypingRef.current) {
      isTypingRef.current = false;
      setIsTyping(false);
      batchTypingEvent('stop');
    }
  }, [conversationId, recipientId, batchTypingEvent]);

  // Listen for typing events from other users
  useEffect(() => {
    if (!socket) return;

    const handleUserTyping = (data) => {
      if (data.conversationId === conversationId) {
        setTypingUsers(prev => {
          // Use Set for O(1) lookup instead of array.find() for better performance
          const userIds = new Set(prev.map(u => u.userId));
          if (!userIds.has(data.userId)) {
            return [...prev, { userId: data.userId, username: data.username }];
          }
          return prev;
        });
      }
    };

    const handleUserStoppedTyping = (data) => {
      if (data.conversationId === conversationId) {
        setTypingUsers(prev => prev.filter(user => user.userId !== data.userId));
      }
    };

    socket.on('user_typing', handleUserTyping);
    socket.on('user_stopped_typing', handleUserStoppedTyping);

    return () => {
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stopped_typing', handleUserStoppedTyping);
    };
  }, [socket, conversationId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      handleTypingStop();
    };
  }, [handleTypingStop]);

  // Reset typing users when conversation changes
  useEffect(() => {
    setTypingUsers([]);
    handleTypingStop();
  }, [conversationId, handleTypingStop]);

  return {
    isTyping,
    typingUsers,
    handleTypingStart,
    handleTypingStop
  };
};
