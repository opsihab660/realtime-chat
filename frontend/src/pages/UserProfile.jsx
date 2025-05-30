import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { usersAPI } from '../services/api';
import { useChat } from '../hooks';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  ShieldExclamationIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { allUsers } = useSocket();
  const { startConversation } = useChat();
  
  const [profileUser, setProfileUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isStartingConversation, setIsStartingConversation] = useState(false);

  // Check if user is online
  const isUserOnline = (userId) => {
    return allUsers.find(u => u.userId === userId)?.isOnline || false;
  };

  // Get user status text
  const getUserStatusText = (user) => {
    if (!user) return 'Unknown';
    
    if (isUserOnline(user._id)) {
      return 'Online';
    } else if (user.lastSeen) {
      const lastSeenDate = new Date(user.lastSeen);
      const now = new Date();
      const diffMinutes = Math.floor((now - lastSeenDate) / (1000 * 60));

      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
      return lastSeenDate.toLocaleDateString();
    }
    return 'Offline';
  };

  // Load user profile
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!userId) return;
      
      setIsLoading(true);
      setError(null);

      try {
        const response = await usersAPI.getUserById(userId);
        setProfileUser(response.data.user);
      } catch (error) {
        console.error('Failed to load user profile:', error);
        setError(error.response?.data?.message || 'Failed to load user profile');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, [userId]);

  // Handle start conversation
  const handleStartConversation = async () => {
    if (!profileUser) return;
    
    setIsStartingConversation(true);
    try {
      const conversation = await startConversation(profileUser._id);
      if (conversation) {
        toast.success(`Started conversation with ${profileUser.username}`);
        navigate('/chat');
      }
    } catch (error) {
      toast.error('Failed to start conversation');
    } finally {
      setIsStartingConversation(false);
    }
  };

  // Handle block user
  const handleBlockUser = async () => {
    if (!profileUser) return;
    
    try {
      await usersAPI.blockUser(profileUser._id);
      setIsBlocked(!isBlocked);
      toast.success(isBlocked ? 'User unblocked' : 'User blocked');
    } catch (error) {
      toast.error('Failed to block/unblock user');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <ShieldExclamationIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Profile Not Available
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/chat')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Chat
          </button>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">User not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/chat')}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  User Profile
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  View {profileUser.username}'s profile
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            {/* Profile Header */}
            <div className="px-6 py-8 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-3xl">
                      {profileUser.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {/* Online Status */}
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 border-4 border-white dark:border-gray-800 rounded-full ${
                    isUserOnline(profileUser._id) ? 'bg-green-500' : 'bg-gray-400 dark:bg-gray-600'
                  }`}></div>
                </div>

                {/* User Info */}
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {profileUser.displayName || profileUser.username}
                  </h2>
                  <p className="text-lg text-gray-500 dark:text-gray-400 mb-2">
                    @{profileUser.username}
                  </p>
                  
                  {/* Status */}
                  <div className="flex items-center justify-center sm:justify-start space-x-2 mb-4">
                    {isUserOnline(profileUser._id) ? (
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    ) : (
                      <ClockIcon className="w-5 h-5 text-gray-400" />
                    )}
                    <span className={`text-sm font-medium ${
                      isUserOnline(profileUser._id) 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {getUserStatusText(profileUser)}
                    </span>
                  </div>

                  {/* Bio */}
                  {profileUser.bio && (
                    <p className="text-gray-700 dark:text-gray-300 mb-4 max-w-md">
                      {profileUser.bio}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3">
                    <button
                      onClick={handleStartConversation}
                      disabled={isStartingConversation}
                      className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChatBubbleLeftRightIcon className="w-5 h-5" />
                      <span>{isStartingConversation ? 'Starting...' : 'Send Message'}</span>
                    </button>
                    
                    <button
                      onClick={handleBlockUser}
                      className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                    >
                      <ShieldExclamationIcon className="w-5 h-5" />
                      <span>{isBlocked ? 'Unblock User' : 'Block User'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="px-6 py-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Profile Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Username
                  </label>
                  <p className="text-gray-900 dark:text-white">{profileUser.username}</p>
                </div>
                
                {profileUser.fullName && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Full Name
                    </label>
                    <p className="text-gray-900 dark:text-white">{profileUser.fullName}</p>
                  </div>
                )}
                
                {profileUser.displayName && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Display Name
                    </label>
                    <p className="text-gray-900 dark:text-white">{profileUser.displayName}</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Status
                  </label>
                  <p className="text-gray-900 dark:text-white">{getUserStatusText(profileUser)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
