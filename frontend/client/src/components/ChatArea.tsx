/**
 * ChatArea Component
 * Main conversation interface with message list and input
 * Handles message rendering, scrolling, and document preview
 */

import { useEffect, useRef } from 'react';
import { Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Message } from './Message';
import { InputArea } from './InputArea';
import { DocumentPanel } from './DocumentPanel';
import type { Message as MessageType } from '@/types';
import type { FC } from 'react';

interface ChatAreaProps {
  messages: MessageType[];
  documents: any[];
  uploads: Map<string, any>;
  isLoading: boolean;
  isSending: boolean;
  explainSimpler: boolean;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onExplainSimpler: (enabled: boolean) => void;
  onUpload: (file: File, isTemp: boolean) => Promise<void>;
  onDeleteDocument: (docId: string) => void;
  onPreviewDocument: (docId: string) => void;
  onPinMessage: (messageId: string, pinned: boolean) => void;
  onExportSession: () => void;
  onClearChat: () => void;
  documentError: string | null;
  messageError: string | null;
}

export const ChatArea: FC<ChatAreaProps> = ({
  messages,
  documents,
  uploads,
  isLoading,
  isSending,
  explainSimpler,
  inputValue,
  onInputChange,
  onSendMessage,
  onExplainSimpler,
  onUpload,
  onDeleteDocument,
  onPreviewDocument,
  onPinMessage,
  onExportSession,
  onClearChat,
  documentError,
  messageError,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="relative z-10 flex-1 flex flex-col h-[100dvh] min-h-0 bg-transparent">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-slate-200 bg-white/95 dark:border-slate-700 dark:bg-slate-900/95 backdrop-blur-xl px-4 sm:px-6 py-3 sm:py-4 transition-all duration-300">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-semibold truncate text-slate-900 dark:text-white">
              {messages.length === 0 ? 'New Conversation' : 'Chat'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 truncate">
              {documents.length} doc{documents.length !== 1 ? 's' : ''} • {messages.length} msg{messages.length !== 1 ? 's' : ''} • Model: Qwen3-4B-Instruct
            </p>
          </div>

          <div className="flex gap-1 sm:gap-2 flex-shrink-0 transition-all duration-300">
            {messages.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onExportSession}
                  className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
                >
                  <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearChat}
                  className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Clear</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Mobile optimized */}
      <div className="flex-1 flex flex-col lg:flex-row gap-0 lg:gap-6 overflow-hidden min-h-0 transition-all duration-300">
        {/* Messages Area - Full width on mobile */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-white/5 dark:bg-slate-900/30 lg:border lg:border-slate-300 dark:lg:border-white/10 lg:rounded-2xl lg:backdrop-blur-xl lg:shadow-xl lg:m-6 lg:mb-0 transition-all duration-300">
          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 lg:px-6 py-4 lg:py-6 scroll-smooth transition-all duration-300">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
                  <span className="text-white text-xl sm:text-2xl font-bold">C</span>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  Welcome to Cloud RAG
                </h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-md mb-4 sm:mb-6">
                  Upload documents and ask questions. The AI will answer based on your documents.
                </p>
                <div className="flex gap-2 flex-wrap justify-center text-xs sm:text-sm">
                  <span className="px-2 sm:px-3 py-1 bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white rounded-full backdrop-blur">
                    📄 Upload documents
                  </span>
                  <span className="px-2 sm:px-3 py-1 bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white rounded-full backdrop-blur">
                    💬 Ask questions
                  </span>
                  <span className="px-2 sm:px-3 py-1 bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white rounded-full backdrop-blur">
                    📊 Get insights
                  </span>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div key={message.id} className="group">
                    <Message
                      message={message}
                      onPin={onPinMessage}
                      isLoading={isSending && message === messages[messages.length - 1]}
                    />
                  </div>
                ))}
                {isSending && (
                  <div className="flex gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs sm:text-sm font-bold">C</span>
                    </div>
                    <div className="flex-1">
                      <div className="bg-slate-100 dark:bg-slate-800 rounded-lg px-3 sm:px-4 py-2 sm:py-3">
                        <div className="flex gap-2">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100" />
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/90 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 backdrop-blur-xl transition-all duration-300">
            <InputArea
              value={inputValue}
              onChange={onInputChange}
              onSend={onSendMessage}
              onExplainSimpler={onExplainSimpler}
              isLoading={isLoading}
              isSending={isSending}
              explainSimpler={explainSimpler}
            />
          </div>
        </div>

        {/* Documents Sidebar - Hidden on mobile, visible on larger screens */}
        <div className="hidden lg:flex lg:w-80 xl:w-96 flex-col overflow-y-auto border border-slate-300 dark:border-white/10 bg-white/90 dark:bg-white/5 rounded-2xl px-5 py-6 mr-6 my-6 backdrop-blur-xl shadow-xl min-h-0 transition-all duration-300 animate-in fade-in slide-in-from-right-6 duration-500">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
            Documents
          </h3>
          <DocumentPanel
            documents={documents}
            uploads={uploads}
            onUpload={onUpload}
            onDelete={onDeleteDocument}
            onPreview={onPreviewDocument}
            isLoading={isLoading}
            error={documentError}
          />
        </div>
      </div>

      {/* Mobile Document Panel - Collapsible or Scrollable */}
      <div className="lg:hidden flex-shrink-0 border-t border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl transition-all duration-300">
        <div className="px-3 sm:px-4 py-2">
          <details className="group">
            <summary className="list-none cursor-pointer flex items-center justify-between py-1">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Documents ({documents.length})
              </span>
              <span className="text-xs text-blue-500 group-open:hidden">Show</span>
              <span className="text-xs text-blue-500 hidden group-open:block">Hide</span>
            </summary>
            <div className="mt-2 max-h-48 overflow-y-auto pb-2">
              <DocumentPanel
                documents={documents}
                uploads={uploads}
                onUpload={onUpload}
                onDelete={onDeleteDocument}
                onPreview={onPreviewDocument}
                isLoading={isLoading}
                error={documentError}
              />
            </div>
          </details>
        </div>
      </div>

    </div>
  );
};
