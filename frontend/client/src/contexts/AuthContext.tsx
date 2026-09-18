import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User } from '@/types';
import { apiClient } from '@/services/api';

declare global {
  interface Window {
    firebase?: any;
  }
}

interface AuthContextType {
  user: User | null;
  idToken: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loginAsGuest: () => void;
  logout: () => Promise<void>;
  clearError: () => void;
}

const DEFAULT_GUEST_USER: User = {
  uid: 'guest-studio-user',
  email: 'guest@nexusrag.studio',
  displayName: 'Studio Researcher',
};
const DEFAULT_GUEST_TOKEN = 'guest-token-dev';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(DEFAULT_GUEST_USER);
  const [idToken, setIdToken] = useState<string | null>(DEFAULT_GUEST_TOKEN);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set token immediately on client
    apiClient.setIdToken(DEFAULT_GUEST_TOKEN);

    // Check local guest session if previously stored
    const savedGuest = localStorage.getItem('nexus_guest_session');
    if (savedGuest) {
      try {
        const parsed = JSON.parse(savedGuest);
        const token = 'guest-token-' + (parsed.uid || 'dev');
        setUser(parsed);
        setIdToken(token);
        apiClient.setIdToken(token);
      } catch (e) {
        localStorage.removeItem('nexus_guest_session');
      }
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      if (!window.firebase?.apps?.length) throw new Error('Firebase authentication is not configured. Please enter the Studio as Guest.');
      const auth = window.firebase.auth();
      await auth.signInWithEmailAndPassword(email, password);
    } catch (err: any) {
      const message = err?.message || 'Login failed';
      setError(message);
      setIsLoading(false);
      throw err;
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!window.firebase?.apps?.length) throw new Error('Firebase authentication is not configured. Please enter the Studio as Guest.');
      const auth = window.firebase.auth();
      const provider = new window.firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      try {
        await auth.signInWithPopup(provider);
      } catch (popupError: any) {
        const code = popupError?.code ?? '';
        if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
          await auth.signInWithRedirect(provider);
          return;
        }
        throw popupError;
      }
    } catch (err: any) {
      const message = err?.message || 'Google sign-in failed';
      setError(message);
      setIsLoading(false);
      throw err;
    }
  }, []);

  const signup = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      if (!window.firebase?.apps?.length) throw new Error('Firebase authentication is not configured. Please enter the Studio as Guest.');
      const auth = window.firebase.auth();
      await auth.createUserWithEmailAndPassword(email, password);
    } catch (err: any) {
      const message = err?.message || 'Signup failed';
      setError(message);
      setIsLoading(false);
      throw err;
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      if (!window.firebase?.apps?.length) throw new Error('Firebase authentication is not configured. Please enter the Studio as Guest.');
      const auth = window.firebase.auth();
      await auth.sendPasswordResetEmail(email);
    } catch (err: any) {
      const message = err?.message || 'Reset failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginAsGuest = useCallback(() => {
    setIsLoading(true);
    setError(null);
    const guestUser: User = {
      uid: 'guest-studio-user',
      email: 'guest@nexusrag.studio',
      displayName: 'Studio Guest',
    };
    const token = 'guest-token-' + Date.now();
    localStorage.setItem('nexus_guest_session', JSON.stringify(guestUser));
    setIdToken(token);
    apiClient.setIdToken(token);
    setUser(guestUser);
    setIsLoading(false);
  }, []);

  const logout = useCallback(async () => {
    localStorage.removeItem('nexus_guest_session');
    try {
      if (window.firebase && window.firebase.apps && window.firebase.apps.length > 0) {
        await window.firebase.auth().signOut();
      }
    } catch (err) {
      console.warn('Firebase logout warning:', err);
    } finally {
      setUser(DEFAULT_GUEST_USER);
      setIdToken(DEFAULT_GUEST_TOKEN);
      apiClient.setIdToken(DEFAULT_GUEST_TOKEN);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        idToken,
        isLoading,
        error,
        isAuthenticated: !!user,
        login,
        loginWithGoogle,
        signup,
        resetPassword,
        loginAsGuest,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
