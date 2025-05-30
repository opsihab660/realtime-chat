import { useState, useEffect, useCallback } from 'react';
import { usersAPI } from '../services/api';
import { useSocket } from '../contexts/SocketContext';
import toast from 'react-hot-toast';

export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const { onlineUsers: socketOnlineUsers, allUsers: socketAllUsers, isConnected } = useSocket();

  // Load all users with optimized pagination
  const loadUsers = useCallback(async (searchTerm = '', pageNum = 1, append = false) => {
    try {
      console.log('🔄 Loading users...', { searchTerm, pageNum, append });
      setError(null);

      if (!append) {
        setIsLoading(true);
      }

      const params = {
        page: pageNum,
        limit: 15 // Reduced limit for better performance
      };

      // Only add search if it's not empty
      if (searchTerm && searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const response = await usersAPI.getUsers(params);
      const newUsers = response.data.users;

      console.log('✅ Users loaded successfully:', newUsers.length, 'users');

      if (append) {
        setUsers(prev => {
          // Prevent duplicates
          const existingIds = new Set(prev.map(user => user._id));
          const uniqueNewUsers = newUsers.filter(user => !existingIds.has(user._id));
          return [...prev, ...uniqueNewUsers];
        });
      } else {
        setUsers(newUsers);
        setPage(1);
      }

      setHasMore(response.data.pagination?.hasNext || false);
    } catch (error) {
      console.error('❌ Failed to load users:', error);
      setError(error.message || 'Failed to load users');
      toast.error('Failed to load users');

      // Set empty array on error to stop infinite loading
      if (!append) {
        setUsers([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load online users
  const loadOnlineUsers = useCallback(async () => {
    try {
      const response = await usersAPI.getOnlineUsers();
      setOnlineUsers(response.data.users);
    } catch (error) {
      console.error('Failed to load online users:', error);
      // Don't show error toast for online users as it's not critical
    }
  }, []);

  // Search users with debouncing
  const searchUsers = useCallback(async (query) => {
    // Don't set searchQuery here as it's managed by the parent component
    // This prevents conflicts with the debounced search logic
    setPage(1);
    setHasMore(true); // Reset hasMore when searching
    await loadUsers(query, 1, false);
  }, [loadUsers]);

  // Load more users (pagination)
  const loadMoreUsers = useCallback(async () => {
    if (isLoading || !hasMore) return;

    const nextPage = page + 1;
    setPage(nextPage);
    await loadUsers(searchQuery, nextPage, true);
  }, [isLoading, hasMore, page, searchQuery, loadUsers]);

  // Block/Unblock user
  const toggleBlockUser = useCallback(async (userId) => {
    try {
      const response = await usersAPI.blockUser(userId);
      toast.success(response.data.message);

      // Refresh users list
      await loadUsers(searchQuery, 1, false);
    } catch (error) {
      console.error('Failed to block/unblock user:', error);
      toast.error(error.response?.data?.message || 'Failed to block/unblock user');
    }
  }, [searchQuery, loadUsers]);

  // Add/Remove friend
  const toggleFriend = useCallback(async (userId) => {
    try {
      const response = await usersAPI.addFriend(userId);
      toast.success(response.data.message);

      // Refresh users list
      await loadUsers(searchQuery, 1, false);
    } catch (error) {
      console.error('Failed to add/remove friend:', error);
      toast.error(error.response?.data?.message || 'Failed to add/remove friend');
    }
  }, [searchQuery, loadUsers]);

  // Get user by ID
  const getUserById = useCallback(async (userId) => {
    try {
      const response = await usersAPI.getUserById(userId);
      return response.data.user;
    } catch (error) {
      console.error('Failed to get user:', error);
      toast.error('Failed to get user details');
      return null;
    }
  }, []);

  // Update online users from socket only
  useEffect(() => {
    if (socketOnlineUsers && socketOnlineUsers.length >= 0) {
      console.log('🔌 Socket online users updated:', socketOnlineUsers.length);
      setOnlineUsers(socketOnlineUsers);
    }
  }, [socketOnlineUsers]);

  // Don't override users from socket - let API be the source of truth for user list
  // Only use socket for online status updates

  // Load initial data - fixed to prevent infinite loop
  useEffect(() => {
    const initializeUsers = async () => {
      console.log('🚀 Initializing users...');
      try {
        await loadUsers();
        await loadOnlineUsers();
        console.log('✅ Users initialization complete');
      } catch (error) {
        console.error('❌ Users initialization failed:', error);
        setError('Failed to initialize users');
        setIsLoading(false);
      }
    };

    initializeUsers();
  }, []); // Empty dependency array to run only once

  // Filter users based on search query
  const filteredUsers = users.filter(user =>
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredOnlineUsers = onlineUsers.filter(user =>
    user.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return {
    users: filteredUsers,
    onlineUsers: filteredOnlineUsers,
    allUsers: users,
    isLoading,
    error,
    searchQuery,
    hasMore,
    isConnected,
    loadUsers,
    loadOnlineUsers,
    searchUsers,
    loadMoreUsers,
    toggleBlockUser,
    toggleFriend,
    getUserById,
    setSearchQuery,
    setError
  };
};
