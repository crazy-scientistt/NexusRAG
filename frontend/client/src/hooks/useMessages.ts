import { useEffect, useState, useCallback, useRef } from 'react';
import type { Message, MessageRequest } from '@/types';
import { apiClient } from '@/services/api';

const stripInternalMarkers = (text: string): string => {
  let cleaned = text || '';
  const patterns = [
    /\[?\s*source(?:\s+number)?\s*\d+\]?/gi,
    /\(source\s*\d+\)/gi,
    /\(chunk\s*\d+\)/gi,
    /\bchunk\s*\d+\b/gi,
  ];
  patterns.forEach((pattern) => { cleaned = cleaned.replace(pattern, ''); });
  cleaned = cleaned.replace(/^\s*Sources?:.*$/gim, '');
  cleaned = cleaned.replace(/\s{2,}/g, ' ');
  return cleaned.trim();
};

export function useMessages(sessionId: string | null, onFirstMessage?: (message: string) => void) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use ref to avoid dependency issues with callback
  const onFirstMessageRef = useRef(onFirstMessage);
  
  // Keep ref updated
  useEffect(() => {
    onFirstMessageRef.current = onFirstMessage;
  }, [onFirstMessage]);

  useEffect(() => {
    if (!sessionId) { setMessages([]); return; }

    const loadMessages = async () => {
      setIsLoading(true);
      try {
        const data = await apiClient.getMessages(sessionId);
        const sanitized = data.map((message) => {
          if (message.role === 'assistant') {
            const { metadata, ...rest } = message;
            const safeMeta = metadata ? {
              supported_by_documents: metadata.supported_by_documents,
              mode: metadata.mode,
            } : undefined;
            return { ...rest, role: message.role, content: stripInternalMarkers(message.content), metadata: safeMeta };
          }
          return message;
        });
        setMessages(sanitized);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load messages');
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [sessionId]);

  const sendMessage = useCallback(async (payload: MessageRequest) => {
    if (!sessionId) throw new Error('No active session');
    setIsSending(true);
    
    // Capture current message count before sending
    const wasEmpty = messages.length === 0;
    
    try {
      const response = await apiClient.sendMessage(sessionId, payload);
      const cleanedResponse = stripInternalMarkers(response.response);

      const userMessage: Message = {
        id: `user-${Date.now()}`, session_id: sessionId, role: 'user',
        content: payload.question, created_at: new Date().toISOString(),
      };
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`, session_id: sessionId, role: 'assistant',
        content: cleanedResponse,
        metadata: { supported_by_documents: response.supported_by_documents, mode: response.mode },
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setError(null);
      
      // Trigger auto-naming callback if this was the first message
      // Using ref to avoid circular dependency
      if (wasEmpty && onFirstMessageRef.current) {
        onFirstMessageRef.current(payload.question);
      }
      
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      throw err;
    } finally {
      setIsSending(false);
    }
  }, [sessionId, messages.length]);

  const pinMessage = useCallback(async (messageId: string, pinned: boolean) => {
    if (!sessionId) throw new Error('No active session');
    try {
      await apiClient.pinMessage(sessionId, messageId, pinned);
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, pinned } : m)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pin message');
    }
  }, [sessionId]);

  const clearMessages = useCallback(() => { setMessages([]); }, []);

  return { messages, isLoading, isSending, error, sendMessage, pinMessage, clearMessages };
}