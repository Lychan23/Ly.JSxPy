"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  getAuth
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc,
  serverTimestamp,
  DocumentReference,
  updateDoc
} from "firebase/firestore";
import { 
  auth as defaultAuth, 
  db as defaultDb,
  Auth,
  Firestore 
} from "@/firebase/firebaseConfig";

export interface AIProviderSettings {
  apiKey?: string;
  selectedModel?: string;
  enabled?: boolean;
}
// Enhanced Type Definitions
interface UserSettings {
  darkMode: boolean;
  notifications: boolean;
  language: string;
  rememberMe?: boolean;
  lastLoginAt?: Date;
  lastActiveAt?: Date;
  twoFactorAuth?: boolean;
  totpSecret?: string;
  aiProviders?: {
    free?: AIProviderSettings;
    openai?: AIProviderSettings;
    anthropic?: AIProviderSettings;
    // Extensible for future providers
    [key: string]: AIProviderSettings | undefined;
  };
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
  phone?: string;
  location?: string;
  avatarUrl?: string;
  roles: string[];
  settings: UserSettings;
  createdAt?: Date;
  updatedAt?: Date;
  lastLoginAt?: Date;
  lastActiveAt?: Date;
  deviceInfo?: {
    lastDevice?: string;
    lastBrowser?: string;
    lastOS?: string;
  };
}

interface AuthState {
  user: UserProfile | null;
  loggedIn: boolean;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  firebaseUser: FirebaseUser | null;
}

interface AuthContextProps extends AuthState {
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; message?: string }>;
  register: (email: string, password: string, username: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  updateUserSettings: (settings: Partial<UserSettings>) => Promise<void>;
  resetError: () => void;
  getIdToken: () => Promise<string>;
  
  // New method for AI provider settings
  updateAIProviderSettings: (
    provider: string, 
    settings: Partial<AIProviderSettings>
  ) => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
  auth?: Auth;
  db?: Firestore;
}

// Create Auth Context
const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// Custom hook with error handling
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
// Helper Functions
const getDeviceInfo = () => {
  const userAgent = window.navigator.userAgent;
  const browser = userAgent.match(/(chrome|safari|firefox|opera|edge|ie)\/?/i)?.[0] || "unknown";
  const os = userAgent.match(/(mac|win|linux|android|ios)\/?/i)?.[0] || "unknown";
  
  return {
    lastDevice: window.navigator.platform,
    lastBrowser: browser,
    lastOS: os
  };
};

