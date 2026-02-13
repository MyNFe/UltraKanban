'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { UserSession } from '@/types';

interface AuthState {
  user: UserSession | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; user?: UserSession }>;
  logout: () => void;
  clearError: () => void;
  findUserByEmail: (email: string) => Promise<UserSession | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'kanban-current-user';

// Helper to get initial session from localStorage
const getInitialSession = (): UserSession | null => {
  if (typeof window === 'undefined') return null;
  try {
    const savedSession = localStorage.getItem(SESSION_KEY);
    if (savedSession) {
      return JSON.parse(savedSession) as UserSession;
    }
  } catch (error) {
    console.error('Error loading session:', error);
  }
  return null;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => ({
    user: getInitialSession(),
    isLoading: false,
    error: null,
  }));

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const session: UserSession = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        setState({
          user: session,
          isLoading: false,
          error: null,
        });
        return true;
      } else {
        setState({
          user: null,
          isLoading: false,
          error: data.error || 'Erro ao fazer login',
        });
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      setState({
        user: null,
        isLoading: false,
        error: 'Erro de conexão',
      });
      return false;
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string): Promise<{ success: boolean; user?: UserSession }> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const session: UserSession = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        setState({
          user: session,
          isLoading: false,
          error: null,
        });
        return { success: true, user: session };
      } else {
        setState({
          user: null,
          isLoading: false,
          error: data.error || 'Erro ao cadastrar',
        });
        return { success: false };
      }
    } catch (error) {
      console.error('Register error:', error);
      setState({
        user: null,
        isLoading: false,
        error: 'Erro de conexão',
      });
      return { success: false };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setState({
      user: null,
      isLoading: false,
      error: null,
    });
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const findUserByEmail = useCallback(async (email: string): Promise<UserSession | null> => {
    try {
      const response = await fetch(`/api/users?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('Error finding user:', error);
      return null;
    }
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    state,
    login,
    register,
    logout,
    clearError,
    findUserByEmail,
  }), [state, login, register, logout, clearError, findUserByEmail]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
