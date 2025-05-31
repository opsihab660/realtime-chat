import { createContext, useContext, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { isAuthenticated, token, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Map());
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Initialize socket connection
  useEffect(() => {
    if (isAuthenticated && token && user) {
      const newSocket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:5000', {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      // Connection events
      newSocket.on('connect', () => {
        console.log('✅ Connected to server');
        setIsConnected(true);
        setSocket(newSocket);
        reconnectAttempts.current = 0;
        toast.success('Connected to chat server');
      });

      newSocket.on('disconnect', (reason) => {
        console.log('❌ Disconnected from server:', reason);
        setIsConnected(false);

        if (reason === 'io server disconnect') {
          // Server disconnected, try to reconnect
          newSocket.connect();
        }
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
        setIsConnected(false);

        reconnectAttempts.current += 1;
        if (reconnectAttempts.current <= maxReconnectAttempts) {
          console.log(`🔄 Retrying connection... (${reconnectAttempts.current}/${maxReconnectAttempts})`);
          toast.error(`Connection failed. Retrying... (${reconnectAttempts.current}/${maxReconnectAttempts})`);
        } else {
          console.log('❌ Max reconnection attempts reached');
          toast.error('Failed to connect to chat server. Please refresh the page.');
        }
      });

      newSocket.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason);
        setIsConnected(false);

        if (reason === 'io server disconnect') {
          // Server disconnected the socket, reconnect manually
          console.log('🔄 Server disconnected, attempting to reconnect...');
          newSocket.connect();
        }
      });

      // All users status events
      newSocket.on('all_users_status', (users) => {
        console.log('👥 Received all users status:', users.length, 'users');
        setAllUsers(users);
        // Filter online users
        const online = users.filter(u => u.isOnline);
        console.log('🟢 Online users:', online.length);
        setOnlineUsers(online);
      });

      // User status change events (online/offline)
      newSocket.on('user_status_changed', (userData) => {

        // Update all users list
        setAllUsers(prev => {
          const filtered = prev.filter(u => u.userId !== userData.userId);
          return [...filtered, userData].sort((a, b) => {
            // Sort: online users first, then by last seen
            if (a.isOnline && !b.isOnline) return -1;
            if (!a.isOnline && b.isOnline) return 1;
            return new Date(b.lastSeen) - new Date(a.lastSeen);
          });
        });

        // Update online users list
        if (userData.isOnline) {
          setOnlineUsers(prev => {
            const filtered = prev.filter(u => u.userId !== userData.userId);
            return [...filtered, userData];
          });
          if (userData.userId !== user._id) {
            toast.success(`${userData.username} is now online`, {
              duration: 2000,
              icon: '🟢'
            });
          }
        } else {
          setOnlineUsers(prev => prev.filter(u => u.userId !== userData.userId));
          if (userData.userId !== user._id) {
            toast(`${userData.username} went offline`, {
              duration: 2000,
              icon: '🔴'
            });
          }
        }
      });

      // ✅ ULTRA-FAST TYPING EVENTS - Reduced timeouts for instant response
      newSocket.on('user_typing', (data) => {
        setTypingUsers(prev => {
          const newMap = new Map(prev);
          newMap.set(data.userId, {
            username: data.username,
            conversationId: data.conversationId,
            timestamp: Date.now()
          });
          return newMap;
        });

        // ✅ Reduced auto-remove from 3.5s to 2.5s for faster cleanup
        setTimeout(() => {
          setTypingUsers(prev => {
            const newMap = new Map(prev);
            newMap.delete(data.userId);
            return newMap;
          });
        }, 2500);
      });

      newSocket.on('user_stopped_typing', (data) => {
        setTypingUsers(prev => {
          const newMap = new Map(prev);
          newMap.delete(data.userId);
          return newMap;
        });
      });

      // Message events
      newSocket.on('new_message', () => {
        // This will be handled by the Chat component
      });

      newSocket.on('message_sent', () => {
        // This will be handled by the Chat component
      });

      newSocket.on('message_error', (error) => {
        toast.error(error.error || 'Failed to send message');
      });

      // Reaction events
      newSocket.on('reaction_added', () => {
        // This will be handled by the Chat component
      });

      newSocket.on('reaction_error', (error) => {
        toast.error(error.error || 'Failed to add reaction');
      });

      // Read receipt events
      newSocket.on('message_read', () => {
        // This will be handled by the Chat component
      });

      newSocket.on('read_error', (error) => {
        console.error('Read receipt error:', error);
        toast.error(error.error || 'Failed to mark messages as read');
      });

      // Edit message events
      newSocket.on('message_edited', () => {
        // This will be handled by the Chat component
      });

      newSocket.on('edit_error', (error) => {
        console.error('Edit message error:', error);
        toast.error(error.error || 'Failed to edit message');
      });

      // Delete message events
      newSocket.on('message_deleted', () => {
        // This will be handled by the Chat component
      });

      newSocket.on('delete_error', (error) => {
        console.error('Delete message error:', error);
        toast.error(error.error || 'Failed to delete message');
      });



      return () => {
        newSocket.disconnect();
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers([]);
        setAllUsers([]);
        setTypingUsers(new Map());
      };
    }
  }, [isAuthenticated, token, user]);

  // Socket helper functions
  const sendMessage = (messageData) => {
    if (socket && isConnected) {
      socket.emit('send_message', messageData);
    } else {
      toast.error('Not connected to server');
    }
  };

  const startTyping = (conversationData) => {
    if (socket && isConnected) {
      socket.emit('typing_start', conversationData);
    }
  };

  const stopTyping = (conversationData) => {
    if (socket && isConnected) {
      socket.emit('typing_stop', conversationData);
    }
  };

  const addReaction = (messageId, emoji) => {
    if (socket && isConnected) {
      socket.emit('add_reaction', { messageId, emoji });
    } else {
      toast.error('Not connected to server');
    }
  };

  const markMessagesAsRead = (data) => {
    if (socket && isConnected) {
      socket.emit('mark_messages_read', data);
    }
  };

  const updateStatus = (status) => {
    if (socket && isConnected) {
      socket.emit('update_status', { status });
    }
  };

  const editMessage = (messageData) => {
    if (socket && isConnected) {
      socket.emit('edit_message', messageData);
    } else {
      toast.error('Not connected to server');
    }
  };

  const deleteMessage = (messageData) => {
    if (socket && isConnected) {
      socket.emit('delete_message', messageData);
    } else {
      toast.error('Not connected to server');
    }
  };

  const value = {
    socket,
    isConnected,
    onlineUsers,
    allUsers,
    typingUsers,
    sendMessage,
    startTyping,
    stopTyping,
    addReaction,
    markMessagesAsRead,
    updateStatus,
    editMessage,
    deleteMessage
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export default SocketContext;