const createUserProfile = async (
  uid: string, 
  userData: Partial<UserProfile>, 
  database: Firestore
): Promise<void> => {
  const userRef: DocumentReference = doc(database, 'users', uid);
  
  try {
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.log('Creating new user profile for:', uid);
      const deviceInfo = getDeviceInfo();
      const now = new Date();
      
      const profileData = {
        ...userData,
        id: uid,
        roles: ['user'],
        settings: {
          darkMode: false,
          notifications: true,
          language: "en",
          rememberMe: false,
          lastLoginAt: now,
          lastActiveAt: now,
        },
        deviceInfo,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
      };

      console.log('Profile data to be created:', profileData);
      await setDoc(userRef, profileData);
      console.log('User profile created successfully');
    } else {
      console.log('User profile already exists');
    }
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw new Error(`Failed to create user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Auth Provider Component
export const AuthProvider: React.FC<AuthProviderProps> = ({ 
  children,
  auth: providedAuth = defaultAuth,
  db: providedDb = defaultDb
}) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    firebaseUser: null, // Added to store Firebase user
    loggedIn: false,
    loading: true,
    initialized: false,
    error: null
  });
  
  const router = useRouter();

  // Helper to update state
  const updateState = (newState: Partial<AuthState>) => {
    setState(prev => ({ ...prev, ...newState }));
  };

  // Get ID Token method
  const getIdToken = async (): Promise<string> => {
    if (!state.firebaseUser) {
      throw new Error('No authenticated user');
    }
    return state.firebaseUser.getIdToken(true);
  };

  const updateAIProviderSettings = async (
    provider: string, 
    settings: Partial<AIProviderSettings>
  ): Promise<void> => {
    if (!state.user?.id || !providedDb) return;

    try {
      const userRef = doc(providedDb, "users", state.user.id);
      
      // Merge new AI provider settings with existing settings
      const currentAIProviders = state.user.settings.aiProviders || {};
      const updatedAIProviders = {
        ...currentAIProviders,
        [provider]: {
          ...(currentAIProviders[provider] || {}),
          ...settings
        }
      };

      await updateDoc(userRef, {
        settings: { 
          ...state.user.settings,
          aiProviders: updatedAIProviders
        },
        updatedAt: serverTimestamp()
      });
      
      await refreshUserProfile();
    } catch (error) {
      console.error(`Error updating ${provider} AI settings:`, error);
      updateState({ 
        error: `Failed to update ${provider} AI settings` 
      });
    }
  };

  // Enhanced profile loading with activity tracking
  const loadUserProfile = async (uid: string): Promise<boolean> => {
    if (!providedDb) {
      console.error('Firestore instance not provided');
      return false;
    }
  
    try {
      console.log('Loading user profile for:', uid);
      const userRef = doc(providedDb, "users", uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        console.log('User profile found');
        const userData = userDoc.data() as Omit<UserProfile, 'id'>;
        const deviceInfo = getDeviceInfo();
        
        // Ensure aiProviders exists with default settings if not present
        const updatedUserData = {
          ...userData,
          settings: {
            ...userData.settings,
            aiProviders: userData.settings.aiProviders || {
              free: { 
                enabled: true,
                selectedModel: 'llama-3.1-70b-versatile' 
              },
              openai: { 
                enabled: false,
                apiKey: '',
                selectedModel: 'gpt-3.5-turbo'
              }
            }
          }
        };

        await updateDoc(userRef, {
          lastActiveAt: serverTimestamp(),
          deviceInfo,
          updatedAt: serverTimestamp(),
          settings: updatedUserData.settings
        });
  
        const userProfile = { ...updatedUserData, id: uid };
        updateState({ 
          user: userProfile, 
          loggedIn: true,
          error: null 
        });
        
        return true;
      }
      
      console.error('User profile not found for uid:', uid);
      throw new Error("User profile not found");
    } catch (error) {
      console.error("Error loading user profile:", error);
      updateState({ 
        user: null, 
        loggedIn: false,
        error: error instanceof Error ? error.message : "Failed to load user profile" 
      });
      return false;
    }
  };
  
  // Refresh user profile
  const refreshUserProfile = async () => {
    if (state.user?.id) {
      await loadUserProfile(state.user.id);
    }
  };

  // Update user settings
  const updateUserSettings = async (newSettings: Partial<UserSettings>) => {
    if (!state.user?.id || !providedDb) return;

    try {
      const userRef = doc(providedDb, "users", state.user.id);
      await updateDoc(userRef, {
        settings: { ...state.user.settings, ...newSettings },
        updatedAt: serverTimestamp()
      });
      
      await refreshUserProfile();
    } catch (error) {
      console.error("Error updating user settings:", error);
      updateState({ 
        error: "Failed to update user settings" 
      });
    }
  };

  // Enhanced login with remember me
  const login = async (
    email: string, 
    password: string,
    rememberMe: boolean = false
  ): Promise<{ success: boolean; message?: string }> => {
    if (!providedAuth) {
      return { success: false, message: "Auth is not initialized" };
    }

    try {
      // Set persistence based on rememberMe
      await setPersistence(providedAuth, 
        rememberMe ? browserLocalPersistence : browserSessionPersistence
      );

      const userCredential = await signInWithEmailAndPassword(providedAuth, email, password);
      const profileLoaded = await loadUserProfile(userCredential.user.uid);
      
      if (!profileLoaded) {
        await signOut(providedAuth);
        return { 
          success: false, 
          message: "Failed to load user profile" 
        };
      }

      // Update settings with rememberMe preference
      await updateUserSettings({ rememberMe });
      
      router.push("/dashboard");
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Login failed";
      updateState({ error: errorMessage });
      return { success: false, message: errorMessage };
    }
  };

  // Enhanced register
  const register = async (
    email: string, 
    password: string, 
    username: string
  ): Promise<{ success: boolean; message?: string }> => {
    if (!providedAuth || !providedDb) {
      console.error("Firebase services not initialized");
      return { success: false, message: "Firebase services are not initialized" };
    }
  
    try {
      console.log('Starting registration process for:', email);
      const userCredential = await createUserWithEmailAndPassword(providedAuth, email, password);
      console.log('User created in Firebase Auth:', userCredential.user.uid);
      
      // Create user profile with explicit error handling
      try {
        await createUserProfile(userCredential.user.uid, {
          username,
          email,
          roles: ['user'],
          settings: {
            darkMode: false,
            notifications: true,
            language: "en",
            rememberMe: false
          }
        }, providedDb);
      } catch (profileError) {
        console.error('Failed to create user profile after registration:', profileError);
        // Optionally delete the auth user if profile creation fails
        try {
          await userCredential.user.delete();
        } catch (deleteError) {
          console.error('Failed to cleanup auth user after profile creation failure:', deleteError);
        }
        throw new Error('Failed to complete user registration');
      }
  
      // Load the profile immediately after creation
      const profileLoaded = await loadUserProfile(userCredential.user.uid);
      if (!profileLoaded) {
        throw new Error('Profile created but failed to load');
      }
  
      console.log('Registration completed successfully');
      router.push("/dashboard");
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error instanceof Error ? error.message : "Registration failed";
      updateState({ error: errorMessage });
      return { success: false, message: errorMessage };
    }
  };

  // Enhanced logout
  const logout = async (): Promise<void> => {
    if (!providedAuth) return;

    try {
      if (state.user?.id) {
        const userRef = doc(providedDb, "users", state.user.id);
        await updateDoc(userRef, {
          lastActiveAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      await signOut(providedAuth);
      updateState({ 
        user: null, 
        loggedIn: false,
        error: null 
      });
      
      router.push("/auth");
    } catch (error) {
      console.error("Logout error:", error);
      updateState({ 
        error: "Failed to logout" 
      });
    }
  };

  // Reset error state
  const resetError = () => {
    updateState({ error: null });
  };

  // Auth state observer with session persistence
  useEffect(() => {
    if (!providedAuth) {
      updateState({ 
        loading: false, 
        initialized: true,
        error: "Auth is not initialized" 
      });
      return;
    }

    const unsubscribe = onAuthStateChanged(
      providedAuth,
      async (firebaseUser: FirebaseUser | null) => {
        try {
          if (firebaseUser) {
            // Store Firebase user in state
            updateState({ firebaseUser });
            await loadUserProfile(firebaseUser.uid);
          } else {
            updateState({ 
              user: null,
              firebaseUser: null,
              loggedIn: false 
            });
            
            if (window.location.pathname.includes('/dashboard')) {
              router.push('/auth');
            }
          }
        } catch (error) {
          console.error("Auth state change error:", error);
          updateState({ 
            user: null,
            firebaseUser: null,
            loggedIn: false,
            error: "Authentication error" 
          });
        } finally {
          updateState({ 
            loading: false, 
            initialized: true 
          });
        }
      }
    );

    return () => unsubscribe();
  }, [providedAuth]);

  // Activity tracking
  useEffect(() => {
    if (!state.user?.id) return;

    let inactivityTimeout: NodeJS.Timeout;
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];

    const updateActivity = async () => {
      if (state.user?.id) {
        const userRef = doc(providedDb, "users", state.user.id);
        await updateDoc(userRef, {
          lastActiveAt: serverTimestamp()
        });
      }
    };

    const handleActivity = () => {
      clearTimeout(inactivityTimeout);
      inactivityTimeout = setTimeout(updateActivity, 5 * 60 * 1000); // Update after 5 minutes of inactivity
    };

    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      clearTimeout(inactivityTimeout);
    };
  }, [state.user?.id]);

  const value: AuthContextProps = {
    ...state,
    login,
    register,
    logout,
    refreshUserProfile,
    updateUserSettings,
    resetError,
    getIdToken,
    updateAIProviderSettings
  };

  return (
    <AuthContext.Provider value={value}>
      {!state.initialized ? (
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
