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

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  context_length: number;
  description: string;
  badge: string;
  is_default?: boolean;
}

export interface ModelsResponse {
  active_model: string;
  models: ModelInfo[];
  has_openrouter_key: boolean;
}

export interface MessageMetadata {
  sources?: SourceCitation[];
  confidence?: { score: number; label: string } | Record<string, any>;
  supported_by_documents?: boolean;
  mode?: 'strict' | 'hybrid';
  model_used?: string;
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
  sources?: SourceCitation[];
  model_used?: string;
}

export interface SourceCitation {
  source?: string;
  chunk?: number;
  id?: string;
  snippet?: string;
  distance?: number;
  text?: string;
  relevance?: number;
  document_name?: string;
  chunk_index?: number;
  content?: string;
}

export interface Document {
  id: string;
  filename: string;
  mime: string;
  size_bytes: number;
  file_size?: number;
  chunk_count?: number;
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
  confidence: { score: number; label: string } | Record<string, any>;
  mode: 'strict' | 'hybrid';
  model_used?: string;
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
  explain_simpler?: boolean;
  replace_message_id?: string;
  model?: string;
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
