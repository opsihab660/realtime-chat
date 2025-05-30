import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  EyeIcon,
  EyeSlashIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  LockClosedIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/solid';

const Register = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    displayName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    gender: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [completedSteps, setCompletedSteps] = useState([]);

  const { register, isLoading, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Step configuration
  const steps = [
    {
      id: 1,
      title: 'Personal Info',
      description: 'Tell us about yourself',
      icon: UserIcon,
      fields: ['fullName', 'displayName']
    },
    {
      id: 2,
      title: 'Account Details',
      description: 'Create your account',
      icon: EnvelopeIcon,
      fields: ['username', 'email']
    },
    {
      id: 3,
      title: 'Additional Info',
      description: 'A bit more about you',
      icon: CalendarDaysIcon,
      fields: ['dateOfBirth', 'gender']
    },
    {
      id: 4,
      title: 'Security',
      description: 'Secure your account',
      icon: LockClosedIcon,
      fields: ['password', 'confirmPassword']
    }
  ];

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/chat', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Navigation functions
  const nextStep = () => {
    if (validateCurrentStep()) {
      setCompletedSteps(prev => [...prev, currentStep]);
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const goToStep = (stepNumber) => {
    if (stepNumber <= currentStep || completedSteps.includes(stepNumber - 1)) {
      setCurrentStep(stepNumber);
    }
  };

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

  // Validate current step
  const validateCurrentStep = () => {
    const currentStepConfig = steps.find(step => step.id === currentStep);
    const newErrors = {};

    currentStepConfig.fields.forEach(field => {
      switch (field) {
        case 'fullName':
          if (!formData.fullName) {
            newErrors.fullName = 'Full name is required';
          } else if (formData.fullName.length < 2) {
            newErrors.fullName = 'Full name must be at least 2 characters';
          } else if (formData.fullName.length > 50) {
            newErrors.fullName = 'Full name must be less than 50 characters';
          } else if (!/^[a-zA-Z\s\u0980-\u09FF]+$/.test(formData.fullName)) {
            newErrors.fullName = 'Full name can only contain letters and spaces';
          }
          break;

        case 'displayName':
          if (!formData.displayName) {
            newErrors.displayName = 'Display name is required';
          } else if (formData.displayName.length < 2) {
            newErrors.displayName = 'Display name must be at least 2 characters';
          } else if (formData.displayName.length > 30) {
            newErrors.displayName = 'Display name must be less than 30 characters';
          } else if (!/^[a-zA-Z0-9\s\u0980-\u09FF_-]+$/.test(formData.displayName)) {
            newErrors.displayName = 'Display name can only contain letters, numbers, spaces, underscores, and hyphens';
          }
          break;

        case 'username':
          if (!formData.username) {
            newErrors.username = 'Username is required';
          } else if (formData.username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
          } else if (formData.username.length > 20) {
            newErrors.username = 'Username must be less than 20 characters';
          } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
            newErrors.username = 'Username can only contain letters, numbers, and underscores';
          }
          break;

        case 'email':
          if (!formData.email) {
            newErrors.email = 'Email is required';
          } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
          }
          break;

        case 'dateOfBirth':
          if (!formData.dateOfBirth) {
            newErrors.dateOfBirth = 'Date of birth is required';
          } else {
            const today = new Date();
            const birthDate = new Date(formData.dateOfBirth);
            const age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();

            let calculatedAge = age;
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
              calculatedAge--;
            }

            if (calculatedAge < 13) {
              newErrors.dateOfBirth = 'You must be at least 13 years old to register';
            } else if (calculatedAge > 120) {
              newErrors.dateOfBirth = 'Please enter a valid date of birth';
            }
          }
          break;

        case 'gender':
          if (!formData.gender) {
            newErrors.gender = 'Please select your gender';
          }
          break;

        case 'password':
          if (!formData.password) {
            newErrors.password = 'Password is required';
          } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
          } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
            newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
          }
          break;

        case 'confirmPassword':
          if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
          } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
          }
          break;

        default:
          break;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate entire form
  const validateForm = () => {
    return validateCurrentStep();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const { confirmPassword, ...userData } = formData;
    const result = await register(userData);

    if (result.success) {
      navigate('/chat', { replace: true });
    }
  };

  // Render step indicator
  const renderStepIndicator = () => (
    <div className="mb-6">
      <div className="flex items-center justify-between relative">
        {/* Progress Line Background */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 transform -translate-y-1/2 z-0"></div>

        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = completedSteps.includes(step.id);
          const isAccessible = step.id <= currentStep || completedSteps.includes(step.id - 1);

          return (
            <div key={step.id} className="flex flex-col items-center relative z-10">
              <button
                onClick={() => goToStep(step.id)}
                disabled={!isAccessible}
                className={`
                  relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 transform
                  ${isActive
                    ? 'border-primary-600 bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-lg scale-105'
                    : isCompleted
                      ? 'border-green-500 bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md hover:scale-105'
                      : isAccessible
                        ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-700 text-gray-500 dark:text-gray-400 hover:border-primary-400 hover:scale-105 shadow-sm'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                  }
                `}
              >
                {isCompleted ? (
                  <CheckIcon className="w-5 h-5" />
                ) : (
                  <step.icon className="w-5 h-5" />
                )}
              </button>

              {/* Step Label */}
              <div className="mt-2 text-center">
                <p className={`text-xs font-medium transition-colors duration-300 ${
                  isActive ? 'text-primary-600 dark:text-primary-400' :
                  isCompleted ? 'text-green-600 dark:text-green-400' :
                  'text-gray-500 dark:text-gray-400'
                }`}>
                  {step.title}
                </p>
              </div>

              {/* Progress Line */}
              {index < steps.length - 1 && (
                <div className={`
                  absolute top-5 left-10 w-full h-0.5 transition-all duration-500
                  ${isCompleted ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-transparent'}
                `} style={{ width: 'calc(100% + 2.5rem)' }} />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-5 text-center">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          {steps[currentStep - 1].title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {steps[currentStep - 1].description}
        </p>
      </div>
    </div>
  );

  // Render form fields based on current step
  const renderStepFields = () => {
    const currentStepConfig = steps[currentStep - 1];

    return (
      <div className="space-y-4">
        {currentStepConfig.fields.map(field => {
          switch (field) {
            case 'fullName':
              return (
                <div key={field} className="space-y-1">
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Full Name *
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      required
                      value={formData.fullName}
                      onChange={handleChange}
                      className={`
                        block w-full pl-9 pr-3 py-2.5 border rounded-lg shadow-sm text-sm
                        placeholder-gray-500 text-gray-900 dark:text-white
                        bg-white dark:bg-dark-700 dark:border-dark-600
                        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                        transition-all duration-200
                        ${errors.fullName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'}
                      `}
                      placeholder="Enter your full name"
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-xs text-red-600 flex items-center mt-1">
                      <span className="mr-1">⚠️</span>
                      {errors.fullName}
                    </p>
                  )}
                </div>
              );

            case 'displayName':
              return (
                <div key={field} className="space-y-1">
                  <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Display Name *
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="displayName"
                      name="displayName"
                      type="text"
                      required
                      value={formData.displayName}
                      onChange={handleChange}
                      className={`
                        block w-full pl-9 pr-3 py-2.5 border rounded-lg shadow-sm text-sm
                        placeholder-gray-500 text-gray-900 dark:text-white
                        bg-white dark:bg-dark-700 dark:border-dark-600
                        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                        transition-all duration-200
                        ${errors.displayName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'}
                      `}
                      placeholder="Name shown in chats"
                    />
                  </div>
                  {errors.displayName && (
                    <p className="text-xs text-red-600 flex items-center mt-1">
                      <span className="mr-1">⚠️</span>
                      {errors.displayName}
                    </p>
                  )}
                </div>
              );

            case 'username':
              return (
                <div key={field} className="space-y-1">
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Username *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">@</span>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      required
                      value={formData.username}
                      onChange={handleChange}
                      className={`
                        block w-full pl-7 pr-3 py-2.5 border rounded-lg shadow-sm text-sm
                        placeholder-gray-500 text-gray-900 dark:text-white
                        bg-white dark:bg-dark-700 dark:border-dark-600
                        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                        transition-all duration-200
                        ${errors.username ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'}
                      `}
                      placeholder="Choose a unique username"
                    />
                  </div>
                  {errors.username && (
                    <p className="text-xs text-red-600 flex items-center mt-1">
                      <span className="mr-1">⚠️</span>
                      {errors.username}
                    </p>
                  )}
                </div>
              );

            case 'email':
              return (
                <div key={field} className="space-y-1">
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
              );

            case 'dateOfBirth':
              return (
                <div key={field} className="space-y-1">
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Date of Birth *
                  </label>
                  <div className="relative">
                    <CalendarDaysIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      required
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      max={new Date(new Date().setFullYear(new Date().getFullYear() - 13)).toISOString().split('T')[0]}
                      className={`
                        block w-full pl-9 pr-3 py-2.5 border rounded-lg shadow-sm text-sm
                        text-gray-900 dark:text-white
                        bg-white dark:bg-dark-700 dark:border-dark-600
                        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                        transition-all duration-200
                        ${errors.dateOfBirth ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'}
                      `}
                    />
                  </div>
                  {errors.dateOfBirth && (
                    <p className="text-xs text-red-600 flex items-center mt-1">
                      <span className="mr-1">⚠️</span>
                      {errors.dateOfBirth}
                    </p>
                  )}
                </div>
              );

            case 'gender':
              return (
                <div key={field} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Gender *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'male', label: 'Male', emoji: '👨' },
                      { value: 'female', label: 'Female', emoji: '👩' },
                      { value: 'other', label: 'Other', emoji: '🧑' },
                      { value: 'prefer-not-to-say', label: 'Prefer not to say', emoji: '🤐' }
                    ].map(option => (
                      <label key={option.value} className="flex items-center p-2.5 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-600 transition-colors duration-200">
                        <input
                          type="radio"
                          name="gender"
                          value={option.value}
                          checked={formData.gender === option.value}
                          onChange={handleChange}
                          className="h-3.5 w-3.5 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600"
                        />
                        <span className="ml-2.5 flex items-center">
                          <span className="mr-1.5 text-sm">{option.emoji}</span>
                          <span className="text-xs text-gray-700 dark:text-gray-300">{option.label}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors.gender && (
                    <p className="text-xs text-red-600 flex items-center mt-1">
                      <span className="mr-1">⚠️</span>
                      {errors.gender}
                    </p>
                  )}
                </div>
              );

            case 'password':
              return (
                <div key={field} className="space-y-1">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password *
                  </label>
                  <div className="relative">
                    <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
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
                      placeholder="Create a strong password"
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
              );

            case 'confirmPassword':
              return (
                <div key={field} className="space-y-1">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`
                        block w-full pl-9 pr-9 py-2.5 border rounded-lg shadow-sm text-sm
                        placeholder-gray-500 text-gray-900 dark:text-white
                        bg-white dark:bg-dark-700 dark:border-dark-600
                        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                        transition-all duration-200
                        ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'}
                      `}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <EyeIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-600 flex items-center mt-1">
                      <span className="mr-1">⚠️</span>
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              );

            default:
              return null;
          }
        })}
      </div>
    );
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

      <div className="max-w-lg w-full space-y-8 relative z-10">
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
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4 animate-gradient">
            Create Account
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
            Join our community and start chatting with friends around the world
          </p>
        </div>

        {/* Register Form */}
        <div className="relative">
          {/* Form Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-purple-500/10 rounded-3xl blur-xl"></div>

          <div className="relative bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl py-6 px-6 shadow-2xl rounded-2xl border border-white/20 dark:border-dark-700/50 animate-slide-up">
            {/* Step Indicator */}
            {renderStepIndicator()}

            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Form Fields */}
              <div className="min-h-[220px] transition-all duration-500 ease-in-out">
                {renderStepFields()}
              </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-5 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`
                  group flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 transform
                  ${currentStep === 1
                    ? 'text-gray-400 cursor-not-allowed opacity-50'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-600 hover:scale-105 border border-gray-200 dark:border-gray-600'
                  }
                `}
              >
                <ArrowLeftIcon className={`w-4 h-4 mr-1.5 transition-transform duration-300 ${currentStep === 1 ? '' : 'group-hover:-translate-x-1'}`} />
                Previous
              </button>

              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  {steps.map((_, index) => (
                    <div
                      key={index}
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                        index + 1 === currentStep
                          ? 'bg-gradient-to-r from-primary-600 to-purple-600 w-4'
                          : index + 1 < currentStep
                            ? 'bg-green-500'
                            : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {currentStep} of {steps.length}
                </span>
              </div>

              {currentStep < steps.length ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="
                    group relative flex items-center px-6 py-2.5 bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600
                    text-white font-medium rounded-lg shadow-lg hover:shadow-xl text-sm
                    transform hover:scale-105 transition-all duration-300
                    focus:outline-none focus:ring-2 focus:ring-primary-500/50
                    overflow-hidden
                  "
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-700 via-purple-700 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative">Next</span>
                  <ArrowRightIcon className="relative w-4 h-4 ml-1.5 transition-transform duration-300 group-hover:translate-x-1" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="
                    group relative flex items-center px-6 py-2.5 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600
                    text-white font-medium rounded-lg shadow-lg hover:shadow-xl text-sm
                    transform hover:scale-105 transition-all duration-300
                    focus:outline-none focus:ring-2 focus:ring-green-500/50
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                    overflow-hidden
                  "
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-700 via-emerald-700 to-teal-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" color="white" />
                      <span className="relative ml-2">Creating...</span>
                    </>
                  ) : (
                    <>
                      <CheckIcon className="relative w-4 h-4 mr-1.5" />
                      <span className="relative">Create Account</span>
                    </>
                  )}
                </button>
              )}
            </div>

          </form>

          {/* Login Link */}
          <div className="text-center pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-base text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-primary-600 hover:text-primary-500 transition-colors duration-200 hover:underline"
              >
                Sign in here
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

export default Register;
