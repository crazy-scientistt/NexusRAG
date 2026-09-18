import React from 'react';
import { ArrowUpRight, Terminal } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="border-t border-border bg-background text-foreground transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-16">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-foreground text-background flex items-center justify-center font-mono font-bold text-xs">
                N
              </div>
              <span className="font-display text-lg font-bold tracking-tight">
                NexusRAG
              </span>
            </div>
            <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
              Autonomous document intelligence, grounded semantic vector search, and frontier multi-model synthesis designed with editorial precision.
            </p>
            <div className="inline-flex items-center gap-2 text-[11px] font-mono text-muted-foreground pt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              <span>Vector Engine Operational &bull; D &lt; 0.75 Strict</span>
            </div>
          </div>

          {/* Column 1: Platform */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
              Platform
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('landing')}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Overview
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('features')}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Architecture & Features
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('workspace')}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Synthesis Studio
                </button>
              </li>
            </ul>
          </div>

          {/* Column 2: Legal & Trust */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
              Governance
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('terms')}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('privacy')}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('security')}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Security Architecture
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Frontier Models */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
              Engine Fleet
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-center justify-between">
                <span>Gemini 2.0 Flash</span>
                <span className="font-mono text-[10px]">1M ctx</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Claude 3.5 Sonnet</span>
                <span className="font-mono text-[10px]">200K ctx</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Llama 3.3 70B</span>
                <span className="font-mono text-[10px]">128K ctx</span>
              </li>
              <li className="flex items-center justify-between">
                <span>DeepSeek Chat</span>
                <span className="font-mono text-[10px]">64K ctx</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} NexusRAG Systems. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <button onClick={() => onNavigate('privacy')} className="hover:text-foreground transition-colors">
              Privacy
            </button>
            <button onClick={() => onNavigate('terms')} className="hover:text-foreground transition-colors">
              Terms
            </button>
            <button onClick={() => onNavigate('security')} className="hover:text-foreground transition-colors">
              Security
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
