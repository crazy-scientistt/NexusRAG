/**
 * Sidebar Component
 * Navigation, session list, and user menu
 * Collapsible on mobile, persistent on desktop
 */

import { useState } from 'react';
import {
  Plus,
  MessageSquare,
  LogOut,
  Menu,
  X,
  Copy,
  Trash2,
  Edit2,
  Moon,
  Sun,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Session } from '@/types';
import type { FC } from 'react';

interface SidebarProps {
  sessions: Session[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onCreateSession: () => void;
  onCloneSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newName: string) => void;
  onLogout: () => void;
  onThemeToggle: () => void;
  theme: 'light' | 'dark';
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  userEmail?: string;
}

export const Sidebar: FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onCloneSession,
  onDeleteSession,
  onRenameSession,
  onLogout,
  onThemeToggle,
  theme,
  isOpen,
  onToggle,
  userEmail,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleRename = (sessionId: string, currentName: string) => {
    setEditingId(sessionId);
    setEditingName(currentName);
  };

  const handleSaveRename = (sessionId: string) => {
    if (editingName.trim()) {
      onRenameSession(sessionId, editingName);
    }
    setEditingId(null);
    setEditingName('');
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => onToggle(!isOpen)}
        className="fixed top-3 right-4 z-40 lg:hidden p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-lg transition-all duration-300 bg-white dark:bg-slate-900/60 backdrop-blur border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white hover:scale-110 hover:shadow-lg"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden animate-in fade-in duration-300"
          onClick={() => onToggle(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static top-0 left-0 min-h-[100dvh] lg:h-screen w-64 bg-white dark:bg-slate-950/95 backdrop-blur-xl border-r border-slate-200 dark:border-white/10 flex flex-col transition-all duration-500 ease-out z-40 lg:z-0 ${
          isOpen ? 'translate-x-0 shadow-lg' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-white/10 transition-all duration-300">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <h1 className="font-bold text-lg text-slate-900 dark:text-white">
              Cloud RAG
            </h1>
          </div>
          <Button
            onClick={() => {
              onCreateSession();
              onToggle(false);
            }}
            className="w-full gap-2"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </Button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 transition-all duration-300">
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No conversations yet
              </p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                onMouseEnter={() => setHoveredId(session.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`group relative rounded-lg transition-all duration-300 ${
                  activeSessionId === session.id
                    ? 'bg-slate-200 dark:bg-white/10 border border-slate-300 dark:border-white/10 shadow-md'
                    : 'hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent hover:shadow-sm'
                }`}
              >
                {editingId === session.id ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => handleSaveRename(session.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveRename(session.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    autoFocus
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-white/10 border border-blue-400 dark:border-cyan-400/70 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                ) : (
                  <>
                    <button
                      onClick={() => {
                        onSelectSession(session.id);
                        onToggle(false);
                      }}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-100 truncate transition-all duration-300 hover:translate-x-1"
                    >
                      {session.name}
                    </button>

                    {/* Action Buttons */}
                    {(hoveredId === session.id ||
                      activeSessionId === session.id) && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 bg-slate-200 dark:bg-slate-800 rounded-md shadow-sm">
                        <button
                          onClick={() =>
                            handleRename(session.id, session.name)
                          }
                          className="p-1.5 hover:bg-slate-300 dark:hover:bg-white/10 rounded transition-all duration-300 hover:scale-110"
                          title="Rename"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                        </button>
                        <button
                          onClick={() => onCloneSession(session.id)}
                          className="p-1.5 hover:bg-slate-300 dark:hover:bg-white/10 rounded transition-all duration-300 hover:scale-110"
                          title="Clone"
                        >
                          <Copy className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                        </button>
                        <button
                          onClick={() => onDeleteSession(session.id)}
                          className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/40 rounded transition-all duration-300 hover:scale-110"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-500" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 dark:border-white/10 p-4 space-y-2 transition-all duration-300">
          {userEmail && (
            <p className="text-xs text-slate-600 dark:text-slate-300 truncate px-3">
              {userEmail}
            </p>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onThemeToggle}
              className="flex-1 gap-2"
            >
              {theme === 'light' ? (
                <>
                  <Moon className="w-4 h-4" />
                  Dark
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4" />
                  Light
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="flex-1 gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
};
