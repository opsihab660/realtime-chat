import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { PaintBrushIcon, SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ThemeSettings = () => {
  const { user, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const themes = [
    {
      id: 'light',
      name: 'Light',
      description: 'Clean and bright interface',
      icon: SunIcon,
      preview: 'bg-white border-gray-200'
    },
    {
      id: 'dark',
      name: 'Dark',
      description: 'Easy on the eyes in low light',
      icon: MoonIcon,
      preview: 'bg-gray-900 border-gray-700'
    },
    {
      id: 'system',
      name: 'System',
      description: 'Follows your device settings',
      icon: ComputerDesktopIcon,
      preview: 'bg-gradient-to-r from-white to-gray-900 border-gray-400'
    }
  ];

  const handleThemeChange = async (newTheme) => {
    setIsLoading(true);

    try {
      // Update theme in context immediately for better UX
      setTheme(newTheme);
      
      // Update in backend
      const result = await updateProfile({
        theme: newTheme
      });
      
      if (result.success) {
        toast.success(`Theme changed to ${newTheme}!`);
      }
    } catch (error) {
      // Revert theme if backend update failed
      setTheme(user?.theme || 'system');
      toast.error('Failed to update theme');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <PaintBrushIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Theme Settings
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Choose your preferred appearance
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <div className="space-y-4">
            {themes.map((themeOption) => {
              const Icon = themeOption.icon;
              const isSelected = theme === themeOption.id;
              
              return (
                <button
                  key={themeOption.id}
                  onClick={() => handleThemeChange(themeOption.id)}
                  disabled={isLoading}
                  className={`
                    w-full p-4 rounded-lg border-2 transition-all duration-200 text-left
                    ${isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <div className="flex items-center space-x-4">
                    {/* Theme Preview */}
                    <div className={`w-12 h-12 rounded-lg border-2 ${themeOption.preview} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${
                        themeOption.id === 'light' ? 'text-gray-600' :
                        themeOption.id === 'dark' ? 'text-gray-300' :
                        'text-gray-500'
                      }`} />
                    </div>
                    
                    {/* Theme Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className={`font-medium ${
                          isSelected 
                            ? 'text-blue-700 dark:text-blue-300' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {themeOption.name}
                        </h3>
                        {isSelected && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <p className={`text-sm ${
                        isSelected 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {themeOption.description}
                      </p>
                    </div>

                    {/* Selection Indicator */}
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {isSelected && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Theme Info */}
          <div className="mt-8 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-start space-x-3">
              <PaintBrushIcon className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-purple-900 dark:text-purple-100">
                  About Themes
                </h4>
                <p className="text-sm text-purple-700 dark:text-purple-200 mt-1">
                  The System theme automatically switches between light and dark modes based on your device's settings. 
                  Your theme preference is saved and will be applied across all your devices.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeSettings;
