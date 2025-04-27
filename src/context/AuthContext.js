import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create the authentication context
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Initialize auth state from localStorage on component mount
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (token && storedUser) {
        // Set default Authorization header for all requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setCurrentUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      }
      
      setLoading(false);
    };
    
    checkAuth();
  }, []);
  
  // Register function
  const register = async (username, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post('/api/auth/register', {
        username,
        password
      });
      
      const { user, access_token } = response.data;
      
      // Store user info and token
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Set default Authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      setCurrentUser(user);
      setIsAuthenticated(true);
      setLoading(false);
      
      return true;
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.error || 'An error occurred during registration');
      return false;
    }
  };
  
  // Login function
  const login = async (username, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post('/api/auth/login', {
        username,
        password
      });
      
      const { user, access_token } = response.data;
      
      // Store user info and token
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Set default Authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      setCurrentUser(user);
      setIsAuthenticated(true);
      setLoading(false);
      
      return true;
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.error || 'Invalid username or password');
      return false;
    }
  };
  
  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Remove Authorization header
    delete axios.defaults.headers.common['Authorization'];
    
    setCurrentUser(null);
    setIsAuthenticated(false);
  };
  
  // Refresh token function
  const refreshToken = async () => {
    try {
      const response = await axios.post('/api/auth/refresh');
      const { access_token } = response.data;
      
      localStorage.setItem('token', access_token);
      
      // Update Authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      return true;
    } catch (err) {
      logout();
      return false;
    }
  };
  
  // Create axios interceptor for handling token expiration
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;
        
        // If error is 401 Unauthorized and not a retry
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          // Try to refresh the token
          const refreshed = await refreshToken();
          
          if (refreshed) {
            // Retry the original request with new token
            const token = localStorage.getItem('token');
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return axios(originalRequest);
          }
        }
        
        return Promise.reject(error);
      }
    );
    
    // Clean up interceptor when component unmounts
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);
  
  // Provide all auth functions and state
  const value = {
    currentUser,
    isAuthenticated,
    loading,
    error,
    register,
    login,
    logout,
    refreshToken
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};