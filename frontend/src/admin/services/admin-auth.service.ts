import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Create axios instance for admin API calls
const adminApi = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const login = async (email: string, password: string) => {
  const response = await adminApi.post('/auth/login', { email, password });
  
  if (response.data.token) {
    localStorage.setItem('adminToken', response.data.token);
  }
  
  return response.data;
};

const logout = () => {
  localStorage.removeItem('adminToken');
};

const isLoggedIn = (): boolean => {
  return !!localStorage.getItem('adminToken');
};

export const adminAuthService = {
  login,
  logout,
  isLoggedIn
};

