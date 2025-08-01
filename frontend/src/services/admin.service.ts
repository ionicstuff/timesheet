import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Create axios instance with interceptors
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    // For admin endpoints, use x-auth-token header
    if (config.url?.includes('/admin/')) {
      config.headers['x-auth-token'] = token;
    } else {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  role: string;
}

export interface Client {
  id: number;
  name: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
}

class AdminService {
  async getUsers(): Promise<{ users: User[] }> {
    try {
      const response = await api.get('/admin/users');
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async getClients(): Promise<Client[]> {
    try {
      const response = await api.get('/admin/clients');
      return response.data;
    } catch (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
  }
}

export default new AdminService();
