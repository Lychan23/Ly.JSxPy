"use client";
import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

// Define interfaces
export interface UserProfile {
  id: number;
  username: string;
  email?: string;
  phone?: string;
  location?: string;
  avatarUrl?: string;
  settings: UserSettings;
}

export interface UserSettings {
  darkMode: boolean;
  notifications: boolean;
  language: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: UserProfile;
}

interface AuthContextType {
  loggedIn: boolean;
  username: string | null;
  rememberMe: boolean;
  user: UserProfile | null;
  login: (username: string, password: string, remember: boolean) => Promise<AuthResponse>;
  logout: () => void;
  updateUser: (updatedProfile: Partial<UserProfile>) => Promise<void>;
  updateUserSettings: (updatedSettings: Partial<UserSettings>) => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuthStatus = () => {
      const authToken = Cookies.get('auth-token');
      const storedUsername = Cookies.get('username');
      const storedUser = Cookies.get('user');
  
      // Combined retrieval of username and password
      const savedUsername = localStorage.getItem("username") || sessionStorage.getItem("username");
      const savedPassword = localStorage.getItem("password") || sessionStorage.getItem("password");
  
      // If there is an auth token and a username, log the user in
      if (authToken && (storedUsername || savedUsername)) {
        setLoggedIn(true);
        setUsername(storedUsername || savedUsername);
        setRememberMe(Cookies.get('rememberMe') === 'true');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
        
        // Redirect to dashboard immediately
        router.push('/dashboard'); 
      } else {
        setLoggedIn(false);
        setUsername(null);
        setRememberMe(false);
        setUser(null);
      }
    };
  
    checkAuthStatus();
  
    // Listen for storage events (if applicable)
    window.addEventListener('storage', checkAuthStatus);
  
    return () => {
      window.removeEventListener('storage', checkAuthStatus);
    };
  }, [router]);

  const login = async (username: string, password: string, remember: boolean): Promise<AuthResponse> => {
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, rememberMe: remember })
      });
  
      const data: AuthResponse = await response.json();
  
      if (data.success && data.token && data.user) {
        setLoggedIn(true);
        setUsername(username);
        setRememberMe(remember);
        setUser(data.user);
        setError(null);
  
        const expires = remember ? 7 : undefined; // Remember for 7 days if true
        Cookies.set('auth-token', data.token, { expires });
        Cookies.set('username', username, { expires });
        Cookies.set('rememberMe', remember.toString(), { expires });
        Cookies.set('user', JSON.stringify(data.user), { expires });
  
        router.push('/dashboard');
      } else {
        setError(data.message ?? 'Login failed');
      }

      return data;
    } catch (error: any) {
      const errorResponse: AuthResponse = {
        success: false,
        message: 'An unexpected error occurred'
      };
      setError(errorResponse.message ?? 'An unexpected error occurred');
      console.error('Login error:', error);
      return errorResponse;
    }
  };
  
  const logout = () => {
    setLoggedIn(false);
    setUsername(null);
    setRememberMe(false);
    setUser(null);
    localStorage.removeItem("username");
    localStorage.removeItem("password");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("password");
    Cookies.remove('auth-token');
    Cookies.remove('username');
    Cookies.remove('rememberMe');
    Cookies.remove('user');
    router.push('/login');
  };

  const updateUser = async (updatedProfile: Partial<UserProfile>) => {
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Cookies.get('auth-token')}`
        },
        body: JSON.stringify(updatedProfile)
      });

      const data = await response.json();
      if (data.success && user) {
        const updatedUser: UserProfile = {
          ...user,
          ...updatedProfile
        };
        setUser(updatedUser);
        Cookies.set('user', JSON.stringify(updatedUser), { expires: rememberMe ? 7 : undefined });
        setError(null);
      } else {
        const errorMessage: string = typeof data.message === 'string' ? data.message : 'Failed to update profile';
        setError(errorMessage);
      }
    } catch (error: any) {
      setError('An unexpected error occurred while updating profile');
      console.error('Profile update error:', error);
    }
  };

  const updateUserSettings = async (updatedSettings: Partial<UserSettings>) => {
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Cookies.get('auth-token')}`
        },
        body: JSON.stringify(updatedSettings)
      });

      const data = await response.json();
      if (data.success && user) {
        const updatedUser: UserProfile = {
          ...user,
          settings: {
            ...user.settings,
            ...updatedSettings
          }
        };
        setUser(updatedUser);
        Cookies.set('user', JSON.stringify(updatedUser), { expires: rememberMe ? 7 : undefined });
        setError(null);
      } else {
        const errorMessage: string = typeof data.message === 'string' ? data.message : 'Failed to update settings';
        setError(errorMessage);
      }
    } catch (error: any) {
      setError('An unexpected error occurred while updating settings');
      console.error('Settings update error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      loggedIn,
      username,
      rememberMe,
      user,
      login,
      logout,
      updateUser,
      updateUserSettings,
      error
    }}>
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
