import React from 'react';

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'primary', 
  className = '',
  text = null 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    primary: 'text-primary-600',
    white: 'text-white',
    gray: 'text-gray-600',
    success: 'text-green-600',
    error: 'text-red-600'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative">
        <div
          className={`
            ${sizeClasses[size]} 
            ${colorClasses[color]}
            animate-spin
          `}
        >
          <svg
            className="w-full h-full"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      </div>
      
      {text && (
        <p className={`mt-2 text-sm ${colorClasses[color]} animate-pulse`}>
          {text}
        </p>
      )}
    </div>
  );
};

// Preset loading components
export const PageLoader = ({ text = 'Loading...' }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900">
    <LoadingSpinner size="xl" text={text} />
  </div>
);

export const ButtonLoader = ({ size = 'sm' }) => (
  <LoadingSpinner size={size} color="white" />
);

export const InlineLoader = ({ text = 'Loading...' }) => (
  <div className="flex items-center justify-center py-4">
    <LoadingSpinner size="md" text={text} />
  </div>
);

export const MessageLoader = () => (
  <div className="flex items-center justify-center py-8">
    <div className="flex space-x-2">
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
    </div>
  </div>
);

export default LoadingSpinner;
