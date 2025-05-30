import { useState } from 'react';
import { KeyIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

const PasswordSettings = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters long';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await authAPI.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      toast.success('Password changed successfully!');
      
      // Reset form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswords({
        current: false,
        new: false,
        confirm: false
      });
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to change password';
      toast.error(errorMessage);
      
      if (error.response?.status === 401) {
        setErrors({ currentPassword: 'Current password is incorrect' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const PasswordInput = ({ name, label, placeholder, value, showPassword, onToggleVisibility, error }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={handleInputChange}
          className={`w-full px-3 py-2 pr-10 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
            error 
              ? 'border-red-300 dark:border-red-600' 
              : 'border-gray-300 dark:border-gray-600'
          }`}
          placeholder={placeholder}
          autoComplete={name === 'currentPassword' ? 'current-password' : 'new-password'}
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          {showPassword ? (
            <EyeSlashIcon className="w-5 h-5" />
          ) : (
            <EyeIcon className="w-5 h-5" />
          )}
        </button>
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
      )}
    </div>
  );

  return (
    <div className="max-w-2xl">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <KeyIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Change Password
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Update your password to keep your account secure
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Password */}
            <PasswordInput
              name="currentPassword"
              label="Current Password"
              placeholder="Enter your current password"
              value={formData.currentPassword}
              showPassword={showPasswords.current}
              onToggleVisibility={() => togglePasswordVisibility('current')}
              error={errors.currentPassword}
            />

            {/* New Password */}
            <PasswordInput
              name="newPassword"
              label="New Password"
              placeholder="Enter your new password"
              value={formData.newPassword}
              showPassword={showPasswords.new}
              onToggleVisibility={() => togglePasswordVisibility('new')}
              error={errors.newPassword}
            />

            {/* Confirm Password */}
            <PasswordInput
              name="confirmPassword"
              label="Confirm New Password"
              placeholder="Confirm your new password"
              value={formData.confirmPassword}
              showPassword={showPasswords.confirm}
              onToggleVisibility={() => togglePasswordVisibility('confirm')}
              error={errors.confirmPassword}
            />

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
                className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Changing Password...' : 'Change Password'}
              </button>
            </div>
          </form>

          {/* Security Tips */}
          <div className="mt-8 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-start space-x-3">
              <KeyIcon className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-green-900 dark:text-green-100">
                  Password Security Tips
                </h4>
                <ul className="text-sm text-green-700 dark:text-green-200 mt-1 space-y-1">
                  <li>• Use at least 8 characters with a mix of letters, numbers, and symbols</li>
                  <li>• Avoid using personal information or common words</li>
                  <li>• Don't reuse passwords from other accounts</li>
                  <li>• Consider using a password manager</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordSettings;
