import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Send,
  Plus,
  Trash2,
  Copy,
  Check,
  FileText,
  ChevronDown,
  Download,
  Paperclip,
  Sun,
  Moon,
  Monitor,
  Sparkles,
  FileSpreadsheet,
  BookOpen,
  SlidersHorizontal,
  Clock,
  Menu,
  X,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSession } from '@/hooks/useSession';
import { useMessages } from '@/hooks/useMessages';
import { useDocuments } from '@/hooks/useDocuments';
import { useDevice } from '@/hooks/useMobile';
import { apiClient } from '@/services/api';
import type { ModelInfo, MessageRequest, SourceCitation } from '@/types';
import { ModelSelectorDropdown } from '@/components/shared/ModelSelectorDropdown';
import { CitationDrawer } from '@/components/workspace/CitationDrawer';
import { DocumentVaultModal } from '@/components/workspace/DocumentVaultModal';
import { MobileBottomNav, type MobileTab } from '@/components/workspace/MobileBottomNav';
import { MobileModelSheet } from '@/components/workspace/MobileModelSheet';
import { MobileSessionsSheet } from '@/components/workspace/MobileSessionsSheet';

interface WorkspacePageProps {
  onBack: () => void;
}

type SynthesisObjective = 'brief' | 'academic' | 'extraction' | 'chat';

const OBJECTIVE_CONFIG: Record<SynthesisObjective, { label: string; icon: any; prefix: string; desc: string }> = {
  brief: {
    label: 'Executive Brief',
    icon: Sparkles,
    prefix: '[OBJECTIVE: Executive Decision Memo. Format with Executive Summary, 3-5 Critical Findings, and Risk/Action Items]\n\n',
    desc: 'High-level synthesis formatted for decision makers with risks and takeaways.',
  },
  academic: {
    label: 'Deep Analysis',
    icon: BookOpen,
    prefix: '[OBJECTIVE: Exhaustive Analytical Synthesis. Synthesize cross-document evidence, highlight nuances and citations]\n\n',
    desc: 'In-depth rigorous investigation with extensive document cross-referencing.',
  },
  extraction: {
    label: 'KPI & Tables',
    icon: FileSpreadsheet,
    prefix: '[OBJECTIVE: Data & KPI Extraction. Extract all dates, metrics, percentages, and deliverables into markdown tables]\n\n',
    desc: 'Structured extraction of numerical metrics, deadlines, and deliverables into tables.',
  },
  chat: {
    label: 'Standard Dialogue',
    icon: FileText,
    prefix: '',
    desc: 'Direct conversational Q&A grounded in uploaded context.',
  },
};

