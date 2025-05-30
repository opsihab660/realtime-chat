import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { BellIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const NotificationSettings = () => {
  const { user, updateProfile } = useAuth();
  const [settings, setSettings] = useState({
    sound: user?.notifications?.sound ?? true,
    desktop: user?.notifications?.desktop ?? true,
    email: user?.notifications?.email ?? false
  });
  const [isLoading, setIsLoading] = useState(false);

  // Sync settings with user data when user changes
  useEffect(() => {
    if (user?.notifications) {
      setSettings({
        sound: user.notifications.sound ?? true,
        desktop: user.notifications.desktop ?? true,
        email: user.notifications.email ?? false
      });
    }
  }, [user?.notifications]);

  const handleToggle = async (setting) => {
    const previousSettings = { ...settings };
    const newSettings = {
      ...settings,
      [setting]: !settings[setting]
    };

    setSettings(newSettings);
    setIsLoading(true);

    try {
      const result = await updateProfile({
        notifications: newSettings
      });

      if (result.success) {
        toast.success('Notification settings updated!');
      } else {
        // Revert if update failed
        setSettings(previousSettings);
      }
    } catch (error) {
      // Revert the change if it failed
      setSettings(previousSettings);
      toast.error('Failed to update notification settings');
    } finally {
      setIsLoading(false);
    }
  };

  const ToggleSwitch = ({ enabled, onChange, disabled }) => (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${enabled
          ? 'bg-blue-600'
          : 'bg-gray-200 dark:bg-gray-700'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out
          ${enabled ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  );

  return (
    <div className="max-w-2xl">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <BellIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Notification Settings
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manage how you receive notifications
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <div className="space-y-6">
            {/* Sound Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Sound Notifications
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Play sound when you receive new messages
                </p>
              </div>
              <ToggleSwitch
                enabled={settings.sound}
                onChange={() => handleToggle('sound')}
                disabled={isLoading}
              />
            </div>

            {/* Desktop Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Desktop Notifications
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Show desktop notifications for new messages
                </p>
              </div>
              <ToggleSwitch
                enabled={settings.desktop}
                onChange={() => handleToggle('desktop')}
                disabled={isLoading}
              />
            </div>

            {/* Email Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Email Notifications
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Receive email notifications for important updates
                </p>
              </div>
              <ToggleSwitch
                enabled={settings.email}
                onChange={() => handleToggle('email')}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start space-x-3">
              <BellIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  About Notifications
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                  Desktop notifications require browser permission. If you don't see notifications,
                  check your browser settings and allow notifications for this site.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
