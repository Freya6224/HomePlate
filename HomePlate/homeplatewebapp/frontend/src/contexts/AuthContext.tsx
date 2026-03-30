import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { User, AuthContextType, AuthResult } from '../types';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AuthContext = createContext<AuthContextType | null>(null);

function formatApiErrorDetail(detail: unknown): string {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail
      .map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e)))
      .filter(Boolean)
      .join(" ");
  if (detail && typeof (detail as { msg?: string }).msg === "string") 
    return (detail as { msg: string }).msg;
  return String(detail);
}

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null | false>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async (): Promise<void> => {
    try {
      const response = await axios.get<User>(`${API_URL}/api/auth/me`, {
        withCredentials: true
      });
      setUser(response.data);
    } catch {
      setUser(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const response = await axios.post<User>(`${API_URL}/api/auth/login`, 
        { email, password },
        { withCredentials: true }
      );
      setUser(response.data);
      return { success: true, data: response.data };
    } catch (e: unknown) {
      const error = e as { response?: { data?: { detail?: unknown } }; message?: string };
      const errorMsg = formatApiErrorDetail(error.response?.data?.detail) || error.message || 'Login failed';
      return { success: false, error: errorMsg };
    }
  };

  const register = async (email: string, password: string, name: string, role: string): Promise<AuthResult> => {
    try {
      const response = await axios.post<User>(`${API_URL}/api/auth/register`,
        { email, password, name, role },
        { withCredentials: true }
      );
      setUser(response.data);
      return { success: true, data: response.data };
    } catch (e: unknown) {
      const error = e as { response?: { data?: { detail?: unknown } }; message?: string };
      const errorMsg = formatApiErrorDetail(error.response?.data?.detail) || error.message || 'Registration failed';
      return { success: false, error: errorMsg };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
    } catch {
      // Ignore logout errors
    }
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};