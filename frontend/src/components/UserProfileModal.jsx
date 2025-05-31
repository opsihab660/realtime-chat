import {
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  ShieldExclamationIcon,
  UserIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useChat } from '../hooks';
import { usersAPI } from '../services/api';
import UserAvatar from './UserAvatar';

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
  const [showFullImage, setShowFullImage] = useState(false);
  const [imageError, setImageError] = useState(false);

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
        setImageError(false);
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

  // Handle view full avatar image
  const handleViewFullImage = () => {
    if (profileUser?.avatar) {
      setShowFullImage(true);
    }
  };

  // Get full avatar URL
  const getAvatarUrl = (user) => {
    if (!user?.avatar) return null;
    return user.avatar.startsWith('http') 
      ? user.avatar 
      : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${user.avatar}`;
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
              {/* Profile Header with Enhanced Avatar */}
              <div className="text-center">
                <div 
                  className="relative inline-block cursor-pointer"
                  onClick={handleViewFullImage}
                >
                  <div className="border-4 border-blue-100 dark:border-blue-900 rounded-full p-1 shadow-lg hover:shadow-xl transition-all duration-300">
                    <UserAvatar 
                      user={profileUser}
                      size="2xl"
                      showStatus={true}
                      isOnline={isUserOnline(profileUser._id)}
                      className="mx-auto"
                    />
                    {profileUser.avatar && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-20 rounded-full transition-all duration-300">
                        <EyeIcon className="w-8 h-8 text-white opacity-0 hover:opacity-100 transition-opacity" />
                      </div>
                    )}
                  </div>
                </div>

                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mt-4">
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

      {/* Full Image Preview Modal */}
      {showFullImage && profileUser?.avatar && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
          onClick={() => setShowFullImage(false)}
        >
          <div className="relative max-w-2xl max-h-full">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowFullImage(false);
              }}
              className="absolute -top-12 right-0 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            <img
              src={getAvatarUrl(profileUser)}
              alt={`${profileUser.username}'s avatar`}
              className="max-w-full max-h-[90vh] object-contain rounded-lg border-4 border-white"
              onClick={(e) => e.stopPropagation()}
              onError={() => setImageError(true)}
            />
            {imageError && (
              <div className="text-center bg-red-900 bg-opacity-80 text-white p-4 rounded-lg mt-4">
                Failed to load full-size image
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileModal;
