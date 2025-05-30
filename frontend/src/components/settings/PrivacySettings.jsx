import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const PrivacySettings = () => {
  const { user, updateProfile } = useAuth();
  const [settings, setSettings] = useState({
    showOnlineStatus: user?.privacy?.showOnlineStatus ?? true,
    showLastSeen: user?.privacy?.showLastSeen ?? true,
    allowDirectMessages: user?.privacy?.allowDirectMessages ?? true
  });
  const [isLoading, setIsLoading] = useState(false);

  // Sync settings with user data when user changes
  useEffect(() => {
    if (user?.privacy) {
      setSettings({
        showOnlineStatus: user.privacy.showOnlineStatus ?? true,
        showLastSeen: user.privacy.showLastSeen ?? true,
        allowDirectMessages: user.privacy.allowDirectMessages ?? true
      });
    }
  }, [user?.privacy]);

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
        privacy: newSettings
      });

      if (result.success) {
        toast.success('Privacy settings updated!');
      } else {
        // Revert if update failed
        setSettings(previousSettings);
      }
    } catch (error) {
      // Revert the change if it failed
      setSettings(previousSettings);
      toast.error('Failed to update privacy settings');
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
              <ShieldCheckIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Privacy Settings
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Control your privacy and visibility
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <div className="space-y-6">
            {/* Show Online Status */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Show Online Status
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Let others see when you're online
                </p>
              </div>
              <ToggleSwitch
                enabled={settings.showOnlineStatus}
                onChange={() => handleToggle('showOnlineStatus')}
                disabled={isLoading}
              />
            </div>

            {/* Show Last Seen */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Show Last Seen
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Let others see when you were last active
                </p>
              </div>
              <ToggleSwitch
                enabled={settings.showLastSeen}
                onChange={() => handleToggle('showLastSeen')}
                disabled={isLoading}
              />
            </div>

            {/* Allow Direct Messages */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Allow Direct Messages
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Allow other users to send you direct messages
                </p>
              </div>
              <ToggleSwitch
                enabled={settings.allowDirectMessages}
                onChange={() => handleToggle('allowDirectMessages')}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Privacy Info */}
          <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex items-start space-x-3">
              <ShieldCheckIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  Privacy Notice
                </h4>
                <p className="text-sm text-amber-700 dark:text-amber-200 mt-1">
                  These settings control how your information is visible to other users.
                  Disabling "Allow Direct Messages" will prevent new conversations but won't affect existing ones.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacySettings;
