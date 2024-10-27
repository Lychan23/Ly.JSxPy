"use client";
import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import jwt from 'jsonwebtoken';

// Define interfaces (keeping your existing interfaces)
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

// Add a hydration safe storage wrapper
const storage = {
  get: (key: string): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key) || sessionStorage.getItem(key);
    }
    return null;
  },
  set: (key: string, value: string, remember: boolean = false) => {
    if (typeof window !== 'undefined') {
      if (remember) {
        localStorage.setItem(key, value);
      } else {
        sessionStorage.setItem(key, value);
      }
    }
  },
  remove: (key: string) => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [username, setUsername] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  // Initialize auth state from cookies/storage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const authToken = Cookies.get('auth-token');
        const storedUsername = storage.get('username');
        const rememberMeValue = Cookies.get('rememberMe') === 'true';

        if (authToken && storedUsername) {
          // Verify token is not expired
          try {
            const decodedToken = jwt.decode(authToken);
            if (decodedToken && typeof decodedToken !== 'string' && decodedToken.exp) {
              const currentTime = Math.floor(Date.now() / 1000);
              if (decodedToken.exp > currentTime) {
                setLoggedIn(true);
                setUsername(storedUsername);
                setRememberMe(rememberMeValue);
                // If you have stored user data, retrieve it
                const storedUser = storage.get('user');
                if (storedUser) {
                  setUser(JSON.parse(storedUser));
                }
              } else {
                // Token is expired, clean up
                logout();
              }
            }
          } catch (error) {
            console.error('Token decode error:', error);
            logout();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, []);

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

        // Store in local/session storage as backup
        storage.set('username', username, remember);
        storage.set('user', JSON.stringify(data.user), remember);
        
        // Cookie is set by the API, but we'll store rememberMe preference
        Cookies.set('rememberMe', remember.toString(), {
          expires: remember ? 7 : 1,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });

        router.push('/dashboard');
      } else {
        setError(data.message || 'Login failed');  // Fixed: Use logical OR for undefined check
      }

      return data;
    } catch (error: any) {
      const errorResponse: AuthResponse = {
        success: false,
        message: 'An unexpected error occurred'
      };
      setError(errorResponse.message || null);  // Fixed: Use logical OR for undefined check
      console.error('Login error:', error);
      return errorResponse;
    }
  };

  const logout = () => {
    // Clear all auth state
    setLoggedIn(false);
    setUsername(null);
    setRememberMe(false);
    setUser(null);
    setError(null);
    
    // Clear storage
    storage.remove('username');
    storage.remove('user');
    
    // Clear cookies
    Cookies.remove('auth-token', {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    Cookies.remove('rememberMe');

    router.push('/login');
  };

  const updateUser = async (updatedProfile: Partial<UserProfile>) => {
    try {
      const authToken = Cookies.get('auth-token');
      if (!authToken) {
        throw new Error('No auth token found');
      }

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(updatedProfile)
      });

      const data = await response.json();
      if (data.success && user) {
        const updatedUser = {
          ...user,
          ...updatedProfile
        };
        setUser(updatedUser);
        storage.set('user', JSON.stringify(updatedUser), rememberMe);
        setError(null);
      } else {
        setError(data.message || 'Failed to update profile');  // Fixed: Use logical OR for undefined check
      }
    } catch (error: any) {
      setError('An unexpected error occurred while updating profile');
      console.error('Profile update error:', error);
    }
  };

  const updateUserSettings = async (updatedSettings: Partial<UserSettings>) => {
    try {
      const authToken = Cookies.get('auth-token');
      if (!authToken) {
        throw new Error('No auth token found');
      }

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(updatedSettings)
      });

      const data = await response.json();
      if (data.success && user) {
        const updatedUser = {
          ...user,
          settings: {
            ...user.settings,
            ...updatedSettings
          }
        };
        setUser(updatedUser);
        storage.set('user', JSON.stringify(updatedUser), rememberMe);
        setError(null);
      } else {
        setError(data.message || 'Failed to update settings');  // Fixed: Use logical OR for undefined check
      }
    } catch (error: any) {
      setError('An unexpected error occurred while updating settings');
      console.error('Settings update error:', error);
    }
  };

  if (!isInitialized) {
    return null; // Or a loading spinner
  }

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