import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  changePassword: (passwordData) => api.put('/auth/change-password', passwordData),
  verifyToken: () => api.get('/auth/verify'),
};

// Users API
export const usersAPI = {
  getUsers: (params = {}) => api.get('/users', { params }),
  getOnlineUsers: () => api.get('/users/online'),
  getUserById: (userId) => api.get(`/users/${userId}`),
  blockUser: (userId) => api.post(`/users/${userId}/block`),
  getBlockedUsers: () => api.get('/users/blocked/list'),
  addFriend: (userId) => api.post(`/users/${userId}/friend`),
  getFriends: () => api.get('/users/friends/list'),
};

// Messages API
export const messagesAPI = {
  getConversations: (params = {}) => api.get('/messages/conversations', { params }),
  startConversation: (recipientId) => api.post('/messages/conversations', { recipientId }),
  getMessages: (conversationId, params = {}) => 
    api.get(`/messages/conversations/${conversationId}/messages`, { params }),
  sendMessage: (conversationId, messageData) => 
    api.post(`/messages/conversations/${conversationId}/messages`, messageData),
  editMessage: (messageId, content) => 
    api.put(`/messages/${messageId}`, { content }),
  deleteMessage: (messageId) => 
    api.delete(`/messages/${messageId}`),
  addReaction: (messageId, emoji) => 
    api.post(`/messages/${messageId}/reactions`, { emoji }),
  removeReaction: (messageId) => 
    api.delete(`/messages/${messageId}/reactions`),
  markAsRead: (conversationId) => 
    api.post(`/messages/conversations/${conversationId}/read`),
  searchMessages: (query, params = {}) => 
    api.get('/messages/search', { params: { query, ...params } }),
};

// File upload API
export const fileAPI = {
  uploadFile: (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });
  },

  uploadImage: (file, onProgress) => {
    const formData = new FormData();
    formData.append('image', file);

    return api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });
  },
  
  uploadAvatar: (file, onProgress) => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    return api.post('/upload/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });
  },
};

// Health check API
export const healthAPI = {
  check: () => api.get('/health'),
};

// Utility functions
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    return {
      message: error.response.data?.message || 'An error occurred',
      status: error.response.status,
      data: error.response.data,
    };
  } else if (error.request) {
    // Request was made but no response received
    return {
      message: 'Network error. Please check your connection.',
      status: 0,
      data: null,
    };
  } else {
    // Something else happened
    return {
      message: error.message || 'An unexpected error occurred',
      status: 0,
      data: null,
    };
  }
};

export const isNetworkError = (error) => {
  return !error.response && error.request;
};

export const isAuthError = (error) => {
  return error.response?.status === 401;
};

export const isValidationError = (error) => {
  return error.response?.status === 400 && error.response?.data?.errors;
};

export default api;
