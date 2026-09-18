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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check local guest session first
    const savedGuest = localStorage.getItem('nexus_guest_session');
    if (savedGuest) {
      try {
        const parsed = JSON.parse(savedGuest);
        const token = 'guest-token-' + (parsed.uid || 'dev');
        setUser(parsed);
        setIdToken(token);
        apiClient.setIdToken(token);
        setIsLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem('nexus_guest_session');
      }
    }

    // Only initialize Firebase Auth if Firebase is loaded and an app was registered
    if (!window.firebase || !window.firebase.apps || window.firebase.apps.length === 0) {
      setIsLoading(false);
      return;
    }

    let auth: any = null;
    try {
      auth = window.firebase.auth();
    } catch (err) {
      console.warn('Firebase auth initialization bypassed:', err);
      setIsLoading(false);
      return;
    }

    auth.getRedirectResult()
      .then((result: any) => {
        if (result && result.user) {
          console.log('Redirect sign-in successful');
        }
      })
      .catch((err: any) => {
        console.error('Redirect error:', err);
        setError(err.message || 'Authentication failed');
        setIsLoading(false);
      });

    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: any) => {
      try {
        if (firebaseUser) {
          const token = await firebaseUser.getIdToken();
          setIdToken(token);
          apiClient.setIdToken(token);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
          });
        } else {
          // If no firebase user and no local guest session
          if (!localStorage.getItem('nexus_guest_session')) {
            setUser(null);
            setIdToken(null);
            apiClient.setIdToken(null);
          }
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Auth error');
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
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
      setUser(null);
      setIdToken(null);
      apiClient.setIdToken(null);
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
