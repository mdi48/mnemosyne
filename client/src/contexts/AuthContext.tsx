import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AuthContext } from './AuthContext.types';
import type { User } from '../types';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me');
      setUser(response.data.user);
    } catch {
      // Access token might be expired, try to refresh
      try {
        const refreshResponse = await api.post('/auth/refresh');
        const newToken = refreshResponse.data.accessToken;
        localStorage.setItem('accessToken', newToken);
        
        // Try getting user info again with new token
        const userResponse = await api.get('/auth/me');
        setUser(userResponse.data.user);
      } catch {
        // Refresh failed, user needs to log in again
        localStorage.removeItem('accessToken');
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { user, accessToken } = response.data;
    
    localStorage.setItem('accessToken', accessToken);
    setUser(user);
  };

  const register = async (email: string, password: string, username: string, likesPrivate: boolean) => {
    const response = await api.post('/auth/register', { 
      email, 
      password, 
      username, 
      likesPrivate 
    });
    const { user, accessToken } = response.data;
    
    localStorage.setItem('accessToken', accessToken);
    setUser(user);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    localStorage.removeItem('accessToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
