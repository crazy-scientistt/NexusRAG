export interface User {
  uid: string;
  email?: string;
  displayName?: string;
}

export interface Session {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
}

export interface MessageMetadata {
  sources?: SourceCitation[];
  confidence?: Record<string, number>;
  supported_by_documents?: boolean;
  mode?: 'strict' | 'hybrid';
  target?: string;
}

export interface Message {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'user-edit';
  content: string;
  metadata?: MessageMetadata;
  created_at: string;
  pinned?: boolean;
  parent_id?: string;
}

export interface SourceCitation {
  source: string;
  chunk: number;
  text?: string;
  relevance?: number;
}

export interface Document {
  id: string;
  filename: string;
  mime: string;
  size_bytes: number;
  is_temp: boolean;
  expires_at?: string;
  created_at: string;
  session_id: string;
}

export interface QueryResponse {
  question: string;
  response: string;
  sources: SourceCitation[];
  num_sources: number;
  supported_by_documents: boolean;
  confidence: Record<string, number>;
  mode: 'strict' | 'hybrid';
  retrieval_ms: number;
  generation_ms: number;
}

export interface UploadResponse {
  status: string;
  message: string;
  filename: string;
  doc_id: string;
  expires_at?: string;
}

export interface SessionCreateRequest {
  name?: string;
  clone_from?: string;
}

export interface MessageRequest {
  question: string;
  mode: 'strict' | 'hybrid';
  explain_simpler: boolean;
  replace_message_id?: string;
}

export interface APIError {
  status: number;
  detail: string;
  message?: string;
}

export interface UploadProgress {
  docId: string;
  filename: string;
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}
