import React from 'react';
import { motion } from 'framer-motion';
import {
  Layers,
  Cpu,
  ShieldCheck,
  ArrowUpRight,
  Database,
  Terminal,
  FileCheck2,
  HardDrive,
  CheckCircle2,
} from 'lucide-react';

interface FeaturesPageProps {
  onGetStarted: () => void;
  onBack?: () => void;
}

export function FeaturesPage({ onGetStarted, onBack }: FeaturesPageProps) {
  const architecturalPillars = [
    {
      title: 'OpenRouter Multi-Model Fleet',
      badge: 'UNIFIED GATEWAY',
      icon: Cpu,
      desc: 'Seamlessly switch between Google Gemini 2.0 Flash (1M ctx), Anthropic Claude 3.5 Sonnet, Meta Llama 3.3 70B, and DeepSeek without code modifications.',
      metric: '1,048,576 Token Envelope',
    },
    {
      title: 'Chroma Dense Vector Index',
      badge: 'COSINE NEAREST SEARCH',
      icon: Database,
      desc: 'Chunks documents into dense 384-dimensional semantic embeddings. Retrieves top-k nearest fragments in sub-20 millisecond roundtrips.',
      metric: '< 20ms Vector Retrieval Latency',
    },
    {
      title: 'Zero-Hallucination Strict Mode',
      badge: 'FACTUAL GROUNDING',
      icon: ShieldCheck,
      desc: 'Mathematically guarantees that answers only cite verified document fragments. Employs strict distance thresholding for negative assertions.',
      metric: 'D < 0.75 Cosine Cutoff',
    },
    {
      title: 'Session & User Data Isolation',
      badge: 'ENTERPRISE VAULT',
      icon: HardDrive,
      desc: 'Every user session maintains an isolated namespace within Chroma and SQLite/PostgreSQL with one-click data purging.',
      metric: 'Ephemeral Sandboxing',
    },
  ];

  const stack = [
    { name: 'OpenRouter', category: 'Inference Router', detail: 'Gemini, Claude, Llama, DeepSeek' },
    { name: 'ChromaDB', category: 'Vector Engine', detail: 'Cosine HNSW Indexing' },
    { name: 'FastAPI', category: 'API Core', detail: 'Python Async Engine' },
    { name: 'React 19 & Vite', category: 'Frontend', detail: 'High-Performance SPA' },
    { name: 'Tailwind CSS', category: 'Design System', detail: 'Black & White Editorial' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-24">
        {/* Header */}
        <div className="border-b border-border pb-12 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-secondary/60 text-xs font-mono tracking-wider uppercase mb-6">
            <span>System Specifications</span>
            <span>&bull;</span>
            <span>Architecture Overview</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            System Architecture & Engine Pillars
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl leading-relaxed">
            A look under the hood of the deterministic retrieval pipeline, cosine distance boundaries, and frontier model orchestration.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {architecturalPillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div key={pillar.title} className="p-6 rounded-lg border border-border bg-card space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-md bg-foreground text-background flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-secondary text-muted-foreground border border-border">
                    {pillar.badge}
                  </span>
                </div>
                <div>
                  <h3 className="font-grotesk text-lg font-bold mb-1.5">{pillar.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{pillar.desc}</p>
                </div>
                <div className="pt-3 border-t border-border flex items-center justify-between text-xs font-mono">
                  <span className="text-muted-foreground">Specification:</span>
                  <span className="font-semibold text-foreground">{pillar.metric}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Stack Table */}
        <div className="border border-border rounded-lg bg-card overflow-hidden mb-16">
          <div className="p-4 border-b border-border bg-secondary/30 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-foreground" />
            <span className="font-mono text-xs font-semibold uppercase">
              Production Stack & Infrastructure
            </span>
          </div>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/50 font-mono text-muted-foreground">
                <th className="p-3.5 font-semibold">Component</th>
                <th className="p-3.5 font-semibold">Layer</th>
                <th className="p-3.5 font-semibold">Implementation Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stack.map((item) => (
                <tr key={item.name}>
                  <td className="p-3.5 font-semibold">{item.name}</td>
                  <td className="p-3.5 text-muted-foreground">{item.category}</td>
                  <td className="p-3.5 font-mono text-muted-foreground">{item.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom Action */}
        <div className="p-8 rounded-lg border border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-base mb-1">Ready to test the engine on your documents?</h3>
            <p className="text-xs text-muted-foreground">Launch the studio canvas and upload your first file.</p>
          </div>
          <button
            onClick={onGetStarted}
            className="px-6 py-2.5 rounded-md bg-foreground text-background font-semibold text-xs font-mono uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <span>Launch Studio</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
