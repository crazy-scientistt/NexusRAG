/**
 * Guest identity provider.
 *
 * NexusRAG has no login: there is no sign-in page, no Firebase, and no token
 * exchange. Every visitor is served as the Studio Guest, and the backend
 * resolves the same identity server-side. This context only exists so the
 * components that display the current user keep a single place to read it from.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@/types';
import { apiClient } from '@/services/api';

const GUEST_USER: User = {
  uid: 'guest-studio-user',
  email: 'guest@nexusrag.studio',
  displayName: 'Studio Researcher',
};
const GUEST_TOKEN = 'guest-token-dev';

interface AuthContextType {
  user: User;
  idToken: string;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user] = useState<User>(GUEST_USER);

  useEffect(() => {
    apiClient.setIdToken(GUEST_TOKEN);
  }, []);

  // Kept so the workspace menu can offer "clear session" without special-casing.
  const logout = async () => {
    try {
      localStorage.removeItem('nexus_guest_session');
    } catch {
      // Storage can be unavailable in private mode; nothing to clean up then.
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        idToken: GUEST_TOKEN,
        isLoading: false,
        isAuthenticated: true,
        logout,
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
