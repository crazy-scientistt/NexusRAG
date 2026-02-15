/**
 * InputArea Component
 * Message input textarea with send button and mode toggles
 * Supports multiline input with auto-resize
 */

import { useEffect, useRef, useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { FC } from 'react';

interface InputAreaProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onExplainSimpler: (enabled: boolean) => void;
  isLoading: boolean;
  isSending: boolean;
  explainSimpler: boolean;
}

export const InputArea: FC<InputAreaProps> = ({
  value,
  onChange,
  onSend,
  onExplainSimpler,
  isLoading,
  isSending,
  explainSimpler,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isSending) {
        onSend();
      }
    }
  };

  const canSend = value.trim() && !isSending && !isLoading;

  return (
    <div className="space-y-3">
      {/* Explain Simpler Control */}
      <div className="flex gap-2 flex-wrap">
        <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-300 hover:shadow-md">
          <input
            type="checkbox"
            checked={explainSimpler}
            onChange={(e) => onExplainSimpler(e.target.checked)}
            disabled={isSending}
            className="w-4 h-4 rounded"
          />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Explain Simpler
          </span>
        </label>
      </div>

      {/* Input Area */}
      <div className="relative flex gap-2 sm:gap-3 items-end">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question... (Enter to send)"
          disabled={isSending || isLoading}
          className="resize-none min-h-10 sm:min-h-12 max-h-32 sm:max-h-48 text-sm sm:text-base"
        />

        <Button
          onClick={onSend}
          disabled={!canSend}
          size="lg"
          className="flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12 p-0"
          title="Send message (Enter)"
        >
          {isSending ? (
            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
          ) : (
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </Button>
      </div>

      {/* Helper Text */}
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Strict mode: Only answers based on uploaded documents
      </p>
    </div>
  );
};