export function WorkspacePage({ onBack }: WorkspacePageProps) {
  const { user, logout, isAuthenticated } = useAuth();
  const { mode: themeMode, setMode: setThemeMode } = useTheme();
  const { isMobile, isTablet } = useDevice();

  const {
    sessions,
    activeSessionId,
    createSession,
    renameSession,
    deleteSession,
    selectSession,
    autoNameSession,
  } = useSession(isAuthenticated);

  const handleFirstMessage = (message: string) => {
    if (activeSessionId) {
      autoNameSession(activeSessionId, message);
    }
  };

  const { messages, isLoading: messagesLoading, isSending, sendMessage } = useMessages(
    activeSessionId,
    handleFirstMessage
  );
  const { documents, uploadDocument, deleteDocument, isUploading } = useDocuments(activeSessionId);

  // Model selection state
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('google/gemini-2.0-flash-001');

  // UI States
  const [inputValue, setInputValue] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile && !isTablet);
  const [docVaultOpen, setDocVaultOpen] = useState(false);
  const [mobileModelOpen, setMobileModelOpen] = useState(false);
  const [mobileSessionsOpen, setMobileSessionsOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('canvas');
  const [selectedCitation, setSelectedCitation] = useState<SourceCitation | null>(null);
  const [synthesisObjective, setSynthesisObjective] = useState<SynthesisObjective>('brief');
  const [strictMode, setStrictMode] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch models catalog on mount
  useEffect(() => {
    async function loadModels() {
      try {
        const data = await apiClient.getModels();
        if (data && data.models && data.models.length > 0) {
          setModels(data.models);
          if (data.active_model) {
            setSelectedModelId(data.active_model);
          }
        }
      } catch (err) {
        console.warn('Failed to load models catalog:', err);
      }
    }
    loadModels();
  }, []);

  // Auto-scroll on message changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, isMobile ? 120 : 180)}px`;
    }
  };

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isSending) return;

    const prefix = OBJECTIVE_CONFIG[synthesisObjective].prefix;
    const fullQuery = prefix ? `${prefix}${trimmed}` : trimmed;

    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      await sendMessage({
        question: fullQuery,
        mode: strictMode ? 'strict' : 'hybrid',
        model: selectedModelId,
      });
    } catch (e) {
      console.error('Send message error:', e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportMarkdown = (content: string, filename = 'nexus_synthesis.md') => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleClearAllData = async () => {
    if (!window.confirm('Wipe all uploaded documents and vectors for this session? This action cannot be undone.')) {
      return;
    }
    setIsClearing(true);
    try {
      await apiClient.clearUserData();
      window.location.reload();
    } catch (e) {
      alert('Failed to clear user data: ' + e);
    } finally {
      setIsClearing(false);
    }
  };

  const handlePresetClick = (presetQuery: string) => {
    setInputValue(presetQuery);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleMobileTabChange = (tab: MobileTab) => {
    setMobileTab(tab);
    if (tab === 'vault') {
      setDocVaultOpen(true);
    } else if (tab === 'sessions') {
      setMobileSessionsOpen(true);
    }
  };

  const activeModel = models.find((m) => m.id === selectedModelId) || {
    id: selectedModelId,
    name: selectedModelId.split('/').pop() || 'Gemini 2.0 Flash',
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground transition-colors duration-200 overflow-hidden font-sans select-none sm:select-auto">
      {/* Top Workspace Bar */}
      <header className="h-14 sm:h-16 border-b border-border bg-background/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between z-20 flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onBack}
            className="p-1.5 sm:p-2 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Back to Overview"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Toggle sidebar button on tablets */}
          {isTablet && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-md border border-border text-foreground hover:bg-secondary"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-sm tracking-tight hidden sm:inline">
              NexusRAG
            </span>
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              Studio
            </span>
          </div>
        </div>

        {/* Center: Model Selector (Desktop: Dropdown, Mobile: Bottom Sheet Trigger) */}
        <div className="flex items-center gap-2">
          {isMobile ? (
            <button
              onClick={() => setMobileModelOpen(true)}
              type="button"
              className="px-2.5 py-1 rounded-md border border-border bg-card text-xs font-mono font-semibold flex items-center gap-1.5 truncate max-w-[160px]"
            >
              <span className="truncate">{activeModel.name}</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            </button>
          ) : (
            <ModelSelectorDropdown
              models={models}
              selectedModelId={selectedModelId}
              onSelectModel={setSelectedModelId}
              compact
            />
          )}

          <button
            onClick={() => setStrictMode(!strictMode)}
            title={strictMode ? 'Strict Distance Gating (< 0.75 cutoff)' : 'Hybrid Search'}
            className={`px-2.5 py-1 rounded-md text-xs font-mono uppercase tracking-wider border transition-colors hidden sm:flex items-center gap-1.5 ${
              strictMode
                ? 'bg-foreground text-background border-foreground font-semibold'
                : 'bg-card text-muted-foreground border-border hover:text-foreground'
            }`}
          >
            <span>{strictMode ? 'Strict' : 'Hybrid'}</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Desktop Vault Trigger */}
          <button
            onClick={() => setDocVaultOpen(true)}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-secondary/80 hover:bg-secondary text-foreground text-xs font-mono tracking-wider transition-colors"
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span>Vault ({documents.length})</span>
          </button>

          {/* Theme Selector Button */}
          <div className="flex items-center p-0.5 rounded-full border border-border bg-secondary/60">
            <button
              onClick={() => setThemeMode('light')}
              title="Light Mode"
              className={`p-1 sm:p-1.5 rounded-full transition-colors ${themeMode === 'light' ? 'bg-foreground text-background' : 'text-muted-foreground'}`}
            >
              <Sun className="w-3 h-3" />
            </button>
            <button
              onClick={() => setThemeMode('system')}
              title="System Theme"
              className={`p-1 sm:p-1.5 rounded-full transition-colors ${themeMode === 'system' ? 'bg-foreground text-background' : 'text-muted-foreground'}`}
            >
              <Monitor className="w-3 h-3" />
            </button>
            <button
              onClick={() => setThemeMode('dark')}
              title="Dark Mode"
              className={`p-1 sm:p-1.5 rounded-full transition-colors ${themeMode === 'dark' ? 'bg-foreground text-background' : 'text-muted-foreground'}`}
            >
              <Moon className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={handleClearAllData}
            disabled={isClearing}
            title="Clear all documents & vectors"
            className="p-1.5 sm:p-2 rounded-md border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sessions Sidebar (Desktop & Tablet Landscape) */}
        {!isMobile && (
          <aside
            className={`${
              sidebarOpen ? 'w-60 lg:w-64' : 'w-0'
            } border-r border-border bg-card/40 flex flex-col transition-all duration-200 overflow-hidden flex-shrink-0`}
          >
            <div className="p-3 border-b border-border flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Dossiers ({sessions.length})
              </span>
              <button
                onClick={() => createSession()}
                className="p-1.5 rounded hover:bg-secondary text-foreground"
                title="New Session"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {sessions.map((sess) => (
                <button
                  key={sess.id}
                  onClick={() => selectSession(sess.id)}
                  className={`w-full text-left p-2.5 rounded-md text-xs truncate transition-colors flex items-center justify-between group ${
                    sess.id === activeSessionId
                      ? 'bg-secondary font-semibold text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                  }`}
                >
                  <span className="truncate">{sess.name || 'Untitled Session'}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(sess.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </button>
              ))}
            </div>
          </aside>
        )}

        {/* Center Synthesis Canvas & Chat Stream */}
        <main className="flex-1 flex flex-col bg-background overflow-hidden relative">
          {/* Synthesis Objective Bar (Scrollable Snap Pills on touch devices) */}
          <div className="border-b border-border bg-secondary/30 px-3 sm:px-4 py-2 flex items-center gap-2 overflow-x-auto text-xs scrollbar-none">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex-shrink-0">
              Objective:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto flex-nowrap">
              {(Object.keys(OBJECTIVE_CONFIG) as SynthesisObjective[]).map((key) => {
                const cfg = OBJECTIVE_CONFIG[key];
                const Icon = cfg.icon;
                const isSel = synthesisObjective === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSynthesisObjective(key)}
                    className={`px-2.5 py-1.5 rounded text-xs flex items-center gap-1.5 whitespace-nowrap min-h-[32px] transition-colors ${
                      isSel
                        ? 'bg-foreground text-background font-semibold shadow-xs'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className={`flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6 ${isMobile ? 'pb-24' : ''}`}>
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-5 py-6 sm:py-12 px-2">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-foreground text-background flex items-center justify-center font-mono font-bold text-base sm:text-lg">
                  N
                </div>

                <div className="space-y-1.5">
                  <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight">
                    Document Intelligence Canvas
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Upload documents to your session vault, select an OpenRouter model, and query with verified cosine distance grounding.
                  </p>
                </div>

                {/* Instant Catalysts */}
                <div className="w-full space-y-2 text-left pt-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block">
                    Instant Synthesis Catalysts:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      onClick={() => handlePresetClick('Draft an executive briefing summarizing top decisions, core findings, and next actions.')}
                      className="p-3 rounded-md border border-border bg-card hover:border-foreground/40 text-left transition-colors text-xs active:scale-[0.99]"
                    >
                      <span className="font-semibold block mb-0.5">Executive One-Pager</span>
                      <span className="text-[11px] text-muted-foreground">Summarize decisions & top findings</span>
                    </button>
                    <button
                      onClick={() => handlePresetClick('Extract all financial figures, dates, percentages, and KPIs into a structured markdown table.')}
                      className="p-3 rounded-md border border-border bg-card hover:border-foreground/40 text-left transition-colors text-xs active:scale-[0.99]"
                    >
                      <span className="font-semibold block mb-0.5">KPI & Table Extraction</span>
                      <span className="text-[11px] text-muted-foreground">Isolate numbers, dates & milestones</span>
                    </button>
                    <button
                      onClick={() => handlePresetClick('Audit the documents for risks, compliance liabilities, and non-standard covenants.')}
                      className="p-3 rounded-md border border-border bg-card hover:border-foreground/40 text-left transition-colors text-xs active:scale-[0.99]"
                    >
                      <span className="font-semibold block mb-0.5">Risk & Liability Audit</span>
                      <span className="text-[11px] text-muted-foreground">Examine legal & operational risks</span>
                    </button>
                    <button
                      onClick={() => handlePresetClick('Identify any contradictory statements or ambiguous clauses across the ingested files.')}
                      className="p-3 rounded-md border border-border bg-card hover:border-foreground/40 text-left transition-colors text-xs active:scale-[0.99]"
                    >
                      <span className="font-semibold block mb-0.5">Contradiction Detection</span>
                      <span className="text-[11px] text-muted-foreground">Flag factual divergence in text</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`w-full sm:max-w-3xl rounded-lg p-3.5 sm:p-5 space-y-2.5 ${
                        isUser
                          ? 'bg-foreground text-background ml-4 sm:ml-12'
                          : 'bg-card border border-border text-foreground mr-4 sm:mr-12'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono opacity-60 border-b border-current/10 pb-2">
                        <span>{isUser ? 'Inquiry' : `Synthesis (${msg.model_used || selectedModelId.split('/').pop()})`}</span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleCopy(msg.id, msg.content)}
                            title="Copy text"
                            className="hover:opacity-100 flex items-center gap-1 p-1 min-h-[28px]"
                          >
                            {copiedId === msg.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                          </button>
                          {!isUser && (
                            <button
                              onClick={() => handleExportMarkdown(msg.content)}
                              title="Download Markdown"
                              className="hover:opacity-100 flex items-center gap-1 p-1 min-h-[28px]"
                            >
                              <Download className="w-3 h-3" />
                              <span>MD</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className={isUser ? 'text-xs sm:text-sm font-medium leading-relaxed' : 'markdown-content'}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>

                      {/* Citations */}
                      {!isUser && msg.sources && msg.sources.length > 0 && (
                        <div className="pt-2.5 border-t border-border space-y-1.5">
                          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block">
                            Grounding Citations ({msg.sources.length}):
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.sources.map((src, i) => (
                              <button
                                key={i}
                                onClick={() => setSelectedCitation(src)}
                                className="px-2 py-1 rounded bg-secondary text-[11px] font-mono border border-border text-foreground hover:border-foreground/50 transition-colors flex items-center gap-1.5 truncate max-w-full sm:max-w-xs min-h-[28px]"
                              >
                                <FileText className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                <span className="truncate">{src.document_name}</span>
                                {src.distance !== undefined && (
                                  <span className="text-muted-foreground text-[9px]">
                                    ({src.distance.toFixed(2)})
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {isSending && (
              <div className="flex justify-start">
                <div className="max-w-md rounded-lg p-3.5 bg-card border border-border text-foreground space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-foreground animate-ping" />
                    <span>Executing Nearest Neighbor Retrieval & Frontier Inference...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Query Composer (Mobile: raised above bottom nav) */}
          <div className={`p-3 sm:p-4 border-t border-border bg-background ${isMobile ? 'mb-14' : ''}`}>
            <div className="max-w-4xl mx-auto rounded-lg border border-border bg-card p-2 focus-within:border-foreground transition-colors shadow-xs">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleTextareaInput}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Ask a question or paste document text..."
                className="w-full bg-transparent text-foreground text-xs sm:text-sm resize-none focus:outline-none px-2 py-1 placeholder:text-muted-foreground max-h-32 sm:max-h-44"
              />
              <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDocVaultOpen(true)}
                    className="flex items-center gap-1 hover:text-foreground transition-colors min-h-[32px] px-1"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span className="text-xs">Vault</span>
                  </button>
                  <span className="text-muted-foreground">&bull;</span>
                  <span className="font-mono text-[10px]">
                    {documents.length} doc{documents.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isSending}
                    className="px-3.5 py-1.5 rounded-md bg-foreground text-background font-semibold text-xs disabled:opacity-40 transition-opacity flex items-center gap-1.5 min-h-[32px]"
                  >
                    <span>Synthesize</span>
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Rendered on phones < 768px) */}
      {isMobile && (
        <MobileBottomNav
          activeTab={mobileTab}
          onTabChange={handleMobileTabChange}
          documentCount={documents.length}
          sessionCount={sessions.length}
          onNewSession={() => createSession()}
        />
      )}

      {/* Mobile Model Sheet */}
      <MobileModelSheet
        isOpen={mobileModelOpen}
        onClose={() => setMobileModelOpen(false)}
        models={models}
        selectedModelId={selectedModelId}
        onSelectModel={setSelectedModelId}
      />

      {/* Mobile Sessions Sheet */}
      <MobileSessionsSheet
        isOpen={mobileSessionsOpen}
        onClose={() => setMobileSessionsOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={selectSession}
        onCreateSession={() => createSession()}
        onDeleteSession={deleteSession}
      />

      {/* Document Vault Modal / Sheet */}
      <DocumentVaultModal
        isOpen={docVaultOpen}
        onClose={() => setDocVaultOpen(false)}
        documents={documents}
        onUpload={uploadDocument}
        onDelete={deleteDocument}
        isUploading={isUploading}
      />

      {/* Responsive Citation Drawer */}
      <CitationDrawer
        citation={selectedCitation}
        onClose={() => setSelectedCitation(null)}
      />
    </div>
  );
}
