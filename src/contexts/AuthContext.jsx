import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

// Load users from CSV data
let usersData = [];

const loadUsers = async () => {
  try {
    const response = await fetch('/src/data/users.csv');
    const csvText = await response.text();
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    
    usersData = lines.slice(1).map(line => {
      const values = line.split(',');
      const obj = {};
      headers.forEach((header, index) => {
        let value = values[index];
        if (value === 'true') value = true;
        if (value === 'false') value = false;
        if (!isNaN(value) && value !== '' && header === 'id') value = Number(value);
        obj[header] = value;
      });
      return obj;
    });
  } catch (error) {
    console.error('Failed to load users:', error);
    // Fallback users if CSV fails
    usersData = [
      { id: 1, username: 'john_doe', email: 'john@example.com', password: 'password123', full_name: 'John Doe', avatar: 'avatar1.png', onboarding_completed: true, role: 'user' },
      { id: 2, username: 'admin_user', email: 'admin@example.com', password: 'admin123', full_name: 'Admin User', avatar: 'avatar3.png', onboarding_completed: true, role: 'admin' }
    ];
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for token in localStorage on initial load
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('currentUserId');
        
        if (token && userId) {
          // Load users if not already loaded
          if (usersData.length === 0) {
            await loadUsers();
          }
          
          // Find current user
          const user = usersData.find(u => u.id.toString() === userId);
          if (user) {
            setUser(user);
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('currentUserId');
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('currentUserId');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signup = async (userData) => {
    try {
      // Ensure users are loaded
      if (usersData.length === 0) {
        await loadUsers();
      }
      
      // Check if email already exists
      if (usersData.find(u => u.email === userData.email)) {
        return { success: false, error: 'Email already exists' };
      }
      
      // Create new user
      const newUser = {
        id: Math.max(...usersData.map(u => u.id)) + 1,
        username: userData.email.split('@')[0],
        email: userData.email,
        password: userData.password,
        full_name: userData.name,
        avatar: 'avatar1.png',
        onboarding_completed: false,
        role: 'user'
      };
      
      usersData.push(newUser);
      localStorage.setItem('token', `token-${newUser.id}`);
      localStorage.setItem('currentUserId', newUser.id.toString());
      setUser(newUser);
      return { success: true, user: newUser };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'Signup failed' };
    }
  };

  const signin = async (credentials) => {
    try {
      // Ensure users are loaded
      if (usersData.length === 0) {
        await loadUsers();
      }
      
      // Find user by email and password
      const user = usersData.find(u => 
        u.email === credentials.email && u.password === credentials.password
      );
      
      if (user) {
        localStorage.setItem('token', `token-${user.id}`);
        localStorage.setItem('currentUserId', user.id.toString());
        setUser(user);
        return { success: true, user };
      } else {
        return { success: false, error: 'Invalid email or password' };
      }
    } catch (error) {
      console.error('Signin failed:', error);
      return { success: false, error: 'Signin failed' };
    }
  };

  const signout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUserId');
    setUser(null);
    navigate('/signin');
  };

  const updateUser = async (userData) => {
    try {
      // Mock update - just update local state
      const updated = { ...user, ...userData };
      setUser(updated);
      return updated;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  // Mock refresh user
  const refreshUser = async () => {
    try {
      // Just return current user
      return user;
    } catch (e) {
      console.error('Failed to refresh user', e);
      throw e;
    }
  };

  // Mock change avatar
  const changeAvatar = async (avatar) => {
    const updated = { ...user, avatar };
    setUser(updated);
    return updated;
  };

  const updateOnboardingStep = async (stepData) => {
    return { success: true, user };
  };
  
  const completeOnboarding = async () => {
    try {
      const updated = { ...user, onboarding_completed: true };
      setUser(updated);
      return { success: true, user: updated };
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
