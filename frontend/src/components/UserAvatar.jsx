import { useState } from 'react';

const UserAvatar = ({ user, size = 'md', className = '', showStatus = false, isOnline = false }) => {
  const [imageError, setImageError] = useState(false);
  
  // Determine size class
  const sizeClasses = {
    'xs': 'w-6 h-6 text-xs',
    'sm': 'w-8 h-8 text-sm',
    'md': 'w-10 h-10 text-base',
    'lg': 'w-12 h-12 text-lg',
    'xl': 'w-16 h-16 text-xl',
    '2xl': 'w-24 h-24 text-2xl'
  };
  
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  
  // Handle avatar URL
  const avatarUrl = user?.avatar && !imageError ? 
    (user.avatar.startsWith('http') 
      ? user.avatar 
      : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${user.avatar}`) 
    : null;
  
  // Get user's initial
  const initial = user?.username?.charAt(0).toUpperCase() || 'U';
  
  // Get a consistent color based on username
  const getColorClass = () => {
    if (!user?.username) return 'bg-blue-600';
    
    const colors = [
      'bg-blue-600',
      'bg-green-600',
      'bg-purple-600',
      'bg-pink-600',
      'bg-indigo-600',
      'bg-red-600',
      'bg-yellow-600',
      'bg-teal-600'
    ];
    
    const charCodeSum = user.username.split('')
      .reduce((sum, char) => sum + char.charCodeAt(0), 0);
    
    return colors[charCodeSum % colors.length];
  };
  
  return (
    <div className={`relative ${className}`}>
      <div className={`${sizeClass} ${!avatarUrl ? getColorClass() : ''} rounded-full flex items-center justify-center overflow-hidden`}>
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt={user?.username || 'User'} 
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span className="text-white font-medium">
            {initial}
          </span>
        )}
      </div>
      
      {showStatus && (
        <div 
          className={`absolute -bottom-1 -right-1 w-3 h-3 md:w-4 md:h-4 border-2 border-white dark:border-gray-800 rounded-full ${
            isOnline ? 'bg-green-500' : 'bg-gray-400 dark:bg-gray-600'
          }`}
        ></div>
      )}
    </div>
  );
};

export default UserAvatar; 