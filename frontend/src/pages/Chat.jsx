import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderTypingIndicator from '../components/HeaderTypingIndicator';
import Message from '../components/Message';
import ReplyPreview from '../components/ReplyPreview';
import TypingIndicator from '../components/TypingIndicator';
import UserAvatar from '../components/UserAvatar';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useTheme } from '../contexts/ThemeContext';
import { useChat, useDebounce, useTyping, useUsers } from '../hooks';
// Skeleton Loading Components
import {
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  FaceSmileIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  PhotoIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { ComputerDesktopIcon, MoonIcon, SunIcon } from '@heroicons/react/24/solid';
import CustomEmojiPicker from '../components/CustomEmojiPicker';
import ImageUpload from '../components/ImageUpload';
import InitialLoader from '../components/InitialLoader';
import LazyLoader from '../components/LazyLoader';
import LazyLoadingTest from '../components/LazyLoadingTest';
import { ConversationListSkeleton } from '../components/skeletons/ConversationSkeleton';
import { MessageListSkeleton } from '../components/skeletons/MessageSkeleton';
import UserProfileModal from '../components/UserProfileModal';
import { fileAPI } from '../services/api';

const Chat = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isConnected, allUsers, typingUsers: socketTypingUsers, deleteMessage, editMessage } = useSocket();
  const { theme, toggleTheme } = useTheme();

  const [message, setMessage] = useState('');
  const [typingTimestamp, setTypingTimestamp] = useState(0);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState('profile'); // 'profile' or 'media'
  const [selectedImage, setSelectedImage] = useState(null);

  // Ref for textarea functionality
  const textareaRef = useRef(null);

  // Custom hooks
  const {
    conversations,
    currentConversation,
    setCurrentConversation,
    messages,
    handleSendMessage,
    selectConversation,
    startConversation,
    isLoading,
    isLoadingMessages,
    isLoadingOlderMessages,
    hasMoreMessages,
    messagesEndRef,
    messagesContainerRef,
    loadTriggerRef,
    forceScrollToBottom,
    handleUserScroll,
    shouldAutoScroll,
    // Conversation lazy loading
    hasMoreConversations,
    isLoadingConversations,
    loadMoreConversations
  } = useChat();

  const {
    users: allUsersList,
    onlineUsers,
    isLoading: isLoadingUsers,
    error: usersError,
    searchQuery,
    setSearchQuery,
    hasMore: hasMoreUsers,
    loadMoreUsers,
    searchUsers
  } = useUsers();

  // Debounced search query for better performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Trigger search when debounced query changes
  useEffect(() => {
    // Trigger search whenever the debounced query changes
    // This ensures search is executed after user stops typing for 300ms
    searchUsers(debouncedSearchQuery);
  }, [debouncedSearchQuery, searchUsers]);

  const {
    typingUsers: hookTypingUsers,
    handleTypingStart,
    handleTypingStop
  } = useTyping(
    currentConversation?._id,
    currentConversation?.participant?._id
  );

  // Combine typing users from both sources for current conversation - optimized
  const typingUsers = useMemo(() => {
    if (!currentConversation?._id) return [];

    // Get typing users from socket context for current conversation
    const socketUsers = Array.from(socketTypingUsers.values())
      .filter(user => user.conversationId === currentConversation._id)
      .map(user => ({ userId: user.userId || user.username, username: user.username }));

    // Combine with hook typing users
    const combined = [...hookTypingUsers, ...socketUsers];

    // Remove duplicates more efficiently
    const seen = new Set();
    const unique = combined.filter(user => {
      if (seen.has(user.userId)) return false;
      seen.add(user.userId);
      return true;
    });

    return unique;
  }, [hookTypingUsers, socketTypingUsers, currentConversation?._id]);

  // Helper function to check if user is online - memoized
  const isUserOnline = useCallback((userId) => {
    return allUsers.find(u => u.userId === userId)?.isOnline ||
           onlineUsers.some(u => u.userId === userId);
  }, [allUsers, onlineUsers]);

  // Helper function to get user status text - memoized
  const getUserStatusText = useCallback((userId) => {
    if (typingUsers.length > 0) return 'Typing...';

    const user = allUsers.find(u => u.userId === userId);
    if (isUserOnline(userId)) {
      return 'Online';
    } else if (user?.lastSeen) {
      const lastSeenDate = new Date(user.lastSeen);
      const now = new Date();
      const diffMinutes = Math.floor((now - lastSeenDate) / (1000 * 60));

      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
      return lastSeenDate.toLocaleDateString();
    }
    return 'Offline';
  }, [typingUsers.length, allUsers, isUserOnline]);

  // Helper function to check if user is typing in a specific conversation - memoized
  const isUserTypingInConversation = useCallback((userId, conversationId) => {
    return typingUsers.some(user =>
      user.userId === userId &&
      user.conversationId === conversationId
    );
  }, [typingUsers]);

  // Enhanced scroll handler - now primarily for user scroll detection
  // Intersection Observer handles the lazy loading
  const handleScroll = useCallback(() => {
    // Handle user scroll detection for auto-scroll behavior
    handleUserScroll();

    // Removed fallback lazy loading to prevent multiple triggers
    // Intersection Observer is the primary method for lazy loading
  }, [handleUserScroll]);

  // Removed debug logs to improve performance

  // Simple conversation filtering for search functionality
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) {
      return conversations;
    }

    // Filter conversations by participant username
    const searchLower = searchQuery.toLowerCase();
    return conversations.filter(conv =>
      conv.participant?.username?.toLowerCase().includes(searchLower)
    );
  }, [searchQuery, conversations]);

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <SunIcon className="w-5 h-5" />;
      case 'dark':
        return <MoonIcon className="w-5 h-5" />;
      default:
        return <ComputerDesktopIcon className="w-5 h-5" />;
    }
  };



  const handleSubmitMessage = (e) => {
    e.preventDefault();
    if (message.trim() && currentConversation) {
      handleSendMessage(message, 'text', replyingTo?._id);
      setMessage('');
      setReplyingTo(null);
      setShowEmojiPicker(false); // Close emoji picker when message is sent
      handleTypingStop();
    }
  };

  const handleReply = (messageToReply) => {
    setReplyingTo(messageToReply);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleImageUpload = (fileData, caption = '') => {
    if (currentConversation) {
      handleSendMessage(caption, 'image', replyingTo?._id, fileData);
      setReplyingTo(null);
      setShowEmojiPicker(false);
    }
  };

  // Handle message editing
  const handleEditMessage = async (messageToEdit, newContent) => {
    try {
      if (!currentConversation?._id) {
        console.error('No current conversation');
        return;
      }

      console.log('✏️ Frontend editing message:', messageToEdit._id, 'New content:', newContent);

      editMessage({
        messageId: messageToEdit._id,
        content: newContent,
        conversationId: currentConversation._id
      });

    } catch (error) {
      console.error('Edit message error:', error);
    }
  };

  const handleDeleteMessage = async (messageToDelete) => {
    if (!currentConversation || !messageToDelete) return;

    try {
      console.log('🗑️ Deleting message:', {
        messageId: messageToDelete._id,
        conversationId: currentConversation._id,
        currentConversation: currentConversation
      });

      // If message contains an image, delete the image file from server first
      if (messageToDelete.type === 'image' && messageToDelete.file) {
        try {
          // Extract filename from the URL
          const imageUrl = messageToDelete.file.url;
          const filename = imageUrl.split('/').pop();

          // Delete the image file
          await fileAPI.deleteImage(filename);
          console.log('Image file deleted from server:', filename);
        } catch (error) {
          console.error('Failed to delete image file from server:', error);
          // Continue with message deletion even if image deletion fails
        }
      }

      // Delete the message
      deleteMessage({
        messageId: messageToDelete._id,
        conversationId: currentConversation._id
      });
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  // Optimized auto-scroll for typing indicators - consolidated logic
  useEffect(() => {
    if (typingUsers.length > 0) {
      // Single scroll attempt with minimal delay
      forceScrollToBottom();

      // One additional scroll after DOM updates - reduced delay
      const timer = setTimeout(() => forceScrollToBottom(), 50);
      return () => clearTimeout(timer);
    }
  }, [typingUsers.length, forceScrollToBottom]);

  // Conditional auto-scroll based on user behavior
  useEffect(() => {
    if (currentConversation && messages.length > 0 && shouldAutoScroll) {
      // Only auto-scroll when user is near bottom or conversation changes
      forceScrollToBottom();
    }
  }, [currentConversation?._id, messages.length, forceScrollToBottom, shouldAutoScroll]);

  // Optimized message change handler with debouncing
  const handleMessageChange = useCallback((e) => {
    const newValue = e.target.value;
    setMessage(newValue);

    // Only trigger typing logic if there's actual content
    if (newValue.trim().length > 0) {
      setTypingTimestamp(Date.now());
      handleTypingStart();
    } else {
      handleTypingStop();
    }
  }, [handleTypingStart, handleTypingStop]);

  // Emoji picker functions
  const handleEmojiClick = (emojiData) => {
    const emoji = emojiData.emoji;
    const textarea = textareaRef.current;
    let newMessage;

    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      newMessage = message.slice(0, start) + emoji + message.slice(end);

      setMessage(newMessage);

      // Set cursor position after the emoji
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    } else {
      // Fallback: append emoji to the end
      newMessage = message + emoji;
      setMessage(newMessage);
    }

    // Trigger typing animation
    if (newMessage.length > 0) {
      setTypingTimestamp(Date.now());
      handleTypingStart();
    }

    // Keep picker open for multiple emoji selection
    // setShowEmojiPicker(false);
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(prev => !prev);
  };

  // Handle profile viewing
  const handleViewProfile = (userId) => {
    if (currentConversation && userId === currentConversation.participant?._id) {
      toggleRightPanel('profile');
    } else {
      setSelectedUserId(userId);
      setShowProfileModal(true);
    }
  };

  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
    setSelectedUserId(null);
  };

  // Toggle right panel
  const toggleRightPanel = useCallback((tab = 'profile') => {
    setShowRightPanel(prev => {
      if (prev && rightPanelTab === tab) {
        return false;
      } else {
        setRightPanelTab(tab);
        return true;
      }
    });
  }, [rightPanelTab]);

  // Close right panel if conversation changes
  useEffect(() => {
    setShowRightPanel(false);
  }, [currentConversation?._id]);

  // Filter messages to get only image messages
  const imageMessages = useMemo(() => {
    if (!messages || !messages.length) return [];
    return messages.filter(msg => msg.type === 'image' && msg.file && !msg.deleted?.isDeleted);
  }, [messages]);

  // Get image URL
  const getImageUrl = (filePath) => {
    if (!filePath) return null;
    return filePath.startsWith('http')
      ? filePath
      : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${filePath}`;
  };

  // Handle showing media gallery
  const handleShowMediaGallery = () => {
    toggleRightPanel('media');
  };

  // Handle image click in gallery
  const handleImageClick = (imageMsg) => {
    setSelectedImage(imageMsg);
  };

  // Close image preview
  const handleCloseImagePreview = () => {
    setSelectedImage(null);
  };

  return (
    <div className="chat-container h-screen w-screen flex bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
      {/* Sidebar */}
      <div className={`
        w-full lg:w-80 lg:min-w-80 lg:max-w-80
        bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        flex flex-col
        ${currentConversation
          ? 'hidden lg:flex'
          : 'flex'
        }
        transition-all duration-300 ease-in-out
      `}>
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="bg-blue-600 p-1.5 sm:p-2 rounded-full">
                <ChatBubbleLeftRightIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                  Chat App
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  {isConnected ? (
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-1 sm:mr-2"></span>
                      <span className="hidden sm:inline">Connected</span>
                      <span className="sm:hidden">Online</span>
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-1 sm:mr-2"></span>
                      <span className="hidden sm:inline">Disconnected</span>
                      <span className="sm:hidden">Offline</span>
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-2">
              <button
                onClick={toggleTheme}
                className="p-1.5 sm:p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={`Current theme: ${theme}`}
              >
                {getThemeIcon()}
              </button>

              <button
                onClick={() => navigate('/settings')}
                className="p-1.5 sm:p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Settings"
              >
                <Cog6ToothIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <UserAvatar
              user={user}
              size="md"
              showStatus={true}
              isOnline={isConnected}
            />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">
                {user?.username}
              </p>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                  {isConnected ? 'Connected' : 'Disconnected'}
                  {isLoadingUsers && (
                    <span className="ml-2 text-blue-600 dark:text-blue-400">• Loading users...</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500" />
            <input
              type="text"
              placeholder="Search users to start new conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-sm border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">
              Searching for "{searchQuery}"...
            </p>
          )}
        </div>

        {/* Enhanced Recent Conversations - Full Height */}
        <div className="flex-1 flex flex-col bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
          {/* Header Section */}
          <div className="p-4 pb-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                    {searchQuery ? 'Search Results' : 'Recent Chats'}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(searchQuery ? filteredConversations : conversations).length} conversation{(searchQuery ? filteredConversations : conversations).length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              {searchQuery && (
                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full font-medium">
                  {filteredConversations.length} found
                </span>
              )}
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300 dark:scrollbar-thumb-blue-600">
            <InitialLoader
              isLoading={isLoading}
              hasData={conversations.length > 0 || allUsersList.length > 0}
              type="conversations"
              className="h-full"
            >
              {/* Search Results - Show both conversations and users */}
              {searchQuery ? (
              <div className="space-y-1 p-2">
                {/* Filtered Conversations */}
                {filteredConversations.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-3 py-2">
                      Conversations ({filteredConversations.length})
                    </h3>
                    {filteredConversations.map((conversation) => {
                      const isTyping = isUserTypingInConversation(conversation.participant?._id, conversation._id);
                      const isCurrentConversation = currentConversation?._id === conversation._id;
                      const lastMessage = conversation.lastMessage;
                      const isOwnMessage = lastMessage?.sender?._id === user._id || lastMessage?.sender === user._id;

                      return (
                        <button
                          key={conversation._id}
                          onClick={() => selectConversation(conversation)}
                          className={`
                            w-full p-3 rounded-lg text-left transition-colors duration-200
                            ${isCurrentConversation
                              ? 'bg-blue-100 dark:bg-blue-900 border border-blue-200 dark:border-blue-800'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                            }
                            ${isTyping ? 'ring-2 ring-blue-400 ring-opacity-50 scale-[1.02] shadow-lg' : ''}
                          `}
                        >
                          <div className="flex items-center space-x-3">
                            <UserAvatar
                              user={conversation.participant}
                              showStatus={true}
                              isOnline={isUserOnline(conversation.participant?._id)}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-gray-900 dark:text-white truncate">
                                  {conversation.participant?.username}
                                </p>
                              </div>
                              <p className={`text-sm truncate ${
                                conversation.unreadCount > 0 && !isOwnMessage
                                  ? 'font-semibold text-gray-900 dark:text-white'
                                  : 'text-gray-500 dark:text-gray-400'
                              }`}>
                                {isTyping ? (
                                  <span className="text-blue-600 dark:text-blue-400 font-medium flex items-center">
                                    <span className="mr-1">Typing</span>
                                    <span className="flex space-x-0.5">
                                      <span className="animate-typing-dot">.</span>
                                      <span className="animate-typing-dot animation-delay-200">.</span>
                                      <span className="animate-typing-dot animation-delay-400">.</span>
                                    </span>
                                  </span>
                                ) : (
                                  <>
                                    {isOwnMessage && <span className="text-gray-400 dark:text-gray-500">You: </span>}
                                    {lastMessage?.type === 'image' ? (
                                      <span className="flex items-center">
                                        <PhotoIcon className="w-4 h-4 mr-1" />
                                        {lastMessage.content ? lastMessage.content : 'Photo'}
                                      </span>
                                    ) : (
                                      lastMessage?.content || 'No messages yet'
                                    )}
                                  </>
                                )}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Available Users for New Conversations with Lazy Loading */}
                {allUsersList.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-3 py-2">
                      Users ({allUsersList.length})
                    </h3>
                    <LazyLoader
                      onLoadMore={loadMoreUsers}
                      hasMore={hasMoreUsers}
                      isLoading={isLoadingUsers}
                      className="space-y-1"
                      loadingComponent={
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading more users...</span>
                        </div>
                      }
                    >
                      {allUsersList.map((user) => {
                        // Don't show users who already have conversations
                        const hasConversation = conversations.some(conv =>
                          conv.participant?._id === user._id
                        );

                        if (hasConversation) return null;

                        return (
                          <button
                            key={user._id}
                            onClick={async () => {
                              console.log('🚀 Starting conversation with:', user.username);
                              const conversation = await startConversation(user._id);
                              if (conversation) {
                                setSearchQuery(''); // Clear search after starting conversation
                              }
                            }}
                            className="w-full p-3 rounded-lg text-left transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <div className="flex items-center space-x-3">
                              <UserAvatar
                                user={user}
                                showStatus={true}
                                isOnline={isUserOnline(user._id)}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white truncate">
                                  {user.username}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Click to start conversation •
                                  <span
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewProfile(user._id);
                                    }}
                                    className="text-blue-600 dark:text-blue-400 hover:underline ml-1 cursor-pointer"
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleViewProfile(user._id);
                                      }
                                    }}
                                  >
                                    View profile
                                  </span>
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </LazyLoader>
                  </div>
                )}

                {/* No Results */}
                {filteredConversations.length === 0 && allUsersList.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full p-8">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                      <MagnifyingGlassIcon className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      No results found
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
                      No users or conversations match "<span className="font-medium">{searchQuery}</span>"
                    </p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                    >
                      Clear search
                    </button>
                  </div>
                )}
              </div>
            ) : isLoadingUsers && conversations.length === 0 ? (
              /* Skeleton Loading for Conversations */
              <ConversationListSkeleton
                count={6}
                variant="shimmer"
                staggered={true}
                className="p-0"
              />
            ) : conversations.length === 0 && allUsersList.length > 0 ? (
              /* Show available users when no conversations exist */
              <div className="space-y-1 p-2">
                <div className="mb-4 text-center p-4">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Start Your First Conversation
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Choose someone to chat with from the users below
                  </p>
                </div>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-3 py-2">
                  Available Users ({allUsersList.length})
                </h3>
                <LazyLoader
                  onLoadMore={loadMoreUsers}
                  hasMore={hasMoreUsers}
                  isLoading={isLoadingUsers}
                  className="space-y-1"
                  loadingComponent={
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Loading more users...</span>
                    </div>
                  }
                >
                  {allUsersList.map((user) => (
                    <button
                      key={user._id}
                      onClick={async () => {
                        console.log('🚀 Starting conversation with:', user.username);
                        const conversation = await startConversation(user._id);
                        if (conversation) {
                          console.log('✅ Conversation started successfully');
                        }
                      }}
                      className="w-full p-3 rounded-lg text-left transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <div className="flex items-center space-x-3">
                        <UserAvatar
                          user={user}
                          showStatus={true}
                          isOnline={isUserOnline(user._id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {user.username}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {isUserOnline(user._id) ? 'Online' : 'Offline'} • Click to start conversation •
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewProfile(user._id);
                              }}
                              className="text-blue-600 dark:text-blue-400 hover:underline ml-1 cursor-pointer"
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleViewProfile(user._id);
                                }
                              }}
                            >
                              View profile
                            </span>
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </LazyLoader>
              </div>
            ) : conversations.length === 0 ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center h-full p-8">
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ChatBubbleLeftRightIcon className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  No users available
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-center">
                  {usersError ? 'Failed to load users. Please refresh the page.' : 'No users found to start conversations with.'}
                </p>
                {usersError && (
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Refresh Page
                  </button>
                )}
              </div>
            ) : (
              /* Conversations List with Lazy Loading */
              <LazyLoader
                onLoadMore={loadMoreConversations}
                hasMore={hasMoreConversations}
                isLoading={isLoadingConversations}
                className="space-y-1 p-2"
                loadingComponent={
                  <ConversationListSkeleton
                    count={3}
                    variant="shimmer"
                    staggered={true}
                    className="p-0"
                  />
                }
              >
                {(searchQuery ? filteredConversations : conversations).map((conversation) => {
                  const isTyping = isUserTypingInConversation(conversation.participant?._id, conversation._id);
                  const isCurrentConversation = currentConversation?._id === conversation._id;
                  const lastMessage = conversation.lastMessage;
                  const isOwnMessage = lastMessage?.sender?._id === user._id || lastMessage?.sender === user._id;

                  return (
                    <button
                      key={conversation._id}
                      onClick={() => selectConversation(conversation)}
                      className={`
                        w-full p-3 rounded-lg text-left transition-colors duration-200
                        ${isCurrentConversation
                          ? 'bg-blue-100 dark:bg-blue-900 border border-blue-200 dark:border-blue-800'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }
                        ${isTyping ? 'ring-2 ring-blue-400 ring-opacity-50 scale-[1.02] shadow-lg' : ''}
                      `}
                    >
                      <div className="flex items-center space-x-3">
                        <UserAvatar
                          user={conversation.participant}
                          showStatus={true}
                          isOnline={isUserOnline(conversation.participant?._id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewProfile(conversation.participant?._id);
                              }}
                              className="font-medium text-gray-900 dark:text-white truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left cursor-pointer"
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleViewProfile(conversation.participant?._id);
                                }
                              }}
                            >
                              {conversation.participant?.username}
                            </span>
                            {/* Seen/Sent Status for last message */}
                            {lastMessage && isOwnMessage && (
                              <div className="flex items-center space-x-1 ml-2">
                                {lastMessage.readBy && lastMessage.readBy.length > 0 ? (
                                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                            )}
                          </div>
                          <p className={`text-sm truncate ${
                            conversation.unreadCount > 0 && !isOwnMessage
                              ? 'font-semibold text-gray-900 dark:text-white'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {isTyping ? (
                              <span className="text-blue-600 dark:text-blue-400 font-medium flex items-center">
                                <span className="mr-1">Typing</span>
                                <span className="flex space-x-0.5">
                                  <span className="animate-typing-dot">.</span>
                                  <span className="animate-typing-dot animation-delay-200">.</span>
                                  <span className="animate-typing-dot animation-delay-400">.</span>
                                </span>
                              </span>
                            ) : (
                              <>
                                {isOwnMessage && <span className="text-gray-400 dark:text-gray-500">You: </span>}
                                {lastMessage?.type === 'image' ? (
                                  <span className="flex items-center">
                                    <PhotoIcon className="w-4 h-4 mr-1" />
                                    {lastMessage.content ? lastMessage.content : 'Photo'}
                                  </span>
                                ) : (
                                  lastMessage?.content || 'No messages yet'
                                )}
                              </>
                            )}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {lastMessage?.createdAt
                              ? new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : ''
                            }
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </LazyLoader>
            )}
            </InitialLoader>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {currentConversation ? (
          <div className="flex flex-col h-full">
            {/* Chat Header */}
            <div className="flex-shrink-0 bg-white dark:bg-gray-800">
              <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => {
                      setCurrentConversation(null);
                      // Ensure scroll position is maintained when going back to user list
                    }}
                    className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="relative flex-shrink-0">
                    <UserAvatar
                      user={currentConversation.participant}
                      size="md"
                      showStatus={true}
                      isOnline={isUserOnline(currentConversation.participant?._id)}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <button
                      onClick={() => handleViewProfile(currentConversation.participant?._id)}
                      className="text-left w-full hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-1 -m-1 transition-colors"
                    >
                      <h2 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        {currentConversation.participant?.username}
                      </h2>
                      <p className={`text-xs sm:text-sm ${
                        typingUsers.length > 0
                          ? 'text-blue-600 dark:text-blue-400'
                          : isUserOnline(currentConversation.participant?._id)
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {getUserStatusText(currentConversation.participant?._id)}
                      </p>
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    {/* Info Button - Single toggle for right panel */}
                    <button
                      onClick={() => toggleRightPanel(rightPanelTab || 'profile')}
                      className={`p-2 rounded-full transition-colors ${
                        showRightPanel
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-600 dark:hover:text-blue-400'
                      }`}
                      title="View details"
                    >
                      <InformationCircleIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Enhanced Typing Status Bar - More Visible */}
              <HeaderTypingIndicator
                typingUsers={typingUsers}
                currentUser={currentConversation.participant}
              />
            </div>

            {/* Main Chat Container with Right Panel */}
            <div className="flex-1 flex overflow-hidden">
              {/* Messages Area with Enhanced Lazy Loading */}
              <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className={`overflow-y-auto p-2 sm:p-4 bg-gray-50 dark:bg-gray-900 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent ${
                  showRightPanel ? 'hidden md:block md:flex-1' : 'flex-1'
                }`}
              >
                {isLoadingMessages && messages.length === 0 ? (
                  <MessageListSkeleton
                    count={3}
                    variant="shimmer"
                    randomPattern={true}
                    className="py-4"
                  />
                ) : messages.length === 0 ? (
                  <div className="text-center py-8">
                    <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Start a conversation with {currentConversation.participant?.username}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {/* Load Trigger Element for Intersection Observer - positioned at top */}
                    {hasMoreMessages && (
                      <div
                        ref={loadTriggerRef}
                        className="flex justify-center py-2"
                        style={{ minHeight: '40px' }}
                      >
                        {isLoadingOlderMessages ? (
                          <div className="flex items-center space-x-3 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                            <span className="text-sm font-medium">Loading older messages...</span>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100/80 dark:bg-gray-800/80 px-3 py-1 rounded-full backdrop-blur-sm">
                            Scroll up for more messages
                          </div>
                        )}
                      </div>
                    )}

                    {/* Messages */}
                    {messages.map((msg) => (
                      <div key={msg._id} data-message-id={msg._id}>
                        <Message
                          message={msg}
                          isOwn={msg.sender._id === user._id}
                          currentUser={user}
                          conversationParticipant={currentConversation?.participant}
                          onReply={handleReply}
                          onEdit={handleEditMessage}
                          onDelete={handleDeleteMessage}
                        />
                      </div>
                    ))}

                    {/* Modern Typing indicator */}
                    <TypingIndicator
                      typingUsers={typingUsers}
                      timestamp={typingTimestamp}
                    />

                    {/* Auto-scroll target */}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Right Side Panel - Responsive */}
              <div
                className={`bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 ease-in-out ${
                  showRightPanel
                    ? 'w-full md:w-80 lg:w-96 opacity-100 h-full absolute md:static top-0 left-0 right-0 z-20'
                    : 'w-0 opacity-0 h-full'
                }`}
              >
                {showRightPanel && (
                  <div className="h-full flex flex-col">
                    {/* Panel Header */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {rightPanelTab === 'profile' ? 'Profile Details' : 'Shared Media'}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {/* Mobile Back Button */}
                        <button
                          onClick={() => setShowRightPanel(false)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Panel Tabs */}
                    <div className="flex border-b border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => setRightPanelTab('profile')}
                        className={`flex-1 py-3 text-sm font-medium text-center ${
                          rightPanelTab === 'profile'
                            ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                      >
                        Profile
                      </button>
                      <button
                        onClick={() => setRightPanelTab('media')}
                        className={`flex-1 py-3 text-sm font-medium text-center ${
                          rightPanelTab === 'media'
                            ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                      >
                        Media
                      </button>
                    </div>

                    {/* Panel Content - Responsive Padding */}
                    <div className="flex-1 overflow-y-auto scrollbar-thin">
                      {rightPanelTab === 'profile' && currentConversation?.participant && (
                        <div className="p-3 sm:p-4">
                          {/* User Profile Section */}
                          <div className="text-center mb-6">
                            <div className="mb-4">
                              <UserAvatar
                                user={currentConversation.participant}
                                size="xl"
                                showStatus={true}
                                isOnline={isUserOnline(currentConversation.participant?._id)}
                                className="mx-auto"
                              />
                            </div>

                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                              {currentConversation.participant.displayName || currentConversation.participant.username}
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-2">
                              @{currentConversation.participant.username}
                            </p>

                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm">
                              <span className={`w-2 h-2 rounded-full mr-2 ${
                                isUserOnline(currentConversation.participant?._id)
                                  ? 'bg-green-500'
                                  : 'bg-gray-400'
                              }`}></span>
                              <span>{getUserStatusText(currentConversation.participant?._id)}</span>
                            </div>
                          </div>

                          {/* Bio Section */}
                          {currentConversation.participant.bio && (
                            <div className="mb-6">
                              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                Bio
                              </h4>
                              <p className="text-gray-800 dark:text-gray-200 text-sm">
                                {currentConversation.participant.bio}
                              </p>
                            </div>
                          )}

                          {/* User Details */}
                          <div className="mb-6">
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                              Information
                            </h4>
                            <div className="space-y-3">
                              {currentConversation.participant.fullName && (
                                <div>
                                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    Full Name
                                  </label>
                                  <p className="text-sm text-gray-900 dark:text-white">
                                    {currentConversation.participant.fullName}
                                  </p>
                                </div>
                              )}

                              <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                  Username
                                </label>
                                <p className="text-sm text-gray-900 dark:text-white">
                                  {currentConversation.participant.username}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="mb-6">
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                              Actions
                            </h4>
                            <div className="space-y-2">
                              <button
                                onClick={() => navigate(`/profile/${currentConversation.participant._id}`)}
                                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                              >
                                <span>View Full Profile</span>
                              </button>

                              <button
                                className="w-full py-2 px-4 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center justify-center space-x-2"
                              >
                                <span>Block User</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {rightPanelTab === 'media' && (
                        <div className="p-3 sm:p-4">
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                            Shared Images
                          </h4>

                          {imageMessages.length === 0 ? (
                            <div className="text-center py-10">
                              <PhotoIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                              <p className="text-gray-500 dark:text-gray-400">
                                No images shared in this conversation yet
                              </p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-2">
                              {imageMessages.map((imgMsg) => (
                                <div
                                  key={imgMsg._id}
                                  className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => handleImageClick(imgMsg)}
                                >
                                  <img
                                    src={getImageUrl(imgMsg.file?.url)}
                                    alt={imgMsg.content || 'Shared image'}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = 'https://via.placeholder.com/150?text=Error';
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Back to Chat Button - Mobile Only */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 md:hidden">
                      <button
                        onClick={() => setShowRightPanel(false)}
                        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center"
                      >
                        Back to Chat
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Reply Preview */}
            <ReplyPreview
              replyingTo={replyingTo}
              onCancel={handleCancelReply}
              currentUser={user}
              conversationParticipant={currentConversation?.participant}
            />

            {/* Message Input */}
            <div className={`flex-shrink-0 p-2 sm:p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 relative ${
              showRightPanel ? 'md:pr-[336px] lg:pr-[384px] z-10' : ''
            }`}>
              {/* Custom Emoji Picker */}
              <div className="absolute bottom-full right-2 sm:right-3 mb-2 z-50">
                <CustomEmojiPicker
                  isVisible={showEmojiPicker}
                  onEmojiClick={handleEmojiClick}
                  onClose={() => setShowEmojiPicker(false)}
                />
              </div>

              <form onSubmit={handleSubmitMessage} className="flex items-center space-x-2 sm:space-x-3">
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={handleMessageChange}
                    onFocus={() => {
                      // Optional: Could trigger typing start on focus if there's content
                      if (message.trim()) {
                        handleTypingStart();
                      }
                    }}
                    onBlur={() => {
                      // Stop typing when user leaves the input (mobile keyboards)
                      handleTypingStop();
                    }}
                    placeholder={`Message ${currentConversation.participant?.username}...`}
                    className="w-full px-3 sm:px-4 py-2 pr-10 sm:pr-12 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none break-words whitespace-pre-wrap min-h-[40px] max-h-32 overflow-y-auto"
                    autoComplete="off"
                    rows="1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitMessage(e);
                      }
                      // Removed redundant typing logic from onKeyDown since onChange handles it
                    }}
                  />
                  {/* Enhanced Emoji Button */}
                  <button
                    type="button"
                    className={`absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-lg transition-all duration-200 text-sm sm:text-base ${
                      showEmojiPicker
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900'
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    onClick={toggleEmojiPicker}
                    title="Add emoji"
                  >
                    <FaceSmileIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Image Upload Button */}
                <button
                  type="button"
                  onClick={() => setShowImageUpload(true)}
                  className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200 flex items-center justify-center"
                  title="Upload image"
                >
                  <PhotoIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                >
                  <PaperAirplaneIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <div className="text-center max-w-md mx-auto">
              <ChatBubbleLeftRightIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3 sm:mb-4" />
              <h2 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Welcome to Chat App
              </h2>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                <span className="hidden sm:inline">Select a user from the sidebar to start chatting</span>
                <span className="sm:hidden">Tap a user to start chatting</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Performance Monitor - Only in development */}
      {process.env.NODE_ENV === 'development' && (
        <LazyLoadingTest enabled={true} />
      )}

      {/* User Profile Modal - Now only used for non-current conversation users */}
      <UserProfileModal
        userId={selectedUserId}
        isOpen={showProfileModal}
        onClose={handleCloseProfileModal}
      />

      {/* Image Upload Modal */}
      <ImageUpload
        isVisible={showImageUpload}
        onImageUpload={handleImageUpload}
        onClose={() => setShowImageUpload(false)}
      />

      {/* Full Size Image Preview */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
          onClick={handleCloseImagePreview}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCloseImagePreview();
              }}
              className="absolute -top-12 right-0 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            <img
              src={getImageUrl(selectedImage.file?.url)}
              alt={selectedImage.content || 'Shared image'}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            {selectedImage.content && (
              <div className="mt-4 text-center text-white bg-black bg-opacity-50 p-3 rounded">
                <p>{selectedImage.content}</p>
                <p className="text-sm text-gray-300 mt-1">
                  Sent {new Date(selectedImage.createdAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
