import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ProfileSettings from '../components/settings/ProfileSettings';
import NotificationSettings from '../components/settings/NotificationSettings';
import PrivacySettings from '../components/settings/PrivacySettings';
import ThemeSettings from '../components/settings/ThemeSettings';
import PasswordSettings from '../components/settings/PasswordSettings';
import {
  ArrowLeftIcon,
  UserIcon,
  BellIcon,
  ShieldCheckIcon,
  PaintBrushIcon,
  KeyIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

const Settings = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const tabs = [
    {
      id: 'profile',
      name: 'Profile',
      icon: UserIcon,
      component: ProfileSettings
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: BellIcon,
      component: NotificationSettings
    },
    {
      id: 'privacy',
      name: 'Privacy',
      icon: ShieldCheckIcon,
      component: PrivacySettings
    },
    {
      id: 'theme',
      name: 'Theme',
      icon: PaintBrushIcon,
      component: ThemeSettings
    },
    {
      id: 'password',
      name: 'Password',
      icon: KeyIcon,
      component: PasswordSettings
    }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/chat')}
                  className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Cog6ToothIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Settings
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Manage your account preferences
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.username}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Sidebar */}
          <div className="w-full lg:w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
            <nav className="p-4 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors duration-200
                      ${isActive
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`} />
                    <span className="font-medium">{tab.name}</span>
                  </button>
                );
              })}

              {/* Logout Button */}
              <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors duration-200 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-h-screen">
            <div className="p-4 sm:p-6 lg:p-8">
              {ActiveComponent && <ActiveComponent />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
