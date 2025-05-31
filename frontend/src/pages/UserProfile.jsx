import {
    ArrowLeftIcon,
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
import { useNavigate, useParams } from 'react-router-dom';
import UserAvatar from '../components/UserAvatar';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useChat } from '../hooks';
import { usersAPI } from '../services/api';

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

  // Get full avatar URL
  const getAvatarUrl = (user) => {
    if (!user?.avatar) return null;
    return user.avatar.startsWith('http') 
      ? user.avatar 
      : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${user.avatar}`;
  };

  // Handle view full avatar image
  const handleViewFullImage = () => {
    if (profileUser?.avatar) {
      setShowFullImage(true);
    }
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
        setImageError(false);
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
                {/* Enhanced Avatar */}
                <div 
                  className="relative cursor-pointer"
                  onClick={handleViewFullImage}
                >
                  <div className="border-4 border-blue-100 dark:border-blue-900 rounded-full p-1 shadow-lg hover:shadow-xl transition-all duration-300">
                    <UserAvatar 
                      user={profileUser}
                      size="2xl"
                      showStatus={true}
                      isOnline={isUserOnline(profileUser._id)}
                    />
                    {profileUser.avatar && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-20 rounded-full transition-all duration-300">
                        <EyeIcon className="w-8 h-8 text-white opacity-0 hover:opacity-100 transition-opacity" />
                      </div>
                    )}
                  </div>
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

export default UserProfile;
