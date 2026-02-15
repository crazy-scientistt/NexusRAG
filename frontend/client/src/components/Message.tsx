/**
 * Message Component
 * Displays individual chat messages with different styles for user/assistant
 * Includes source citations and metadata with markdown rendering
 */

import { useState } from 'react';
import { Copy, Check, Pin, PinOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import type { Message as MessageType } from '@/types';
import type { FC } from 'react';

interface MessageProps {
  message: MessageType;
  onPin?: (messageId: string, pinned: boolean) => void;
  isLoading?: boolean;
}

export const Message: FC<MessageProps> = ({
  message,
  onPin,
  isLoading,
}) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role.startsWith('user');

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex gap-4 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center flex-shrink-0 mt-1 shadow-lg shadow-cyan-500/20">
          <span className="text-white text-sm font-bold">C</span>
        </div>
      )}

      {/* Message Content */}
      <div className={`flex-1 max-w-2xl ${isUser ? 'flex flex-col items-end' : ''}`}>
        {/* Message Bubble */}
        <div
          className={`rounded-2xl px-4 py-3 shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur ${
            isUser
              ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white'
              : 'bg-white/5 border border-white/10 text-slate-50'
          } ${isLoading ? 'animate-pulse' : ''}`}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  p: ({ children }) => (
                    <p className="text-sm leading-relaxed mb-3 last:mb-0">{children}</p>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-cyan-300">{children}</strong>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-sm leading-relaxed">{children}</li>
                  ),
                  h1: ({ children }) => (
                    <h1 className="text-lg font-bold mb-2 text-cyan-200">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-base font-bold mb-2 text-cyan-200">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-sm font-bold mb-2 text-cyan-200">{children}</h3>
                  ),
                  code: ({ children }) => (
                    <code className="bg-black/30 px-1.5 py-0.5 rounded text-xs font-mono text-cyan-300">
                      {children}
                    </code>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-8 w-8 p-0 text-slate-200 hover:text-white hover:bg-white/10"
            title="Copy message"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
          {onPin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPin(message.id, !message.pinned)}
              className="h-8 w-8 p-0 text-slate-200 hover:text-white hover:bg-white/10"
              title={message.pinned ? 'Unpin message' : 'Pin message'}
            >
              {message.pinned ? (
                <PinOff className="w-4 h-4 text-amber-600" />
              ) : (
                <Pin className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0 mt-1 text-slate-100">
          <span className="text-xs font-semibold">U</span>
        </div>
      )}
    </div>
  );
};
