import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useSession } from '@/hooks/useSession';
import { useMessages } from '@/hooks/useMessages';
import { useDocuments } from '@/hooks/useDocuments';
import { useIsMobile } from '@/hooks/useMobile';
import { apiClient } from '@/services/api';
import { formatDate, formatFileSize, truncate } from '@/lib/utils';
import type { MessageRequest, Message } from '@/types';
import ReactMarkdown from 'react-markdown';

interface WorkspacePageProps {
  onBack: () => void;
}

export function WorkspacePage({ onBack }: WorkspacePageProps) {
  const { user, logout, isAuthenticated } = useAuth();
  const { sessions, activeSessionId, createSession, renameSession, deleteSession, selectSession,  autoNameSession  } = useSession(isAuthenticated);
  // Simple callback for auto-naming - no useCallback needed to avoid circular deps
  const handleFirstMessage = (message: string) => {
    if (activeSessionId) {
      autoNameSession(activeSessionId, message);
    }
  };
  const { messages, isLoading: messagesLoading, isSending, sendMessage, clearMessages } = useMessages(activeSessionId,handleFirstMessage);
  const { documents, uploads, uploadDocument, deleteDocument, clearDocuments } = useDocuments(activeSessionId);
  const isMobile = useIsMobile();

  const [inputValue, setInputValue] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [docPanelOpen, setDocPanelOpen] = useState(false);
  const [mode, setMode] = useState<'strict' | 'hybrid'>('hybrid');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-close sidebar and doc panel on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
      setDocPanelOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus input
  useEffect(() => {
    if (activeSessionId && !isSending) {
      inputRef.current?.focus();
    }
  }, [activeSessionId, isSending]);

  // Reset file input when session changes
  useEffect(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [activeSessionId]);

  const handleSend = async () => {
    if (!inputValue.trim() || !activeSessionId || isSending) return;
    const question = inputValue;
    setInputValue('');
    try {
      await sendMessage({ question, mode, explain_simpler: false } as MessageRequest);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || !activeSessionId) return;
    for (const file of Array.from(files)) {
      try {
        await uploadDocument(file, false);
      } catch (err) {
        console.error('Upload failed:', err);
      }
    }
  }, [activeSessionId, uploadDocument]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const handleExport = async () => {
    if (!activeSessionId) return;
    try {
      const markdown = await apiClient.exportSession(activeSessionId);
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-export-${new Date().toISOString().split('T')[0]}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleClearAll = async () => {
  if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
    try {
      await apiClient.clearUserData();
      // Don't call clearMessages() or clearDocuments() - just reload
      window.location.reload();

      window.location.reload();
    } catch (err) {
      console.error('Clear failed:', err);
    }
  }
};

  const startRename = (sessionId: string, currentName: string) => {
    setEditingSessionId(sessionId);
    setEditName(currentName);
  };

  const confirmRename = async () => {
    if (editingSessionId && editName.trim()) {
      await renameSession(editingSessionId, editName.trim());
      setEditingSessionId(null);
    }
  };

  const handleSessionSelect = useCallback((sessionId: string) => {
    selectSession(sessionId);
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [selectSession, isMobile]);

  return (
    <div className="h-screen flex overflow-hidden bg-[#030014] relative" style={{ height: isMobile ? '100dvh' : '100vh' }}>
      {/* Sidebar - OVERLAPS on mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={`h-full border-r border-white/5 bg-[#050118]/80 backdrop-blur-xl flex flex-col overflow-hidden ${
              isMobile ? 'fixed inset-y-0 left-0 z-50 w-[280px]' : 'flex-shrink-0 w-[280px]'
            }`}
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b border-white/5">
              <div className="flex items-center justify-between mb-4">
                <button onClick={onBack} className="flex items-center gap-2 group">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <span className="text-sm font-bold text-white">NexusRAG</span>
                </button>
                <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18" />
                  </svg>
                </button>
              </div>
              <motion.button
                onClick={() => createSession('New Chat')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/20 text-violet-300 text-sm font-medium transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 5v14" /><path d="M5 12h14" />
                </svg>
                New Chat
              </motion.button>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {sessions.map((session) => (
                <motion.div
                  key={session.id}
                  layout
                  className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                    activeSessionId === session.id
                      ? 'bg-violet-500/10 border border-violet-500/20'
                      : 'hover:bg-white/[0.03] border border-transparent'
                  }`}
                  onClick={() => handleSessionSelect(session.id)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={activeSessionId === session.id ? 'text-violet-400' : 'text-slate-500'}>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>

                  {editingSessionId === session.id ? (
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={confirmRename}
                      onKeyDown={(e) => { if (e.key === 'Enter') confirmRename(); if (e.key === 'Escape') setEditingSessionId(null); }}
                      className="flex-1 bg-transparent text-sm text-white outline-none border-b border-violet-500/50"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className={`flex-1 text-sm truncate ${activeSessionId === session.id ? 'text-white' : 'text-slate-400'}`}>
                      {session.name}
                    </span>
                  )}

                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); startRename(session.id, session.name); }}
                      className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); if (window.confirm('Delete this session?')) deleteSession(session.id); }}
                      className="p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              ))}

              {sessions.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No sessions yet. Create one to start.
                </div>
              )}
            </div>

            {/* User Section */}
            <div className="p-3 border-t border-white/5">
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    {(user?.displayName || user?.email || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-sm font-medium text-white truncate">{user?.displayName || 'User'}</div>
                    <div className="text-xs text-slate-500 truncate">{user?.email}</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-slate-500 flex-shrink-0">
                    <path d="m18 15-6-6-6 6" />
                  </svg>
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute bottom-full left-0 right-0 mb-2 glass rounded-xl p-1.5 shadow-xl"
                    >
                      <button onClick={handleExport} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                        Export Chat
                      </button>
                      <button onClick={handleClearAll} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /></svg>
                        Clear All Data
                      </button>
                      <div className="my-1 border-t border-white/5" />
                      <button onClick={() => { logout(); setUserMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-white/5 hover:text-white transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Top Bar */}
        <div className="flex-shrink-0 h-14 border-b border-white/5 flex items-center justify-between px-3 md:px-4 bg-[#030014]/60 backdrop-blur-sm">
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18" />
                </svg>
              </button>
            )}
            <h2 className="text-sm font-medium text-white truncate">
              {sessions.find(s => s.id === activeSessionId)?.name || 'Select a session'}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
            {/* Mode Toggle */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5">
              <button
                onClick={() => setMode('strict')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${mode === 'strict' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                Strict
              </button>
              <button
                onClick={() => setMode('hybrid')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 ${mode === 'hybrid' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                Hybrid
              </button>
            </div>

            {/* Document Panel Toggle */}
            <button
              onClick={() => setDocPanelOpen(!docPanelOpen)}
              className={`p-2 rounded-lg transition-colors relative ${docPanelOpen ? 'bg-violet-500/20 text-violet-400' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              {documents.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-violet-500 text-[10px] font-bold text-white flex items-center justify-center">
                  {documents.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Chat + Document Panel */}
        <div className="flex-1 flex overflow-hidden min-h-0 relative">
          {/* Chat Area */}
          <div
            className="flex-1 flex flex-col min-w-0"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
              {!activeSessionId ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-4">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-violet-400">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No Session Selected</h3>
                    <p className="text-sm text-slate-400 mb-4">Create a new chat to start asking questions</p>
                    <div className="flex items-center gap-2 justify-center">
                      <button onClick={() => createSession('New Chat')} className="btn-primary text-sm py-2 px-5">
                        Create New Chat
                      </button>
                      {isMobile && !sidebarOpen && (
                        <button onClick={() => setSidebarOpen(true)} className="btn-secondary text-sm py-2 px-4">
                          Open Menu
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : messages.length === 0 && !messagesLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center max-w-md">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600/20 to-blue-600/20 border border-violet-500/20 flex items-center justify-center mx-auto mb-6">
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-violet-400">
                        <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Welcome to NexusRAG</h3>
                    <p className="text-sm text-slate-400 mb-6">Upload documents and ask questions to get AI-powered answers with source citations.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {['What are the key findings?', 'Summarize the document', 'Explain the methodology', 'Compare the results'].map((q, i) => (
                        <button
                          key={i}
                          onClick={() => { setInputValue(q); inputRef.current?.focus(); }}
                          className="p-3 rounded-xl glass-light text-left text-sm text-slate-300 hover:text-white hover:bg-white/[0.04] transition-all duration-200"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="max-w-3xl mx-auto space-y-6">
                  {messages.filter(m => m.role !== 'user-edit').map((msg, i) => (
                    <MessageBubble key={msg.id || i} message={msg} />
                  ))}

                  {isSending && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center flex-shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                          <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                        </svg>
                      </div>
                      <div className="p-4 rounded-2xl glass">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area */}
            {activeSessionId && (
              <div className="flex-shrink-0 p-4 border-t border-white/5">
                <div className="max-w-3xl mx-auto">
                  <div className="relative glass rounded-2xl p-1">
                    <textarea
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask a question about your documents..."
                      rows={1}
                      className="w-full bg-transparent text-white text-sm px-4 py-3 pr-24 resize-none outline-none placeholder:text-slate-500"
                      style={{ minHeight: '44px', maxHeight: '120px' }}
                      disabled={isSending}
                    />
                    <div className="absolute right-2 bottom-2 flex items-center gap-1.5">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                        title="Upload document"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                        </svg>
                      </button>
                      <motion.button
                        onClick={handleSend}
                        disabled={!inputValue.trim() || isSending}
                        className="p-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                        whileHover={{ scale: inputValue.trim() && !isSending ? 1.05 : 1 }}
                        whileTap={{ scale: inputValue.trim() && !isSending ? 0.95 : 1 }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                      </motion.button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.txt,.docx,.html,.htm,.png,.jpg,.jpeg,.heic,.webp,.bmp,.tiff,.tif"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e.target.files)}
                    />
                  </div>
                  <p className="text-xs text-slate-600 mt-2 text-center">
                    Mode: <span className="text-slate-400">{mode === 'strict' ? 'Strict (document-only)' : 'Hybrid (documents + AI)'}</span> — Press Enter to send, Shift+Enter for new line
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Document Panel - OVERLAPS on mobile */}
          <AnimatePresence>
            {docPanelOpen && activeSessionId && (
              <motion.div
                initial={{ x: 320, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 320, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className={`h-full border-l border-white/5 bg-[#050118]/60 backdrop-blur-sm flex flex-col overflow-hidden ${
                  isMobile ? 'fixed inset-y-0 right-0 z-50 w-[320px]' : 'flex-shrink-0 w-[320px]'
                }`}
              >
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Documents</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 text-xs font-medium transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M12 5v14" /><path d="M5 12h14" />
                      </svg>
                      Upload
                    </button>
                    {isMobile && (
                      <button
                        onClick={() => setDocPanelOpen(false)}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M18 6L6 18" /><path d="M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {/* Upload Progress */}
                  {Array.from(uploads.values()).map((upload) => (
                    <div key={upload.docId} className="p-3 rounded-xl glass-light">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-slate-300 truncate">{upload.filename}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/5">
                        <div className="h-full rounded-full bg-violet-500 transition-all duration-300" style={{ width: `${Math.min(upload.progress, 100)}%` }} />
                      </div>
                    </div>
                  ))}

                  {/* Documents */}
                  {documents.map((doc) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group p-3 rounded-xl glass-light hover:bg-white/[0.04] transition-all duration-200"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-violet-400">
                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{doc.filename}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{formatFileSize(doc.size_bytes)} — {formatDate(doc.created_at)}</p>
                          {doc.is_temp && <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20">Temporary</span>}
                        </div>
                        <button
                          onClick={() => { if (window.confirm(`Delete ${doc.filename}?`)) deleteDocument(doc.id); }}
                          className="p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          </svg>
                        </button>
                      </div>
                    </motion.div>
                  ))}

                  {documents.length === 0 && uploads.size === 0 && (
                    <div className="text-center py-12">
                      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-3">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-slate-500">
                          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                          <polyline points="14 2 14 8 20 8" />
                          <path d="M12 18v-6" /><path d="m9 15 3-3 3 3" />
                        </svg>
                      </div>
                      <p className="text-sm text-slate-500">No documents yet</p>
                      <p className="text-xs text-slate-600 mt-1">Upload files or drag & drop</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile Document Panel Overlay */}
          <AnimatePresence>
            {isMobile && docPanelOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                onClick={() => setDocPanelOpen(false)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* Message Bubble Component */
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
        isUser
          ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
          : 'bg-gradient-to-br from-violet-600 to-blue-500'
      }`}>
        {isUser ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
          </svg>
        )}
      </div>

      {/* Content */}
      <div className={`max-w-[80%] ${isUser ? 'text-right' : ''}`}>
        <div className={`inline-block p-4 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-violet-600/20 border border-violet-500/20 text-white'
            : 'glass text-slate-200'
        }`}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="markdown-content">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Metadata */}
        {!isUser && message.metadata?.supported_by_documents && (
          <div className="flex items-center gap-1.5 mt-1.5 ml-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-emerald-400">
              <path d="m9 12 2 2 4-4" /><circle cx="12" cy="12" r="10" />
            </svg>
            <span className="text-xs text-emerald-400/80">Grounded in documents</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
