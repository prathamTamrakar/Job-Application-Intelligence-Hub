import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        if (res.data && res.data.success) {
          setUser(res.data);
        } else {
          localStorage.removeItem('token');
        }
      } catch (err) {
        console.error('Error verifying token', err);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  // Login handler
  const login = async (email, password) => {
    setError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data && res.data.success) {
        localStorage.setItem('token', res.data.token);
        // Fetch full profile with settings
        const profile = await api.get('/auth/me');
        setUser(profile.data);
        return { success: true };
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  // Signup handler
  const signup = async (name, email, password) => {
    setError(null);
    try {
      const res = await api.post('/auth/register', { name, email, password });
      if (res.data && res.data.success) {
        localStorage.setItem('token', res.data.token);
        // Fetch full profile with settings
        const profile = await api.get('/auth/me');
        setUser(profile.data);
        return { success: true };
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed. Try again.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  // Update User Settings
  const updateUserSettings = async (followUpDays) => {
    try {
      const res = await api.put('/auth/settings', { followUpDays });
      if (res.data && res.data.success) {
        setUser(prev => ({
          ...prev,
          settings: res.data.data.settings
        }));
        return { success: true };
      }
    } catch (err) {
      console.error(err);
      throw new Error(err.response?.data?.message || 'Failed to update settings');
    }
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    updateUserSettings,
    isAuthenticated: !!user,
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
