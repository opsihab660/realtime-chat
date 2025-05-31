import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { messagesAPI } from '../services/api';

export const useChat = () => {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [page, setPage] = useState(1);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);

  // Message cache to avoid repeated API calls
  const [messageCache, setMessageCache] = useState(new Map());
  const [conversationMetadata, setConversationMetadata] = useState(new Map());

  // Lazy loading states for conversations
  const [conversationPage, setConversationPage] = useState(1);
  const [hasMoreConversations, setHasMoreConversations] = useState(true);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const loadingTimeoutRef = useRef(null);
  const intersectionObserverRef = useRef(null);
  const loadTriggerRef = useRef(null);

  const { socket, sendMessage, markMessagesAsRead } = useSocket();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Ref to track the currently selected conversation ID to prevent race conditions
  const currentConversationIdRef = useRef(null);

  // Cache helper functions
  const getCachedMessages = useCallback((conversationId) => {
    return messageCache.get(conversationId) || null;
  }, [messageCache]);

  const setCachedMessages = useCallback((conversationId, messages, metadata = {}) => {
    setMessageCache(prev => new Map(prev.set(conversationId, messages)));
    setConversationMetadata(prev => new Map(prev.set(conversationId, {
      lastFetched: Date.now(),
      hasMoreMessages: metadata.hasMoreMessages || false,
      currentPage: metadata.currentPage || 1,
      ...metadata
    })));
  }, []);

  const getCachedMetadata = useCallback((conversationId) => {
    return conversationMetadata.get(conversationId) || null;
  }, [conversationMetadata]);

  const clearCache = useCallback((conversationId = null) => {
    if (conversationId) {
      setMessageCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(conversationId);
        return newCache;
      });
      setConversationMetadata(prev => {
        const newMetadata = new Map(prev);
        newMetadata.delete(conversationId);
        return newMetadata;
      });
    } else {
      setMessageCache(new Map());
      setConversationMetadata(new Map());
    }
  }, []);

  // Auto-scroll to bottom function - defined early to avoid hoisting issues
  const scrollToBottom = useCallback((force = false) => {
    if (messagesEndRef.current && (shouldAutoScroll || force)) {
      // Always use immediate scrolling for conversation page default behavior
      messagesEndRef.current.scrollIntoView({
        behavior: 'auto', // Always immediate to prevent scroll bar jumping
        block: 'end'
      });
    }
  }, [shouldAutoScroll]);

  // Check if user is near bottom of scroll
  const isNearBottom = useCallback(() => {
    if (!messagesContainerRef.current) return true;
    const container = messagesContainerRef.current;
    const { scrollTop, scrollHeight, clientHeight } = container;
    return scrollHeight - scrollTop - clientHeight < 100; // Within 100px of bottom
  }, []);

  // Handle user scroll detection
  const handleUserScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;

    const nearBottom = isNearBottom();
    setShouldAutoScroll(nearBottom);

    if (!nearBottom) {
      setIsUserScrolling(true);
      // Clear user scrolling flag after a delay
      setTimeout(() => setIsUserScrolling(false), 1000);
    }
  }, [isNearBottom]);



  // Load conversations with lazy loading support
  const loadConversations = useCallback(async (pageNum = 1, append = false) => {
    try {
      console.log('🔄 Loading conversations...', { pageNum, append });

      if (append) {
        setIsLoadingConversations(true);
      } else {
        setIsLoading(true);
        setConversationPage(1);
      }

      const response = await messagesAPI.getConversations({
        page: pageNum,
        limit: 10 // Load 10 conversations at a time
      });

      const newConversations = response.data.conversations;
      console.log('📋 Loaded conversations:', newConversations.length);

      if (append) {
        setConversations(prev => [...prev, ...newConversations]);
      } else {
        setConversations(newConversations);
      }

      setHasMoreConversations(response.data.pagination?.hasNext || false);

    } catch (error) {
      console.error('Failed to load conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      if (append) {
        setIsLoadingConversations(false);
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  // Load more conversations
  const loadMoreConversations = useCallback(async () => {
    if (!hasMoreConversations || isLoadingConversations) {
      return;
    }

    const nextPage = conversationPage + 1;
    setConversationPage(nextPage);
    await loadConversations(nextPage, true);
  }, [conversationPage, hasMoreConversations, isLoadingConversations, loadConversations]);

  // Message loading with caching support
  const loadMessages = useCallback(async (conversationId, pageNum = 1, append = false, maintainScrollPosition = false) => {
    try {
      console.log(`🚀 Loading messages for conversation:`, { conversationId, pageNum, append });

      if (append) {
        setIsLoadingOlderMessages(true);
      } else {
        setIsLoadingMessages(true);
      }

      // Store detailed scroll position before loading
      let scrollPosition = null;
      if (maintainScrollPosition && messagesContainerRef.current) {
        const container = messagesContainerRef.current;
        scrollPosition = {
          scrollTop: container.scrollTop,
          scrollHeight: container.scrollHeight,
          clientHeight: container.clientHeight,
          scrollTopRatio: container.scrollTop / (container.scrollHeight - container.clientHeight),
          // Store the first visible message for better position restoration
          firstVisibleMessageId: null,
          firstVisibleMessageOffset: 0
        };

        // Find the first visible message
        const messageElements = container.querySelectorAll('[data-message-id]');
        for (const element of messageElements) {
          const rect = element.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          if (rect.top >= containerRect.top) {
            scrollPosition.firstVisibleMessageId = element.getAttribute('data-message-id');
            scrollPosition.firstVisibleMessageOffset = rect.top - containerRect.top;
            break;
          }
        }
      }

      console.log(`📥 Loading messages for conversation ${conversationId}, page ${pageNum}, append: ${append}`);

      const response = await messagesAPI.getMessages(conversationId, {
        page: pageNum,
        limit: pageNum === 1 ? 20 : 30 // Increased limits for smoother loading
      });

      const newMessages = response.data.messages;
      console.log(`📨 Received ${newMessages.length} messages for page ${pageNum}`);

      if (append) {
        // Add older messages to the beginning - only if we're still on the same conversation
        if (currentConversationIdRef.current === conversationId) {
          setMessages(prev => {
            const updatedMessages = [...newMessages, ...prev];
            // Update cache with new messages
            setCachedMessages(conversationId, updatedMessages, {
              hasMoreMessages: response.data.pagination.hasNext,
              currentPage: pageNum
            });
            return updatedMessages;
          });
        } else {
          console.log(`⚠️ Skipping append messages - conversation changed`);
        }

        // Enhanced scroll position restoration with multiple fallback methods
        if (maintainScrollPosition && scrollPosition && messagesContainerRef.current) {
          // Use a more reliable method to restore scroll position
          setTimeout(() => {
            const container = messagesContainerRef.current;
            if (container && scrollPosition.firstVisibleMessageId) {
              // Try to find the previously visible message
              const targetElement = container.querySelector(`[data-message-id="${scrollPosition.firstVisibleMessageId}"]`);
              if (targetElement) {
                const containerRect = container.getBoundingClientRect();
                const targetRect = targetElement.getBoundingClientRect();
                const currentOffset = targetRect.top - containerRect.top;
                const scrollAdjustment = currentOffset - scrollPosition.firstVisibleMessageOffset;
                container.scrollTop = container.scrollTop - scrollAdjustment + 100; // Add small buffer
              } else {
                // Fallback to height-based calculation
                const heightDifference = container.scrollHeight - scrollPosition.scrollHeight;
                container.scrollTop = scrollPosition.scrollTop + heightDifference + 50;
              }
            } else if (container) {
              // Fallback method when no visible message ID is available
              const heightDifference = container.scrollHeight - scrollPosition.scrollHeight;
              container.scrollTop = scrollPosition.scrollTop + heightDifference + 50;
            }

            // Disable auto-scroll temporarily to prevent conflicts
            setShouldAutoScroll(false);
            setTimeout(() => setShouldAutoScroll(true), 1500);
          }, 50); // Small delay to ensure DOM is updated
        }
      } else {
        // Set initial messages - only if we're still on the same conversation
        if (currentConversationIdRef.current === conversationId) {
          console.log(`✅ Setting ${newMessages.length} messages for conversation:`, conversationId);
          setMessages(newMessages);
          setPage(1);

          // Cache the messages for future use
          setCachedMessages(conversationId, newMessages, {
            hasMoreMessages: response.data.pagination.hasNext,
            currentPage: 1
          });

          // Reset auto-scroll for new conversation
          setShouldAutoScroll(true);

          // Auto-scroll to bottom for initial load
          requestAnimationFrame(() => {
            scrollToBottom(true);
          });
        } else {
          console.log(`⚠️ Skipping message load - conversation changed`);
        }
      }

      setHasMoreMessages(response.data.pagination.hasNext);

      // Don't mark messages as read here - it will be handled by selectConversation
      // The backend already marks messages as read when fetching them
      console.log(`✅ Successfully loaded ${newMessages.length} messages for conversation ${conversationId}`);


    } catch (error) {
      console.error('Failed to load messages:', error);

      // Show user-friendly error message
      if (error.response?.status === 404) {
        toast.error('Conversation not found');
      } else if (error.response?.status >= 500) {
        toast.error('Server error. Please try again.');
      } else {
        toast.error('Failed to load messages. Please check your connection.');
      }

      // Reset hasMoreMessages on error to prevent infinite retry
      if (append && error.response?.status !== 500) {
        setHasMoreMessages(false);
      }

      // Reset page on error for append operations
      if (append) {
        setPage(prev => Math.max(prev - 1, 1));
      }
    } finally {
      if (append) {
        setIsLoadingOlderMessages(false);
      } else {
        setIsLoadingMessages(false);
      }
    }
  }, [scrollToBottom, setCachedMessages]);

  // Start conversation with a user
  const startConversation = useCallback(async (recipientId) => {
    try {
      const response = await messagesAPI.startConversation(recipientId);
      const conversation = response.data.conversation;

      // Add to conversations if not exists
      setConversations(prev => {
        const exists = prev.find(c => c._id === conversation._id);
        if (!exists) {
          return [conversation, ...prev];
        }
        return prev;
      });

      setCurrentConversation(conversation);
      currentConversationIdRef.current = conversation._id; // Track the current conversation ID
      await loadMessages(conversation._id);

      // Auto-scroll to bottom after starting new conversation - immediate
      setTimeout(() => {
        scrollToBottom(); // Immediate scroll to bottom
      }, 50); // Minimal delay for DOM update

      return conversation;
    } catch (error) {
      console.error('Failed to start conversation:', error);
      toast.error(error.response?.data?.message || 'Failed to start conversation');
      return null;
    }
  }, [loadMessages, scrollToBottom]);

  // Send a message with optimistic updates
  const handleSendMessage = useCallback((content, type = 'text', replyTo = null, file = null) => {
    if (!currentConversation || (!content.trim() && !file)) return;

    const messageData = {
      recipientId: currentConversation.participant._id,
      content: content ? content.trim() : '',
      type,
      conversationId: currentConversation._id,
      replyTo
    };

    // Add file data for image messages
    if (type === 'image' && file) {
      messageData.file = file;
    }

    // Create optimistic message for immediate UI update
    const optimisticMessage = {
      _id: `temp_${Date.now()}_${Math.random()}`, // Unique temporary ID
      content: content.trim(),
      type,
      sender: {
        _id: user?._id || 'current_user',
        username: user?.username || 'You',
        avatar: user?.avatar
      },
      recipient: currentConversation.participant,
      createdAt: new Date().toISOString(),
      replyTo: replyTo ? { _id: replyTo, content: 'Reply content...' } : null,
      isOptimistic: true, // Flag to identify optimistic messages
      status: 'sending',
      reactions: []
    };

    // Add optimistic message to UI immediately and update cache
    setMessages(prev => {
      const updatedMessages = [...prev, optimisticMessage];
      // Update cache with optimistic message
      const cachedMetadata = getCachedMetadata(currentConversation._id);
      setCachedMessages(currentConversation._id, updatedMessages, cachedMetadata || {});
      return updatedMessages;
    });

    // Scroll to bottom immediately
    setTimeout(() => {
      scrollToBottom();
    }, 0);

    sendMessage(messageData);
  }, [currentConversation, sendMessage, user, scrollToBottom, getCachedMetadata, setCachedMessages]);

  // Enhanced load more messages with debouncing and smooth loading
  const loadMoreMessages = useCallback(async () => {
    if (!currentConversation || isLoadingMessages || isLoadingOlderMessages || !hasMoreMessages) {
      console.log('🚫 Skipping loadMoreMessages - conditions not met:', {
        hasConversation: !!currentConversation,
        isLoadingMessages,
        isLoadingOlderMessages,
        hasMoreMessages
      });
      return Promise.resolve();
    }

    // Prevent multiple simultaneous calls
    if (loadingTimeoutRef.current) {
      console.log('🚫 Skipping loadMoreMessages - already loading');
      return Promise.resolve();
    }

    console.log('🔄 Starting loadMoreMessages for page:', page + 1);

    // Debounce loading to prevent rapid multiple calls
    return new Promise((resolve) => {
      loadingTimeoutRef.current = setTimeout(async () => {
        try {
          const nextPage = page + 1;
          console.log('📄 Loading page:', nextPage);
          setPage(nextPage);
          await loadMessages(currentConversation._id, nextPage, true, true); // maintainScrollPosition = true
          console.log('✅ Successfully loaded page:', nextPage);
          resolve();
        } catch (error) {
          console.error('❌ Error loading more messages:', error);

          // Reset page on error to allow retry - this is now handled in loadMessages
          // setPage(prev => Math.max(prev - 1, 1));

          // Add retry mechanism for network errors
          if (error.code === 'NETWORK_ERROR' || error.response?.status >= 500) {
            console.log('🔄 Scheduling retry for network error...');
            setTimeout(() => {
              if (hasMoreMessages && !isLoadingOlderMessages) {
                console.log('🔄 Retrying failed message load...');
                loadMoreMessages();
              }
            }, 2000); // Retry after 2 seconds
          }

          resolve();
        } finally {
          // Clear the timeout reference
          loadingTimeoutRef.current = null;
        }
      }, 300); // Increased debounce to 300ms to prevent multiple triggers
    });
  }, [currentConversation, isLoadingMessages, isLoadingOlderMessages, hasMoreMessages, page, loadMessages]);

  // Setup Intersection Observer for smooth lazy loading
  const setupIntersectionObserver = useCallback(() => {
    if (!messagesContainerRef.current) {
      console.log('🚫 Cannot setup Intersection Observer - no messages container');
      return;
    }

    // Cleanup existing observer
    if (intersectionObserverRef.current) {
      intersectionObserverRef.current.disconnect();
      console.log('🧹 Cleaned up existing Intersection Observer');
    }

    // Create new observer with optimized settings
    intersectionObserverRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasMoreMessages && !isLoadingMessages && !isLoadingOlderMessages) {
            // Additional check to prevent multiple triggers
            if (!loadingTimeoutRef.current) {
              console.log('🔄 Intersection Observer triggered - loading more messages');
              loadMoreMessages();
            } else {
              console.log('🚫 Intersection Observer triggered but loading already in progress');
            }
          }
        });
      },
      {
        root: messagesContainerRef.current,
        rootMargin: '50px 0px 0px 0px', // Reduced margin to prevent early triggers
        threshold: 0.1
      }
    );

    // Observe the load trigger element if it exists
    if (loadTriggerRef.current) {
      intersectionObserverRef.current.observe(loadTriggerRef.current);
      console.log('👀 Intersection Observer setup complete');
    } else {
      console.log('🚫 Cannot observe load trigger - element not found');
    }
  }, [hasMoreMessages, isLoadingMessages, isLoadingOlderMessages, loadMoreMessages]);

  // Select conversation with caching support
  const selectConversation = useCallback(async (conversation) => {
    console.log(`🎯 selectConversation called with:`, {
      conversationId: conversation._id,
      participantId: conversation.participant?._id,
      currentConversationId: currentConversation?._id
    });

    // Only load messages if switching to a different conversation
    if (!currentConversation || currentConversation._id !== conversation._id) {
      console.log(`🔄 Switching to conversation:`, conversation._id);

      // Set new conversation immediately
      setCurrentConversation(conversation);
      currentConversationIdRef.current = conversation._id;

      // Reset scroll behavior for new conversation
      setShouldAutoScroll(true);
      setIsUserScrolling(false);

      // Check if we have cached messages for this conversation
      const cachedMessages = getCachedMessages(conversation._id);
      const cachedMetadata = getCachedMetadata(conversation._id);

      if (cachedMessages && cachedMessages.length > 0) {
        console.log(`📋 Using cached messages for conversation:`, conversation._id, `(${cachedMessages.length} messages)`);

        // Use cached messages immediately - no loading state
        setMessages(cachedMessages);
        setPage(cachedMetadata?.currentPage || 1);
        setHasMoreMessages(cachedMetadata?.hasMoreMessages || false);

        // Auto-scroll to bottom for cached conversation
        setTimeout(() => {
          scrollToBottom(true);
        }, 50);
      } else {
        console.log(`🔄 No cached messages found, loading from API:`, conversation._id);

        // Clear previous messages and show loading
        setMessages([]);
        setPage(1);
        setHasMoreMessages(true);

        // Load fresh messages from API
        await loadMessages(conversation._id, 1, false, false);
      }

      // Mark all unread messages from this conversation as read
      if (conversation.participant?._id) {
        markMessagesAsRead({ recipientId: conversation.participant._id });
      }
    } else {
      // Same conversation clicked - scroll to bottom immediately
      console.log(`🔄 Same conversation clicked, scrolling to bottom`);
      setCurrentConversation(conversation);
      currentConversationIdRef.current = conversation._id;
      setShouldAutoScroll(true);
      setTimeout(() => {
        scrollToBottom(true);
      }, 10);
    }
  }, [currentConversation, loadMessages, markMessagesAsRead, scrollToBottom, getCachedMessages, getCachedMetadata]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data) => {
      const { message, conversationId } = data;

      // Add message to current conversation only
      if (currentConversation && conversationId === currentConversation._id) {
        setMessages(prev => {
          // Check if message already exists to avoid duplicates
          const existingMessage = prev.find(msg => msg._id === message._id);
          if (!existingMessage) {
            const updatedMessages = [...prev, message];
            // Update cache with new message
            const cachedMetadata = getCachedMetadata(conversationId);
            setCachedMessages(conversationId, updatedMessages, cachedMetadata || {});
            return updatedMessages;
          }
          return prev;
        });

        // Mark as read if user is viewing the conversation and it's not from current user
        if (message.sender._id !== user?._id) {
          markMessagesAsRead({ messageIds: [message._id] });
        }
      }

      // Update conversation list or add new conversation if it doesn't exist
      setConversations(prev => {
        const existingConvIndex = prev.findIndex(conv => conv._id === conversationId);

        if (existingConvIndex !== -1) {
          // Update existing conversation
          const updated = [...prev];
          updated[existingConvIndex] = {
            ...updated[existingConvIndex],
            lastMessage: message,
            lastActivity: message.createdAt
          };
          // Move to top for real-time ordering
          const [updatedConv] = updated.splice(existingConvIndex, 1);
          return [updatedConv, ...updated];
        } else {
          // This shouldn't happen often, but handle new conversation from incoming message
          // We would need to fetch the full conversation details here
          // For now, just reload conversations to be safe
          loadConversations();
          return prev;
        }
      });
    };

    const handleMessageSent = (data) => {
      const { message, conversationId } = data;

      // Replace optimistic message with real message in current conversation
      if (currentConversation && conversationId === currentConversation._id) {
        setMessages(prev => {
          // Find the most recent optimistic message from the current user
          const optimisticIndex = prev.findIndex(msg =>
            msg.isOptimistic &&
            msg.status === 'sending' &&
            msg.sender._id === user?._id &&
            msg.content === message.content
          );

          let updatedMessages;
          if (optimisticIndex !== -1) {
            // Replace optimistic message with real message
            updatedMessages = [...prev];
            updatedMessages[optimisticIndex] = {
              ...message,
              status: 'sent',
              reactions: message.reactions || []
            };
          } else {
            // Check if this message already exists (avoid duplicates)
            const existingMessage = prev.find(msg => msg._id === message._id);
            if (!existingMessage) {
              // Only add if it doesn't exist
              updatedMessages = [...prev, { ...message, status: 'sent' }];
            } else {
              updatedMessages = prev;
            }
          }

          // Update cache with sent message
          const cachedMetadata = getCachedMetadata(conversationId);
          setCachedMessages(conversationId, updatedMessages, cachedMetadata || {});

          return updatedMessages;
        });
      }

      // Update conversation list with proper message structure and move to top
      setConversations(prev => {
        const existingConvIndex = prev.findIndex(conv => conv._id === conversationId);

        if (existingConvIndex !== -1) {
          const updated = [...prev];
          updated[existingConvIndex] = {
            ...updated[existingConvIndex],
            lastMessage: {
              ...message,
              readBy: message.readBy || []
            },
            lastActivity: message.createdAt
          };
          // Move updated conversation to top for real-time ordering
          const [updatedConv] = updated.splice(existingConvIndex, 1);
          return [updatedConv, ...updated];
        }
        return prev;
      });
    };

    const handleReactionAdded = (data) => {
      const { messageId, userId, username, emoji } = data;

      setMessages(prev =>
        prev.map(msg =>
          msg._id === messageId
            ? {
                ...msg,
                reactions: [
                  ...msg.reactions.filter(r => r.user._id !== userId),
                  { user: { _id: userId, username }, emoji, createdAt: new Date() }
                ]
              }
            : msg
        )
      );
    };

    const handleMessageRead = (data) => {
      const { messageId, readBy, readAt } = data;

      // Update messages in current conversation
      setMessages(prev =>
        prev.map(msg =>
          msg._id === messageId
            ? {
                ...msg,
                readBy: [
                  ...msg.readBy.filter(r => r.user !== readBy),
                  { user: readBy, readAt: new Date(readAt) }
                ]
              }
            : msg
        )
      );

      // Update conversation list last message read status
      setConversations(prev =>
        prev.map(conv => {
          if (conv.lastMessage && conv.lastMessage._id === messageId) {
            return {
              ...conv,
              lastMessage: {
                ...conv.lastMessage,
                readBy: [
                  ...conv.lastMessage.readBy.filter(r => r.user !== readBy),
                  { user: readBy, readAt: new Date(readAt) }
                ]
              }
            };
          }
          return conv;
        })
      );
    };

    const handleMessageEdited = (data) => {
      const { message: editedMessage, conversationId } = data;
      console.log('✏️ Message edited:', editedMessage._id, 'in conversation:', conversationId);

      // Update messages in current conversation
      if (currentConversation?._id === conversationId) {
        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg._id === editedMessage._id
              ? { ...msg, ...editedMessage }
              : msg
          )
        );

        // Update cached messages
        const cachedMessages = getCachedMessages(conversationId);
        if (cachedMessages) {
          const updatedMessages = cachedMessages.map(msg =>
            msg._id === editedMessage._id
              ? { ...msg, ...editedMessage }
              : msg
          );
          setCachedMessages(conversationId, updatedMessages);
        }
      }

      // Update conversation list if the edited message is the last message
      setConversations(prev =>
        prev.map(conv => {
          if (conv._id === conversationId && conv.lastMessage && conv.lastMessage._id === editedMessage._id) {
            return {
              ...conv,
              lastMessage: {
                ...conv.lastMessage,
                ...editedMessage
              }
            };
          }
          return conv;
        })
      );
    };

    const handleMessageDeleted = (data) => {
      const { messageId, conversationId } = data;
      console.log('📨 Message deleted:', messageId, 'in conversation:', conversationId);

      // Update messages in current conversation
      if (currentConversation?._id === conversationId) {
        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg._id === messageId
              ? { ...msg, deleted: { isDeleted: true, deletedAt: data.deletedAt } }
              : msg
          )
        );

        // Update cached messages
        const cachedMessages = getCachedMessages(conversationId);
        if (cachedMessages) {
          const updatedMessages = cachedMessages.map(msg =>
            msg._id === messageId
              ? { ...msg, deleted: { isDeleted: true, deletedAt: data.deletedAt } }
              : msg
          );
          setCachedMessages(conversationId, updatedMessages);
        }
      }

      // Update conversation list if the deleted message is the last message
      setConversations(prev =>
        prev.map(conv => {
          if (conv._id === conversationId && conv.lastMessage && conv.lastMessage._id === messageId) {
            return {
              ...conv,
              lastMessage: {
                ...conv.lastMessage,
                deleted: { isDeleted: true, deletedAt: data.deletedAt }
              }
            };
          }
          return conv;
        })
      );
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_sent', handleMessageSent);
    socket.on('reaction_added', handleReactionAdded);
    socket.on('message_read', handleMessageRead);
    socket.on('message_edited', handleMessageEdited);
    socket.on('message_deleted', handleMessageDeleted);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_sent', handleMessageSent);
      socket.off('reaction_added', handleReactionAdded);
      socket.off('message_read', handleMessageRead);
      socket.off('message_edited', handleMessageEdited);
      socket.off('message_deleted', handleMessageDeleted);
    };
  }, [socket, currentConversation, markMessagesAsRead, user, getCachedMetadata, setCachedMessages]);

  // Removed duplicate scrollToBottom function

  // Enhanced auto-scroll that triggers only for new messages (not when loading older ones)
  useEffect(() => {
    if (messages.length > 0 && shouldAutoScroll) {
      const lastMessage = messages[messages.length - 1];
      // Only auto-scroll for new messages, optimistic messages, or when user is near bottom
      if (lastMessage.isOptimistic ||
          new Date(lastMessage.createdAt) > new Date(Date.now() - 5000) ||
          isNearBottom()) {
        const timer = setTimeout(() => {
          scrollToBottom();
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [messages.length, scrollToBottom, shouldAutoScroll, isNearBottom]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Ensure immediate scroll to bottom when conversation changes
  useEffect(() => {
    if (currentConversation && messages.length > 0) {
      // Immediate scroll to bottom when conversation is selected
      setTimeout(() => {
        scrollToBottom();
      }, 5); // Very minimal delay for DOM update
    }
  }, [currentConversation?._id, scrollToBottom]);

  // Setup Intersection Observer when conversation or messages change
  useEffect(() => {
    if (currentConversation && messages.length > 0 && hasMoreMessages) {
      console.log('🔧 Setting up Intersection Observer for conversation:', currentConversation._id);
      // Small delay to ensure DOM is ready and load trigger is rendered
      const timer = setTimeout(() => {
        setupIntersectionObserver();
      }, 500); // Increased delay to ensure proper setup

      return () => {
        clearTimeout(timer);
        if (intersectionObserverRef.current) {
          intersectionObserverRef.current.disconnect();
          console.log('🧹 Cleaned up Intersection Observer on effect cleanup');
        }
      };
    } else {
      // Cleanup observer when no more messages
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
        console.log('🧹 Cleaned up Intersection Observer - no more messages or no conversation');
      }
    }
  }, [currentConversation?._id, hasMoreMessages, setupIntersectionObserver]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
      }
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  // Enhanced scroll function that can be called externally
  const forceScrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      // Force immediate scroll - no smooth scrolling to prevent jumping
      messagesEndRef.current.scrollIntoView({
        behavior: 'auto',
        block: 'end'
      });
    }
  }, []);

  return {
    conversations,
    currentConversation,
    setCurrentConversation,
    messages,
    isLoading,
    isLoadingMessages,
    isLoadingOlderMessages,
    hasMoreMessages,
    messagesEndRef,
    messagesContainerRef,
    loadTriggerRef,
    loadConversations,
    startConversation,
    selectConversation,
    handleSendMessage,
    loadMoreMessages,
    scrollToBottom,
    forceScrollToBottom,
    handleUserScroll,
    isUserScrolling,
    shouldAutoScroll,
    setupIntersectionObserver,
    // Conversation lazy loading
    hasMoreConversations,
    isLoadingConversations,
    loadMoreConversations,
    // Cache management
    clearCache,
    getCachedMessages,
    getCachedMetadata
  };
};
