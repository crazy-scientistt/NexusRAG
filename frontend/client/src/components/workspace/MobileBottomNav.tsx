import React from 'react';
import { MessageSquare, Paperclip, Clock, Plus, Layers } from 'lucide-react';

export type MobileTab = 'canvas' | 'vault' | 'sessions';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  documentCount: number;
  sessionCount: number;
  onNewSession: () => void;
}

export function MobileBottomNav({
  activeTab,
  onTabChange,
  documentCount,
  sessionCount,
  onNewSession,
}: MobileBottomNavProps) {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border px-3 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-lg transition-colors duration-200"
      aria-label="Mobile Navigation Bar"
    >
      {/* Tab 1: Synthesis Canvas */}
      <button
        type="button"
        onClick={() => onTabChange('canvas')}
        className={`flex flex-col items-center justify-center min-w-[64px] min-h-[44px] py-1 px-2 rounded-lg transition-colors ${
          activeTab === 'canvas'
            ? 'text-foreground font-semibold'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <div className="relative">
          <MessageSquare className="w-5 h-5 stroke-[2.2]" />
          {activeTab === 'canvas' && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-foreground" />
          )}
        </div>
        <span className="text-[10px] font-mono tracking-wider mt-1">Canvas</span>
      </button>

      {/* Tab 2: Document Vault */}
      <button
        type="button"
        onClick={() => onTabChange('vault')}
        className={`flex flex-col items-center justify-center min-w-[64px] min-h-[44px] py-1 px-2 rounded-lg transition-colors ${
          activeTab === 'vault'
            ? 'text-foreground font-semibold'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <div className="relative">
          <Paperclip className="w-5 h-5 stroke-[2.2]" />
          {documentCount > 0 && (
            <span className="absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full bg-foreground text-background text-[9px] font-mono font-bold leading-none">
              {documentCount}
            </span>
          )}
          {activeTab === 'vault' && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-foreground" />
          )}
        </div>
        <span className="text-[10px] font-mono tracking-wider mt-1">Vault</span>
      </button>

      {/* Tab 3: Sessions History */}
      <button
        type="button"
        onClick={() => onTabChange('sessions')}
        className={`flex flex-col items-center justify-center min-w-[64px] min-h-[44px] py-1 px-2 rounded-lg transition-colors ${
          activeTab === 'sessions'
            ? 'text-foreground font-semibold'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <div className="relative">
          <Clock className="w-5 h-5 stroke-[2.2]" />
          {sessionCount > 0 && (
            <span className="absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full bg-secondary border border-border text-foreground text-[9px] font-mono leading-none">
              {sessionCount}
            </span>
          )}
          {activeTab === 'sessions' && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-foreground" />
          )}
        </div>
        <span className="text-[10px] font-mono tracking-wider mt-1">Sessions</span>
      </button>

      {/* Quick Action: New Session */}
      <button
        type="button"
        onClick={onNewSession}
        title="Start New Research Session"
        className="flex items-center justify-center w-9 h-9 rounded-full bg-foreground text-background shadow-sm hover:opacity-90 active:scale-95 transition-all"
      >
        <Plus className="w-4 h-4 stroke-[2.5]" />
      </button>
    </nav>
  );
}
