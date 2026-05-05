import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: string;
  username: string;
  nome: string;
  role: 'admin' | 'professor';
  professorId?: string | null;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const interceptorId = axios.interceptors.request.use((config) => {
      const token = localStorage.getItem('pm_token');
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    const savedUser = localStorage.getItem('pm_user');
    const savedToken = localStorage.getItem('pm_token');
    if (savedToken && savedUser) {
      axios.defaults.headers.common.Authorization = `Bearer ${savedToken}`;
      setUser(JSON.parse(savedUser));
    } else {
      localStorage.removeItem('pm_user');
      localStorage.removeItem('pm_token');
      delete axios.defaults.headers.common.Authorization;
    }

    setIsLoading(false);

    return () => {
      axios.interceptors.request.eject(interceptorId);
    };
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const { data } = await axios.post('/api/login', { username, password });
      axios.defaults.headers.common.Authorization = `Bearer ${data.token}`;
      setUser(data.user);
      localStorage.setItem('pm_user', JSON.stringify(data.user));
      localStorage.setItem('pm_token', data.token);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Falha no login');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('pm_user');
    localStorage.removeItem('pm_token');
    delete axios.defaults.headers.common.Authorization;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
