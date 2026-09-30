import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('accessToken'));

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await authAPI.getCurrentUser();
          setUser(response.data.user);
        } catch {
          // Token invalid, clear it
          localStorage.removeItem('accessToken');
          setToken(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (login, password) => {
    try {
      const response = await authAPI.login(login, password);
      const { requires2FA, tempToken, user, accessToken } = response.data;
      
      // If 2FA is required, return tempToken for verification
      if (requires2FA) {
        return {
          success: false,
          requires2FA: true,
          tempToken,
          user
        };
      }
      
      // Store token
      localStorage.setItem('accessToken', accessToken);
      setToken(accessToken);
      setUser(user);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Login failed'
      };
    }
  };

  const verify2FA = async (tempToken, token) => {
    try {
      const response = await authAPI.verify2FA(tempToken, token);
      const { user, accessToken } = response.data;
      
      // Store token
      localStorage.setItem('accessToken', accessToken);
      setToken(accessToken);
      setUser(user);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || '2FA verification failed'
      };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      setToken(null);
      setUser(null);
    }
  };

  const refreshToken = async () => {
    try {
      const response = await authAPI.refreshToken();
      const { accessToken } = response.data;
      localStorage.setItem('accessToken', accessToken);
      setToken(accessToken);
      return true;
    } catch {
      logout();
      return false;
    }
  };

  const updateUser = (userData) => {
    setUser((prev) => ({ ...prev, ...userData }));
  };

  const value = {
    user,
    token,
    loading,
    login,
    verify2FA,
    logout,
    refreshToken,
    updateUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isOperator: user?.role === 'operator' || user?.role === 'admin',
    isViewer: true // All authenticated users are at least viewers
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

