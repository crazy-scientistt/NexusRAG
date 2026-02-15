import { useEffect, useState, useCallback } from 'react';
import type { Session } from '@/types';
import { apiClient } from '@/services/api';

export function useSession(isAuthenticated: boolean) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setSessions([]);
      setActiveSessionId(null);
      return;
    }

    const loadSessions = async () => {
      setIsLoading(true);
      try {
        const data = await apiClient.listSessions();
        setSessions(data);
        if (!activeSessionId && data.length > 0) {
          setActiveSessionId(data[0].id);
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load sessions');
      } finally {
        setIsLoading(false);
      }
    };

    loadSessions();
  }, [isAuthenticated]);

  const createSession = useCallback(async (name?: string, cloneFromId?: string) => {
    setIsLoading(true);
    try {
      const newSession = await apiClient.createSession({ name, clone_from: cloneFromId });
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      setError(null);
      return newSession;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const renameSession = useCallback(async (sessionId: string, name: string) => {
    try {
      await apiClient.renameSession(sessionId, name);
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, name } : s)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename session');
    }
  }, []);

  const cloneSession = useCallback(async (sessionId: string) => {
    try {
      const result = await apiClient.cloneSession(sessionId);
      const clonedSession = sessions.find((s) => s.id === sessionId);
      if (clonedSession) {
        const newSession: Session = { ...clonedSession, id: result.id, name: `${clonedSession.name} (Copy)` };
        setSessions((prev) => [newSession, ...prev]);
        setActiveSessionId(result.id);
      }
      return result.id;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clone session');
      throw err;
    }
  }, [sessions]);

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      await apiClient.deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        const remaining = sessions.filter((s) => s.id !== sessionId);
        setActiveSessionId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete session');
    }
  }, [activeSessionId, sessions]);

  const selectSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
  }, []);

  // New function to auto-name session based on first message
  const autoNameSession = useCallback(async (sessionId: string, firstMessage: string) => {
    try {
      // Generate a concise name from the first message (max 50 chars)
      const trimmedMessage = firstMessage.trim();
      let name = trimmedMessage.length > 50 
        ? trimmedMessage.substring(0, 47) + '...' 
        : trimmedMessage;
      
      // Remove newlines and multiple spaces
      name = name.replace(/\s+/g, ' ');
      
      // Update both backend and local state
      await apiClient.renameSession(sessionId, name);
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, name } : s)));
    } catch (err) {
      // Silently fail - auto-naming is a nice-to-have, not critical
      console.warn('Failed to auto-name session:', err);
    }
  }, []);

  return {
    sessions, activeSessionId, isLoading, error,
    createSession, renameSession, cloneSession, deleteSession, selectSession, autoNameSession,
  };
}
