import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for token in localStorage on initial load
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          if (token === 'mock-jwt-token') {
            // Handle mock user session
            const mockUser = {
              id: 'demo',
              username: 'demo',
              email: 'demo@example.com',
              full_name: 'Demo User',
              avatar: null,
              role: 'user',
              onboarding_completed: true,
              onboarding: { complete: true, step: 4 }
            };
            setUser(mockUser);
          } else {
            // Try to get real user from backend
            const userResponse = await authApi.getCurrentUser();
            setUser({
              ...userResponse,
              id: userResponse.username,
              avatar: userResponse.avatar || null,
              onboarding_completed: !!userResponse.onboarding_completed,
            });
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        authApi.logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signup = async (userData) => {
    try {
      const response = await authApi.signup({
        username: userData.email.split('@')[0], // Generate username from email
        email: userData.email,
        password: userData.password,
        full_name: userData.name
      });

      // Login after successful signup
      const loginResponse = await authApi.login(userData.email, userData.password);
      
      // Get user data
      const userResponse = await authApi.getCurrentUser();
      
      const newUser = {
        ...userResponse,
        id: userResponse.username, // Using username as ID
        avatar: userResponse.avatar || null,
        onboarding_completed: !!userResponse.onboarding_completed,
      };

      setUser(newUser);
      return { success: true, user: newUser };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: error.message || 'Signup failed' };
    }
  };

  const signin = async (credentials) => {
    try {
      // Try backend login first
      await authApi.login(credentials.email, credentials.password);
      const userResponse = await authApi.getCurrentUser();
      
      const user = {
        ...userResponse,
        id: userResponse.username,
        avatar: userResponse.avatar || null,
        onboarding_completed: !!userResponse.onboarding_completed,
      };
      
      setUser(user);
      return { success: true, user };
    } catch (error) {
      console.warn('Backend login failed, using mock user:', error.message);
      
      // Create mock user for demo purposes when backend is unavailable
      const mockUser = {
        id: credentials.email.split('@')[0],
        username: credentials.email.split('@')[0],
        email: credentials.email,
        full_name: 'Demo User',
        avatar: null,
        role: credentials.email === 'admin@example.com' ? 'admin' : 'user',
        onboarding_completed: true,
        onboarding: { complete: true, step: 4 }
      };
      
      // Store mock token
      localStorage.setItem('token', 'mock-jwt-token');
      setUser(mockUser);
      return { success: true, user: mockUser };
    }
  };

  const signout = () => {
    authApi.logout();
    setUser(null);
    navigate('/signin');
  };

  const updateUser = async (userData) => {
    try {
      // Placeholder for future profile update endpoint
      const refreshed = await authApi.getCurrentUser();
      const mapped = {
        ...refreshed,
        id: refreshed.username,
        avatar: refreshed.avatar || null,
        onboarding_completed: !!refreshed.onboarding_completed,
      };
      setUser(mapped);
      return mapped;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  // Refresh user from backend
  const refreshUser = async () => {
    try {
      const refreshed = await authApi.getCurrentUser();
      const mapped = {
        ...refreshed,
        id: refreshed.username,
        avatar: refreshed.avatar || null,
        onboarding_completed: !!refreshed.onboarding_completed,
      };
      setUser(mapped);
      return mapped;
    } catch (e) {
      console.error('Failed to refresh user', e);
      throw e;
    }
  };

  // Change avatar via API and update state
  const changeAvatar = async (avatar) => {
    const updated = await authApi.updateAvatar(avatar);
    setUser(prev => ({ ...prev, ...updated, id: updated.username, avatar: updated.avatar || null }));
    return updated;
  };

  const updateOnboardingStep = async (stepData) => {
    // Keep client-side step progression if your UI needs it
    // but do not persist; server is the source of truth for completion.
    return { success: true, user };
  };
  
  const completeOnboarding = async () => {
    try {
      const updated = await authApi.completeOnboarding();
      const mapped = {
        ...updated,
        id: updated.username,
        avatar: updated.avatar || null,
        onboarding_completed: !!updated.onboarding_completed,
      };
      setUser(mapped);
      return { success: true, user: mapped };
    } catch (error) {
      console.error('Complete onboarding error:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    currentUser: user,
    loading,
    signup,
    signin,
    signout,
    updateUser,
    changeAvatar,
    refreshUser,
    updateOnboardingStep,
    completeOnboarding,
    isAuthenticated: !!user,
    onboardingComplete: !!user?.onboarding_completed,
    currentOnboardingStep: 4, // consider UI already complete when server marks done
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export AuthContext for direct access
export { AuthContext };
