import axios from 'axios';

// Resolve backend base URL from environment
// Prefer VITE_API_URL, otherwise fall back to the deployed Render URL so the app works without Netlify envs
const DEFAULT_API = 'https://react-template-fastapi.onrender.com';
const API_URL = (import.meta.env?.VITE_API_URL || (typeof window !== 'undefined' ? window.__API_URL__ : '') || DEFAULT_API)
  .toString()
  .replace(/\/$/, '');

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL || '', // fallback to same-origin if not provided
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false, // We're using token-based auth
});

// Export base URL for consumers that need to construct absolute asset URLs
export const API_BASE = API_URL || '';

export const buildAvatarUrl = (filename) => {
  const base = (API_URL || '').replace(/\/$/, '');
  return `${base}/dbz/${filename}`;
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  // Register a new user
  signup: async (userData) => {
    try {
      const response = await api.post('/signup', userData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 
                         error.response?.data?.message || 
                         'Signup failed. Please try again.';
      throw new Error(errorMessage);
    }
  },

  // Login user
  login: async (email, password) => {
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      
      const response = await api.post('/token', formData.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        return { success: true, data: response.data };
      }
      
      throw new Error('No access token received');
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 
                         error.response?.data?.message || 
                         'Login failed. Please check your credentials.';
      throw new Error(errorMessage);
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await api.get('/users/me/');
      return response.data;
    } catch (error) {
      throw error.response?.data?.detail || 'Failed to fetch user';
    }
  },

  // Get list of available avatars
  getAvatars: async () => {
    const res = await api.get('/avatars');
    return res.data;
  },

  // Update current user's avatar
  updateAvatar: async (avatar) => {
    const res = await api.put('/users/me/avatar', { avatar });
    return res.data;
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await api.post('/users/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.detail || 'Failed to change password';
      throw new Error(msg);
    }
  },

  // Mark onboarding complete
  completeOnboarding: async () => {
    try {
      const res = await api.post('/users/me/onboarding-complete');
      return res.data;
    } catch (error) {
      const msg = error.response?.data?.detail || 'Failed to complete onboarding';
      throw new Error(msg);
    }
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};

// Admin API
export const adminApi = {
  listUsers: async () => {
    const res = await api.get('/admin/users');
    return res.data;
  },
  createUser: async ({ username, email, password, full_name, disabled = false, avatar = null }) => {
    const res = await api.post('/admin/users', {
      username,
      email,
      password,
      full_name,
      disabled,
      avatar,
    });
    return res.data;
  },
};

export default api;
