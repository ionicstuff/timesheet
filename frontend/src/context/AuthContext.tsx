import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import authService, { User, LoginRequest, RegisterRequest } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (loginData: LoginRequest) => Promise<void>;
  register: (registerData: RegisterRequest) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentUser = authService.getCurrentUser();
        const token = authService.getToken();
        
        if (currentUser && token) {
          // Initialize session on load
          authService.initializeSession();
          // Validate token with backend
          const isValid = await authService.validateToken();
          if (isValid) {
            setUser(currentUser);
          } else {
            authService.logout();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        authService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (loginData: LoginRequest) => {
    try {
      const response = await authService.login(loginData);
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const register = async (registerData: RegisterRequest) => {
    try {
      const response = await authService.register(registerData);
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
