import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { usersAPI } from '../services/api';
import { useChat } from '../hooks';
import toast from 'react-hot-toast';
import {
  XMarkIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  ShieldExclamationIcon,
  ClockIcon,
  CheckCircleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const UserProfileModal = ({ userId, isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { allUsers } = useSocket();
  const { startConversation } = useChat();
  
  const [profileUser, setProfileUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
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

  // Load user profile when modal opens
  useEffect(() => {
    if (!isOpen || !userId) {
      setProfileUser(null);
      setError(null);
      return;
    }

    const loadUserProfile = async () => {
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
  }, [userId, isOpen]);

  // Handle start conversation
  const handleStartConversation = async () => {
    if (!profileUser) return;
    
    setIsStartingConversation(true);
    try {
      const conversation = await startConversation(profileUser._id);
      if (conversation) {
        toast.success(`Started conversation with ${profileUser.username}`);
        onClose();
        navigate('/chat');
      }
    } catch (error) {
      toast.error('Failed to start conversation');
    } finally {
      setIsStartingConversation(false);
    }
  };

  // Handle view full profile
  const handleViewFullProfile = () => {
    onClose();
    navigate(`/profile/${userId}`);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              User Profile
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">Loading profile...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <ShieldExclamationIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          ) : profileUser ? (
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold text-2xl">
                      {profileUser.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {/* Online Status */}
                  <div className={`absolute -bottom-1 -right-1 w-5 h-5 border-2 border-white dark:border-gray-800 rounded-full ${
                    isUserOnline(profileUser._id) ? 'bg-green-500' : 'bg-gray-400 dark:bg-gray-600'
                  }`}></div>
                </div>

                <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {profileUser.displayName || profileUser.username}
                </h4>
                <p className="text-gray-500 dark:text-gray-400 mb-2">
                  @{profileUser.username}
                </p>

                {/* Status */}
                <div className="flex items-center justify-center space-x-2 mb-4">
                  {isUserOnline(profileUser._id) ? (
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  ) : (
                    <ClockIcon className="w-4 h-4 text-gray-400" />
                  )}
                  <span className={`text-sm ${
                    isUserOnline(profileUser._id) 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {getUserStatusText(profileUser)}
                  </span>
                </div>

                {/* Bio */}
                {profileUser.bio && (
                  <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 px-2">
                    {profileUser.bio}
                  </p>
                )}
              </div>

              {/* Profile Details */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Username
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">{profileUser.username}</p>
                </div>
                
                {profileUser.fullName && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Full Name
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">{profileUser.fullName}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={handleStartConversation}
                  disabled={isStartingConversation}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChatBubbleLeftRightIcon className="w-4 h-4" />
                  <span>{isStartingConversation ? 'Starting...' : 'Send Message'}</span>
                </button>

                <button
                  onClick={handleViewFullProfile}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  <EyeIcon className="w-4 h-4" />
                  <span>View Full Profile</span>
                </button>

                <button
                  onClick={handleBlockUser}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                >
                  <ShieldExclamationIcon className="w-4 h-4" />
                  <span>{isBlocked ? 'Unblock User' : 'Block User'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">User not found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
