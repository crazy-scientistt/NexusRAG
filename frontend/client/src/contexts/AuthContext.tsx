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
    if (!window.firebase) {
      setError('Firebase not loaded');
      setIsLoading(false);
      return;
    }

    const auth = window.firebase.auth();

    auth.getRedirectResult()
      .then((result: any) => {
        if (result.user) {
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
          setUser(null);
          setIdToken(null);
          apiClient.setIdToken(null);
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

  const logout = useCallback(async () => {
    try {
      const auth = window.firebase.auth();
      await auth.signOut();
    } catch (err: any) {
      const message = err?.message || 'Logout failed';
      setError(message);
      throw err;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider value={{
      user, idToken, isLoading, error, isAuthenticated: !!user,
      login, loginWithGoogle, signup, resetPassword, logout, clearError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
