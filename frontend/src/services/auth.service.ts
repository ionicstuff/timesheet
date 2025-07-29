import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    role: string;
    isActive: boolean;
  };
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: string;
  isActive: boolean;
}

class AuthService {
  private sessionTimeout: NodeJS.Timeout | null = null;
  private readonly SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

  private startSessionTimer(): void {
    this.clearSessionTimer();
    this.sessionTimeout = setTimeout(() => {
      this.logout();
      window.location.href = '/';
      alert('Your session has expired. Please log in again.');
    }, this.SESSION_DURATION);
  }

  private clearSessionTimer(): void {
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
      this.sessionTimeout = null;
    }
  }

  private refreshSession(): void {
    if (this.isAuthenticated()) {
      this.startSessionTimer();
    }
  }

  async login(loginData: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/login', loginData);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('lastLoginTime', new Date().toISOString());
        this.startSessionTimer();
      }
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  }

  async register(registerData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/register', registerData);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('lastLoginTime', new Date().toISOString());
        this.startSessionTimer();
      }
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  }

  logout(): void {
    this.clearSessionTimer();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('lastLoginTime');
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
      }
    }
    return null;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  initializeSession(): void {
    if (this.isAuthenticated()) {
      this.startSessionTimer();
    }
  }

  async validateToken(): Promise<boolean> {
    try {
      const response = await api.get('/auth/validate');
      if (response.status === 200) {
        this.refreshSession();
        return true;
      }
      return false;
    } catch (error) {
      this.logout();
      return false;
    }
  }
}

export default new AuthService();
