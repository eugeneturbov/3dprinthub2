import { useState, useEffect, useContext, createContext } from 'react';
import { authAPI } from '../services/api';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = Cookies.get('token') || localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          // Verify token with server
          const response = await authAPI.getMe();
          setUser(response.data.user);
          setIsAuthenticated(true);
        } catch (error) {
          // Token is invalid, clear it
          clearAuth();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await authAPI.login(credentials);
      const { user: userData, token } = response.data;

      // Store token and user data
      setAuthData(token, userData);

      toast.success('Вход выполнен успешно!');
      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.error || 'Ошибка входа';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await authAPI.register(userData);
      const { user: newUser, token } = response.data;

      // Store token and user data
      setAuthData(token, newUser);

      toast.success('Регистрация выполнена успешно!');
      return { success: true, user: newUser };
    } catch (error) {
      const message = error.response?.data?.error || 'Ошибка регистрации';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
      toast.success('Вы вышли из системы');
    }
  };

  const updateProfile = async (userData) => {
    try {
      setLoading(true);
      const response = await authAPI.updateProfile(userData);
      const updatedUser = response.data.user;

      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      toast.success('Профиль обновлен!');
      return { success: true, user: updatedUser };
    } catch (error) {
      const message = error.response?.data?.error || 'Ошибка обновления профиля';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (passwordData) => {
    try {
      setLoading(true);
      await authAPI.changePassword(passwordData);
      toast.success('Пароль изменен успешно!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Ошибка изменения пароля';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async (token) => {
    try {
      setLoading(true);
      const response = await authAPI.verifyEmail(token);
      const verifiedUser = response.data.user;

      setUser(verifiedUser);
      localStorage.setItem('user', JSON.stringify(verifiedUser));

      toast.success('Email подтвержден!');
      return { success: true, user: verifiedUser };
    } catch (error) {
      const message = error.response?.data?.error || 'Ошибка подтверждения email';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async (email) => {
    try {
      setLoading(true);
      await authAPI.resendVerification(email);
      toast.success('Письмо подтверждения отправлено!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Ошибка отправки письма';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    try {
      setLoading(true);
      await authAPI.forgotPassword(email);
      toast.success('Письмо для сброса пароля отправлено!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Ошибка отправки письма';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (data) => {
    try {
      setLoading(true);
      await authAPI.resetPassword(data);
      toast.success('Пароль сброшен успешно!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Ошибка сброса пароля';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const setAuthData = (token, userData) => {
    // Store token in both cookie and localStorage for flexibility
    Cookies.set('token', token, { expires: 7 }); // 7 days
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));

    setUser(userData);
    setIsAuthenticated(true);
  };

  const clearAuth = () => {
    Cookies.remove('token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    setUser(null);
    setIsAuthenticated(false);
  };

  const hasRole = (role) => {
    return user?.role === role;
  };

  const hasAnyRole = (roles) => {
    return roles.includes(user?.role);
  };

  const isAdmin = () => hasRole('admin');
  const isSeller = () => hasRole('seller');
  const isUser = () => hasRole('user');

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    hasRole,
    hasAnyRole,
    isAdmin,
    isSeller,
    isUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
