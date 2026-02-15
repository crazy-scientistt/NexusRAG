import type {
  Session,
  Message,
  Document,
  QueryResponse,
  UploadResponse,
  SessionCreateRequest,
  MessageRequest,
  APIError,
} from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface RequestConfig {
  headers?: Record<string, string>;
  body?: any;
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
}

class APIClient {
  private idToken: string | null = null;

  setIdToken(token: string | null) {
    this.idToken = token;
  }

  private async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config.headers,
    };

    if (this.idToken) {
      headers['Authorization'] = `Bearer ${this.idToken}`;
    }

    try {
      const response = await fetch(url, {
        method: config.method || 'GET',
        headers,
        body: config.body ? JSON.stringify(config.body) : undefined,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        throw { status: response.status, detail: error.detail || error.message || 'Unknown error' } as APIError;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return undefined as T;
      }
      return response.json();
    } catch (error) {
      if (error instanceof TypeError) {
        throw { status: 0, detail: 'Network error. Please check your connection.' } as APIError;
      }
      throw error;
    }
  }

  async getMe() {
    return this.request<{ uid: string; email?: string }>('/me');
  }

  async createSession(payload: SessionCreateRequest) {
    return this.request<Session>('/sessions', { method: 'POST', body: payload });
  }

  async listSessions() {
    return this.request<Session[]>('/sessions');
  }

  async renameSession(sessionId: string, name: string) {
    return this.request<{ status: string }>(`/sessions/${sessionId}`, { method: 'PATCH', body: { name } });
  }

  async cloneSession(sessionId: string) {
    return this.request<{ id: string }>(`/sessions/${sessionId}/clone`, { method: 'POST' });
  }

  async deleteSession(sessionId: string) {
    return this.request<{ status: string }>(`/sessions/${sessionId}`, { method: 'DELETE' });
  }

  async getMessages(sessionId: string) {
    return this.request<Message[]>(`/sessions/${sessionId}/messages`);
  }

  async sendMessage(sessionId: string, payload: MessageRequest) {
    return this.request<QueryResponse>(`/sessions/${sessionId}/messages`, { method: 'POST', body: payload });
  }

  async pinMessage(sessionId: string, messageId: string, pinned: boolean) {
    return this.request<{ status: string; pinned: boolean }>(
      `/sessions/${sessionId}/messages/${messageId}/pin?pinned=${pinned}`,
      { method: 'PATCH' }
    );
  }

  async getDocuments(sessionId?: string) {
    const query = sessionId ? `?session_id=${sessionId}` : '';
    return this.request<Document[]>(`/documents${query}`);
  }

  async uploadDocument(sessionId: string, file: File, isTemp: boolean = false): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('session_id', sessionId);
    formData.append('file', file);
    formData.append('is_temp', String(isTemp));

    const url = `${API_URL}/upload`;
    const headers: Record<string, string> = {};
    if (this.idToken) {
      headers['Authorization'] = `Bearer ${this.idToken}`;
    }

    try {
      const response = await fetch(url, { method: 'POST', headers, body: formData });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        throw { status: response.status, detail: error.detail || 'Upload failed' } as APIError;
      }
      return response.json();
    } catch (error) {
      if (error instanceof TypeError) {
        throw { status: 0, detail: 'Network error during upload' } as APIError;
      }
      throw error;
    }
  }

  async previewDocument(docId: string) {
    return this.request<{ text?: string; filename: string; mime: string }>(`/documents/${docId}/preview`);
  }

  async deleteDocument(docId: string) {
    return this.request<{ status: string }>(`/documents/${docId}`, { method: 'DELETE' });
  }

  async exportSession(sessionId: string) {
    const url = `${API_URL}/sessions/${sessionId}/export`;
    const headers: Record<string, string> = {};
    if (this.idToken) {
      headers['Authorization'] = `Bearer ${this.idToken}`;
    }
    try {
      const response = await fetch(url, { headers });
      if (!response.ok) {
        throw { status: response.status, detail: 'Export failed' } as APIError;
      }
      return response.text();
    } catch (error) {
      if (error instanceof TypeError) {
        throw { status: 0, detail: 'Network error during export' } as APIError;
      }
      throw error;
    }
  }

  async clearUserData() {
    return this.request<{ status: string; message: string }>('/clear', { method: 'DELETE' });
  }

  async getStats() {
    return this.request<any>('/stats');
  }
}

export const apiClient = new APIClient();
