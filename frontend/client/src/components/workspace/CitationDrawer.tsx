import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';
import type { SourceCitation } from '@/types';
import { useIsMobile } from '@/hooks/useMobile';

interface CitationDrawerProps {
  citation: SourceCitation | null;
  onClose: () => void;
}

export function CitationDrawer({ citation, onClose }: CitationDrawerProps) {
  const isMobile = useIsMobile();
  if (!citation) return null;

  const similarity = citation.distance !== undefined && citation.distance !== null
    ? Math.max(0, Math.min(100, Math.round((1.0 - citation.distance) * 100)))
    : null;

  return (
    <AnimatePresence>
      <div className={`fixed inset-0 z-50 flex ${isMobile ? 'items-end justify-center' : 'items-stretch justify-end'}`}>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-xs"
        />

        {/* Responsive Drawer / Bottom Sheet */}
        <motion.div
          initial={isMobile ? { y: '100%' } : { x: '100%' }}
          animate={isMobile ? { y: 0 } : { x: 0 }}
          exit={isMobile ? { y: '100%' } : { x: '100%' }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className={`relative bg-card shadow-2xl z-10 overflow-y-auto text-foreground flex flex-col justify-between ${
            isMobile
              ? 'w-full max-h-[85vh] border-t border-border rounded-t-2xl p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]'
              : 'w-full max-w-md h-full border-l border-border p-6 sm:p-8'
          }`}
        >
          {isMobile && <div className="w-12 h-1 rounded-full bg-border mx-auto mb-4 flex-shrink-0" />}

          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-border">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-semibold">
                  Source Reference
                </span>
                <h3 className="text-lg font-bold font-display mt-0.5">
                  Verified Context Chunk
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Document Meta Pill */}
            <div className="p-4 rounded-md border border-border bg-secondary/40 space-y-2">
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-foreground flex-shrink-0" />
                <span className="font-semibold text-xs truncate">
                  {citation.document_name}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground pt-1 border-t border-border">
                {citation.chunk_index !== undefined && (
                  <span>Chunk #{citation.chunk_index}</span>
                )}
                {similarity !== null && (
                  <span>Similarity: {similarity}%</span>
                )}
                {citation.distance !== undefined && citation.distance !== null && (
                  <span>Distance: {citation.distance.toFixed(3)}</span>
                )}
              </div>
            </div>

            {/* Chunk Snippet Text */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                Extracted Snippet
              </span>
              <div className="p-4 rounded-md border border-border bg-background font-mono text-xs leading-relaxed text-foreground whitespace-pre-wrap select-text max-h-60 overflow-y-auto">
                {citation.snippet || citation.content || 'Snippet content unavailable.'}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-border flex items-center justify-between text-[11px] font-mono text-muted-foreground mt-4">
            <span>Cosine Boundary: Strict</span>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-md bg-foreground text-background text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
