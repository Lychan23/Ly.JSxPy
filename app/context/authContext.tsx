// app/context/authContext.tsx
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
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const authToken = Cookies.get('auth-token');
    const storedUsername = Cookies.get('username');
    if (authToken && storedUsername) {
      setLoggedIn(true);
      setUsername(storedUsername);
    }
  }, []);

  const login = async (username: string, password: string, remember: boolean) => {
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      if (data.success) {
        setLoggedIn(true);
        setUsername(username);
        setRememberMe(remember);
        setError(null);
        if (remember) {
          Cookies.set('auth-token', data.token, { expires: 7 });
          Cookies.set('username', username, { expires: 7 });
        } else {
          Cookies.set('auth-token', data.token);
          Cookies.set('username', username);
        }
        router.push('/dashboard');
      } else {
        setError(data.message);
        throw new Error(data.message);
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  const logout = () => {
    setLoggedIn(false);
    setUsername(null);
    Cookies.remove('auth-token');
    Cookies.remove('username');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ loggedIn, username, rememberMe, login, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
