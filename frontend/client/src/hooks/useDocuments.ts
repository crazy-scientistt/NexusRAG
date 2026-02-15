import { useEffect, useState, useCallback } from 'react';
import type { Document } from '@/types';
import { apiClient } from '@/services/api';

export interface UploadProgress {
  docId: string;
  filename: string;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

export function useDocuments(sessionId: string | null) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploads, setUploads] = useState<Map<string, UploadProgress>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) { setDocuments([]); return; }
    const loadDocuments = async () => {
      setIsLoading(true);
      try {
        const data = await apiClient.getDocuments(sessionId);
        setDocuments(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load documents');
      } finally {
        setIsLoading(false);
      }
    };
    loadDocuments();
  }, [sessionId]);

  const uploadDocument = useCallback(async (file: File, isTemp: boolean = false) => {
    if (!sessionId) throw new Error('No active session');
    const docId = `temp-${Date.now()}`;
    const progress: UploadProgress = { docId, filename: file.name, progress: 0, status: 'uploading' };
    setUploads((prev) => new Map(prev).set(docId, progress));

    try {
      const progressInterval = setInterval(() => {
        setUploads((prev) => {
          const updated = new Map(prev);
          const current = updated.get(docId);
          if (current && current.progress < 90) {
            updated.set(docId, { ...current, progress: current.progress + Math.random() * 30 });
          }
          return updated;
        });
      }, 300);

      const response = await apiClient.uploadDocument(sessionId, file, isTemp);
      clearInterval(progressInterval);

      setUploads((prev) => {
        const updated = new Map(prev);
        updated.set(docId, { ...progress, progress: 100, status: 'processing' });
        return updated;
      });

      const newDoc: Document = {
        id: response.doc_id, filename: response.filename, mime: file.type,
        size_bytes: file.size, is_temp: isTemp, expires_at: response.expires_at,
        created_at: new Date().toISOString(), session_id: sessionId,
      };
      setDocuments((prev) => [newDoc, ...prev]);

      setTimeout(() => {
        setUploads((prev) => { const updated = new Map(prev); updated.delete(docId); return updated; });
      }, 2000);

      setError(null);
      return newDoc;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setUploads((prev) => {
        const updated = new Map(prev);
        updated.set(docId, { ...progress, status: 'error', error: message });
        return updated;
      });
      setError(message);
      throw err;
    }
  }, [sessionId]);

  const deleteDocument = useCallback(async (docId: string) => {
    try {
      await apiClient.deleteDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    }
  }, []);

  const previewDocument = useCallback(async (docId: string) => {
    try {
      return await apiClient.previewDocument(docId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to preview document');
      throw err;
    }
  }, []);

  const clearDocuments = useCallback(() => { setDocuments([]); setUploads(new Map()); }, []);

  return { documents, uploads, isLoading, error, uploadDocument, deleteDocument, previewDocument, clearDocuments };
}
