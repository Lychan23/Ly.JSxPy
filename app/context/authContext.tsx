"use client";

import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

interface AuthContextType {
  loggedIn: boolean;
  username: string | null;
  rememberMe: boolean;
  login: (username: string, password: string, remember: boolean) => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuthStatus = () => {
      const authToken = Cookies.get('auth-token');
      const storedUsername = Cookies.get('username');
      const storedRememberMe = Cookies.get('rememberMe');

      if (authToken && storedUsername) {
        setLoggedIn(true);
        setUsername(storedUsername);
        setRememberMe(storedRememberMe === 'true');
      } else {
        setLoggedIn(false);
        setUsername(null);
        setRememberMe(false);
      }
    };

    checkAuthStatus();
    window.addEventListener('storage', checkAuthStatus);

    return () => {
      window.removeEventListener('storage', checkAuthStatus);
    };
  }, []);

  const login = async (username: string, password: string, remember: boolean) => {
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password, rememberMe: remember })
      });

      const data = await response.json();
      if (data.success) {
        setLoggedIn(true);
        setUsername(username);
        setRememberMe(remember);
        setError(null);

        const expires = remember ? 7 : undefined; // `undefined` means session cookie
        Cookies.set('auth-token', data.token, { expires });
        Cookies.set('username', username, { expires });
        Cookies.set('rememberMe', remember.toString(), { expires });

        router.push('/dashboard');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (error: any) {
      setError('An unexpected error occurred');
      console.error('Login error:', error);
    }
  };

  const logout = () => {
    setLoggedIn(false);
    setUsername(null);
    setRememberMe(false);
    Cookies.remove('auth-token');
    Cookies.remove('username');
    Cookies.remove('rememberMe');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ loggedIn, username, rememberMe, login, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;