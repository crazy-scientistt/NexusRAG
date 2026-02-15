/**
 * useAuth Hook
 * Manages Firebase authentication state and user session
 */

import { useEffect, useState } from 'react';
import type { User } from '@/types';
import { apiClient } from '@/services/api';

declare global {
  interface Window {
    firebase?: any;
  }
}

export function useAuth() {
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

    // Handle redirect result first (when user returns from Google auth redirect)
    auth.getRedirectResult()
      .then((result: any) => {
        if (result.user) {
          // User successfully signed in via redirect
          console.log('Redirect sign-in successful');
        }
      })
      .catch((err: any) => {
        console.error('Redirect error:', err);
        setError(err.message || 'Authentication failed');
        setIsLoading(false);
      });

    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: any) => {
      try {
        if (firebaseUser) {
          // Get ID token for API requests
          const token = await firebaseUser.getIdToken();
          setIdToken(token);
          apiClient.setIdToken(token);

          // Set user info
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

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const auth = window.firebase.auth();
      await auth.signInWithEmailAndPassword(email, password);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const auth = window.firebase.auth();
      const provider = new window.firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      try {
        // Wait for popup to complete - don't set loading to false until auth state changes
        await auth.signInWithPopup(provider);
        // onAuthStateChanged will handle setting loading to false
      } catch (popupError: any) {
        const code = popupError?.code ?? '';
        if (
          code === 'auth/popup-blocked' ||
          code === 'auth/operation-not-supported-in-this-environment'
        ) {
          // Redirect flow - page will reload, keep loading true
          await auth.signInWithRedirect(provider);
          return;
        }
        throw popupError;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed';
      setError(message);
      setIsLoading(false);
      throw err;
    }
    // Don't set loading to false here - onAuthStateChanged will handle it
  };

  const signup = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const auth = window.firebase.auth();
      await auth.createUserWithEmailAndPassword(email, password);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const auth = window.firebase.auth();
      await auth.sendPasswordResetEmail(email);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Reset failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const auth = window.firebase.auth();
      await auth.signOut();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Logout failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    idToken,
    isLoading,
    error,
    login,
    signup,
    resetPassword,
    logout,
    loginWithGoogle,
    isAuthenticated: !!user,
  };
}