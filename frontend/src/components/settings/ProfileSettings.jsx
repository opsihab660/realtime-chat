import { CameraIcon, PencilIcon, UserIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import AvatarUpload from '../AvatarUpload';

const ProfileSettings = () => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    bio: user?.bio || '',
    fullName: user?.fullName || '',
    displayName: user?.displayName || ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // Sync form data with user data when user changes
  useEffect(() => {
    if (user) {
      console.log('🔄 ProfileSettings: User data changed, updating form data:', user);
      setFormData({
        username: user.username || '',
        bio: user.bio || '',
        fullName: user.fullName || '',
        displayName: user.displayName || ''
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    console.log('📝 ProfileSettings: Submitting form data:', formData);

    try {
      const result = await updateProfile(formData);
      console.log('✅ ProfileSettings: Update result:', result);
      if (result.success) {
        setIsEditing(false);
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      console.error('❌ ProfileSettings: Update error:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to current user data
    if (user) {
      setFormData({
        username: user.username || '',
        bio: user.bio || '',
        fullName: user.fullName || '',
        displayName: user.displayName || ''
      });
    }
    setIsEditing(false);
  };

  const openAvatarUpload = () => {
    setShowAvatarUpload(true);
  };

  const closeAvatarUpload = () => {
    setShowAvatarUpload(false);
  };

  // Function to render avatar or placeholder
  const renderAvatar = () => {
    if (user?.avatar) {
      // Ensure the avatar URL has the full base URL if it's a relative path
      const avatarUrl = user.avatar.startsWith('http') 
        ? user.avatar 
        : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${user.avatar}`;
      
      return (
        <div className="relative">
          <img 
            src={avatarUrl} 
            alt={user.displayName || user.username} 
            className="w-24 h-24 rounded-full object-cover"
            onError={(e) => {
              console.error('Failed to load avatar:', e);
              e.target.onerror = null;
              // Fallback to initials if image fails to load
              e.target.style.display = 'none';
              // Show fallback initial
              e.target.parentNode.classList.add('bg-blue-600');
              e.target.parentNode.classList.add('flex');
              e.target.parentNode.classList.add('items-center');
              e.target.parentNode.classList.add('justify-center');
              // Add initial letter
              const initialSpan = document.createElement('span');
              initialSpan.className = 'text-white font-semibold text-xl';
              initialSpan.textContent = user?.username?.charAt(0).toUpperCase();
              e.target.parentNode.appendChild(initialSpan);
            }}
          />
          <button 
            onClick={openAvatarUpload}
            className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full shadow-md hover:bg-blue-700 transition-colors"
          >
            <CameraIcon className="w-4 h-4" />
          </button>
        </div>
      );
    }

    return (
      <div className="relative">
        <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white font-semibold text-xl">
            {user?.username?.charAt(0).toUpperCase()}
          </span>
        </div>
        <button 
          onClick={openAvatarUpload}
          className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full shadow-md hover:bg-blue-700 transition-colors"
        >
          <CameraIcon className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-2xl">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <UserIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Profile Information
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Update your personal information and bio
                </p>
              </div>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
              >
                <PencilIcon className="w-4 h-4" />
                <span>Edit</span>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center space-x-4 mb-6">
                {renderAvatar()}
                <div>
                  <h3 className="text-base font-medium text-gray-900 dark:text-white">
                    Profile Picture
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Click the camera icon to update your profile picture
                  </p>
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your username"
                  required
                  minLength={3}
                  maxLength={20}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  3-20 characters, letters, numbers, and underscores only
                </p>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your full name"
                  maxLength={50}
                />
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your display name"
                  maxLength={30}
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Tell others about yourself..."
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formData.bio.length}/200 characters
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Profile Display */}
              <div className="flex items-center space-x-4">
                {renderAvatar()}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {user?.displayName || user?.username}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    @{user?.username}
                  </p>
                  {user?.bio && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                      {user.bio}
                    </p>
                  )}
                </div>
              </div>

              {/* Profile Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Username
                  </label>
                  <p className="text-gray-900 dark:text-white">{user?.username}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Email
                  </label>
                  <p className="text-gray-900 dark:text-white">{user?.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Full Name
                  </label>
                  <p className="text-gray-900 dark:text-white">{user?.fullName || 'Not set'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Display Name
                  </label>
                  <p className="text-gray-900 dark:text-white">{user?.displayName || 'Not set'}</p>
                </div>
              </div>

              {user?.bio && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Bio
                  </label>
                  <p className="text-gray-900 dark:text-white whitespace-pre-line">{user.bio}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Avatar Upload Component */}
      <AvatarUpload 
        isVisible={showAvatarUpload} 
        onClose={closeAvatarUpload} 
      />
    </div>
  );
};

export default ProfileSettings;
