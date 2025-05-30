import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  EyeIcon,
  EyeSlashIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  LockClosedIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/solid';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const { login, isLoading, isAuthenticated } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/chat';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleChange = (e) => {
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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const result = await login(formData.email, formData.password);

    if (result.success) {
      navigate(from, { replace: true });
    }
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <SunIcon className="w-5 h-5" />;
      case 'dark':
        return <MoonIcon className="w-5 h-5" />;
      default:
        return <ComputerDesktopIcon className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="max-w-md w-full space-y-6 relative z-10">
        {/* Header */}
        <div className="text-center animate-fade-in">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-purple-600 rounded-full blur-lg opacity-75 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-primary-600 to-purple-600 p-4 rounded-full shadow-2xl transform hover:scale-110 transition-transform duration-300">
                <ChatBubbleLeftRightIcon className="w-10 h-10 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3 animate-gradient">
            Welcome Back
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
            Sign in to your account to continue chatting with friends
          </p>
        </div>

        {/* Login Form */}
        <div className="relative">
          {/* Form Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-purple-500/10 rounded-3xl blur-xl"></div>

          <div className="relative bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl py-6 px-6 shadow-2xl rounded-2xl border border-white/20 dark:border-dark-700/50 animate-slide-up">
            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Email Field */}
              <div className="space-y-1">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email Address *
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className={`
                      block w-full pl-9 pr-3 py-2.5 border rounded-lg shadow-sm text-sm
                      placeholder-gray-500 text-gray-900 dark:text-white
                      bg-white dark:bg-dark-700 dark:border-dark-600
                      focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                      transition-all duration-200
                      ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'}
                    `}
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-600 flex items-center mt-1">
                    <span className="mr-1">⚠️</span>
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password *
                </label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className={`
                      block w-full pl-9 pr-9 py-2.5 border rounded-lg shadow-sm text-sm
                      placeholder-gray-500 text-gray-900 dark:text-white
                      bg-white dark:bg-dark-700 dark:border-dark-600
                      focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                      transition-all duration-200
                      ${errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'}
                    `}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <EyeIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-600 flex items-center mt-1">
                    <span className="mr-1">⚠️</span>
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="
                    group relative w-full flex justify-center items-center py-3 px-4
                    bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600
                    text-white font-medium rounded-lg shadow-lg hover:shadow-xl text-sm
                    transform hover:scale-105 transition-all duration-300
                    focus:outline-none focus:ring-2 focus:ring-primary-500/50
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                    overflow-hidden
                  "
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-700 via-purple-700 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" color="white" />
                      <span className="relative ml-2">Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span className="relative">Sign In</span>
                      <ArrowRightIcon className="relative w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Register Link */}
            <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-semibold text-primary-600 hover:text-primary-500 transition-colors duration-200 hover:underline"
                >
                  Sign up here
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Theme Toggle */}
        <div className="flex justify-center">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-purple-600 rounded-full blur-lg opacity-25 group-hover:opacity-50 transition-opacity duration-300"></div>
            <button
              onClick={toggleTheme}
              className="
                relative p-4 rounded-full bg-white/90 dark:bg-dark-800/90 backdrop-blur-sm shadow-2xl border border-white/20 dark:border-dark-700/50
                text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400
                transform hover:scale-110 hover:rotate-12 transition-all duration-300
                focus:outline-none focus:ring-4 focus:ring-primary-500/30
              "
              title={`Current theme: ${theme}`}
            >
              <div className="w-6 h-6">
                {getThemeIcon()}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
