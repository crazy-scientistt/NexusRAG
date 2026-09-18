import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Clock, Search } from 'lucide-react';
import type { Session } from '@/types';

interface MobileSessionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: Session[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (sessionId: string) => void;
}

export function MobileSessionsSheet({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
}: MobileSessionsSheetProps) {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredSessions = sessions.filter((s) =>
    (s.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center md:hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Bottom Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-h-[85vh] bg-card border-t border-border rounded-t-2xl p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl z-10 flex flex-col overflow-hidden text-foreground"
        >
          {/* Top Drag Handle */}
          <div className="w-12 h-1 rounded-full bg-border mx-auto mb-4" />

          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-foreground text-background flex items-center justify-center">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-display font-bold text-base">Research Dossiers</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search & New Session Bar */}
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search dossiers..."
                className="w-full pl-8 pr-3 py-2 rounded-md border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground"
              />
            </div>
            <button
              onClick={() => {
                onCreateSession();
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-foreground text-background text-xs font-semibold whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>

          {/* Session List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 py-1">
            {filteredSessions.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No sessions found matching &ldquo;{search}&rdquo;.
              </div>
            ) : (
              filteredSessions.map((sess) => {
                const isSelected = sess.id === activeSessionId;
                return (
                  <div
                    key={sess.id}
                    onClick={() => {
                      onSelectSession(sess.id);
                      onClose();
                    }}
                    className={`p-3 rounded-lg border transition-colors flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-secondary border-foreground text-foreground font-semibold'
                        : 'border-border hover:bg-secondary/40 text-muted-foreground'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <p className="text-xs text-foreground font-medium truncate">
                        {sess.name || 'Untitled Session'}
                      </p>
                      <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                        {sess.created_at ? new Date(sess.created_at).toLocaleDateString() : 'Active'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(sess.id);
                      }}
                      className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Delete dossier"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
