import React, { createContext, useContext, useEffect, useReducer } from 'react';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  isLoading: true,
  error: null
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  LOGOUT: 'LOGOUT',
  LOAD_USER_START: 'LOAD_USER_START',
  LOAD_USER_SUCCESS: 'LOAD_USER_SUCCESS',
  LOAD_USER_FAILURE: 'LOAD_USER_FAILURE',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  UPDATE_USER: 'UPDATE_USER',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
    case AUTH_ACTIONS.LOAD_USER_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      localStorage.setItem('token', action.payload.token);
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };

    case AUTH_ACTIONS.LOAD_USER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
    case AUTH_ACTIONS.LOAD_USER_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };

    case AUTH_ACTIONS.LOGOUT:
      localStorage.removeItem('token');
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };

    case AUTH_ACTIONS.UPDATE_PROFILE:
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: {
          ...state.user,
          ...action.payload,
          // Ensure nested objects are properly merged
          notifications: action.payload.notifications
            ? { ...state.user?.notifications, ...action.payload.notifications }
            : state.user?.notifications,
          privacy: action.payload.privacy
            ? { ...state.user?.privacy, ...action.payload.privacy }
            : state.user?.privacy
        }
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user on app start
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          dispatch({ type: AUTH_ACTIONS.LOAD_USER_START });
          const response = await authAPI.getProfile();
          dispatch({
            type: AUTH_ACTIONS.LOAD_USER_SUCCESS,
            payload: { user: response.data.user }
          });
        } catch (error) {
          console.error('Load user error:', error);
          localStorage.removeItem('token');
          dispatch({
            type: AUTH_ACTIONS.LOAD_USER_FAILURE,
            payload: error.response?.data?.message || 'Failed to load user'
          });
        }
      } else {
        dispatch({
          type: AUTH_ACTIONS.LOAD_USER_FAILURE,
          payload: null
        });
      }
    };

    loadUser();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });
      const response = await authAPI.login({ email, password });

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          user: response.data.user,
          token: response.data.token
        }
      });

      toast.success('Login successful! Welcome back! 🎉');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage
      });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.REGISTER_START });
      const response = await authAPI.register(userData);

      dispatch({
        type: AUTH_ACTIONS.REGISTER_SUCCESS,
        payload: {
          user: response.data.user,
          token: response.data.token
        }
      });

      toast.success('Registration successful! Welcome! 🎉');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: errorMessage
      });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      toast.success('Logged out successfully');
    }
  };

  // Update profile function
  const updateProfile = async (profileData) => {
    try {
      console.log('🔄 AuthContext: Updating profile with data:', profileData);
      const response = await authAPI.updateProfile(profileData);
      console.log('✅ AuthContext: Profile update response:', response.data);
      dispatch({
        type: AUTH_ACTIONS.UPDATE_PROFILE,
        payload: response.data.user
      });
      toast.success('Profile updated successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ AuthContext: Profile update error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Update user directly from responses
  const updateUser = (userData) => {
    console.log('🔄 AuthContext: Directly updating user data:', userData);
    dispatch({
      type: AUTH_ACTIONS.UPDATE_USER,
      payload: userData
    });
    return { success: true };
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    updateUser,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
