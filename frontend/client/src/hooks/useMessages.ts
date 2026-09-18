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
  const [streamingId, setStreamingId] = useState<string | null>(null);
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
            return {
              ...message,
              content: stripInternalMarkers(message.content),
              sources: message.sources || message.metadata?.sources,
              model_used: message.model_used || message.metadata?.model_used,
            };
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

    const wasEmpty = messages.length === 0;
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      session_id: sessionId,
      role: 'user',
      content: payload.question,
      created_at: new Date().toISOString(),
    };
    const assistantId = `assistant-${Date.now()}`;
    const assistantMessage: Message = {
      id: assistantId,
      session_id: sessionId,
      role: 'assistant',
      content: '',
      metadata: {},
      created_at: new Date().toISOString(),
    };

    // Show both turns immediately; the assistant one fills in as tokens arrive.
    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setStreamingId(assistantId);

    const patchAssistant = (patch: Partial<Message>) =>
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, ...patch } : m))
      );

    let accumulated = '';

    try {
      await apiClient.streamMessage(sessionId, payload, (event) => {
        if (event.type === 'token') {
          accumulated += event.text;
          patchAssistant({ content: stripInternalMarkers(accumulated) });
        } else if (event.type === 'retrieval') {
          patchAssistant({
            metadata: {
              sources: event.sources,
              supported_by_documents: event.supported_by_documents,
              model_used: event.model_used,
            },
          });
        } else if (event.type === 'done') {
          patchAssistant({
            content: stripInternalMarkers(event.response),
            metadata: {
              supported_by_documents: event.supported_by_documents,
              mode: event.mode,
              sources: event.sources,
              confidence: event.confidence,
              model_used: event.model_used,
              evidence: event.evidence,
            },
          });
        } else if (event.type === 'error') {
          throw { status: 500, detail: event.detail };
        }
      });

      setError(null);
      if (wasEmpty && onFirstMessageRef.current) {
        onFirstMessageRef.current(payload.question);
      }
    } catch (err) {
      // Drop the placeholder turns so a failed send does not leave an empty
      // bubble behind; the caller restores the composer text.
      setMessages((prev) => prev.filter((m) => m.id !== assistantId && m.id !== userMessage.id));
      setError(err instanceof Error ? err.message : 'Failed to send message');
      throw err;
    } finally {
      setStreamingId(null);
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

  return { messages, isLoading, isSending, streamingId, error, sendMessage, pinMessage, clearMessages };
}