import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  Shield,
  Layers,
  Search,
  CheckCircle2,
  FileText,
  Cpu,
  Database,
  Lock,
  Compass,
  ChevronRight,
  FileCheck,
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onFeatures: () => void;
  onNavigate?: (page: string) => void;
}

const DOSSIER_DEMOS = [
  {
    category: 'Financial Analysis',
    title: 'Enterprise Earnings & Risk Ledger',
    docName: 'Q3_Financial_Briefing.pdf',
    query: 'What are the top revenue drivers and margin risks for next fiscal year?',
    model: 'Gemini 2.0 Flash',
    latency: '190ms',
    confidence: 'High (0.86 Sim)',
    chunksFound: 3,
    synthesis:
      'Total revenue expanded +34% YoY to $48.6M, driven primarily by enterprise platform expansion (+42%) and autonomous retrieval extensions. Primary risks identified in Section 4.2 include raw GPU compute cost inflation and delayed international vendor reconciliations.',
  },
  {
    category: 'Contract Law',
    title: 'Intellectual Property & Licensing Spec',
    docName: 'Master_Services_Agreement_2026.docx',
    query: 'Are there any non-compete covenants or intellectual property reassignment clauses?',
    model: 'Claude 3.5 Sonnet',
    latency: '320ms',
    confidence: 'Strict Grounded',
    chunksFound: 2,
    synthesis:
      'Section 9.1 explicitly confirms that Customer retains 100% perpetual ownership of all uploaded source documents, vector embeddings, and derivative synthesis outputs. No non-compete covenants exist within the active agreement terms.',
  },
  {
    category: 'Engineering Architecture',
    title: 'Distributed Vector Pipeline Blueprint',
    docName: 'Nexus_Architecture_Spec.md',
    query: 'How does the system prevent hallucinations on irrelevant queries?',
    model: 'Llama 3.3 70B',
    latency: '240ms',
    confidence: 'Zero-Hallucination Gate',
    chunksFound: 4,
    synthesis:
      'The engine applies an immutable cosine distance threshold (D = 1 - cos(theta) < 0.75). If nearest-neighbor chunks fail to meet this threshold, generation is halted immediately and an explicit negative assertion is returned.',
  },
];

export function LandingPage({ onGetStarted, onFeatures, onNavigate }: LandingPageProps) {
  const [activeDossierIndex, setActiveDossierIndex] = useState(0);
  const activeDossier = DOSSIER_DEMOS[activeDossierIndex];

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* Subtle Noise Grid Overlay */}
      <div className="absolute inset-0 noise-grid pointer-events-none opacity-40" />

      {/* Hero Section */}
      <section className="relative pt-36 sm:pt-44 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-secondary/60 text-xs font-mono tracking-wider uppercase mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-foreground" />
          <span>Document Intelligence &bull; OpenRouter Fleet</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.08] mb-6"
        >
          Truth extracted from your documents, with mathematical rigor.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10"
        >
          Ingest complex PDFs, spreadsheets, and technical dossiers. NexusRAG isolates relevant dense vectors with strict cosine distance boundaries, delivering hallucination-free executive synthesis.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-16"
        >
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto px-6 py-3 rounded-md bg-foreground text-background font-semibold text-xs font-mono uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-sm"
          >
            <span>Launch Studio Canvas</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
          <button
            onClick={onFeatures}
            className="w-full sm:w-auto px-6 py-3 rounded-md border border-border bg-card text-foreground font-semibold text-xs font-mono uppercase tracking-widest hover:bg-secondary transition-colors flex items-center justify-center gap-2"
          >
            <span>System Architecture</span>
          </button>
        </motion.div>

        {/* Metric Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto border-t border-border pt-10 text-left"
        >
          <div className="p-3">
            <span className="font-mono text-xl sm:text-2xl font-bold block mb-1">384D</span>
            <span className="text-xs text-muted-foreground">Dense Vector Space</span>
          </div>
          <div className="p-3">
            <span className="font-mono text-xl sm:text-2xl font-bold block mb-1">&lt; 0.75</span>
            <span className="text-xs text-muted-foreground">Strict Distance Gate</span>
          </div>
          <div className="p-3">
            <span className="font-mono text-xl sm:text-2xl font-bold block mb-1">1,048K</span>
            <span className="text-xs text-muted-foreground">Max Context Envelope</span>
          </div>
          <div className="p-3">
            <span className="font-mono text-xl sm:text-2xl font-bold block mb-1">Zero</span>
            <span className="text-xs text-muted-foreground">Model Training Retention</span>
          </div>
        </motion.div>
      </section>

      {/* Interactive Dossier Showcase */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="border border-border rounded-lg bg-card overflow-hidden shadow-sm">
          {/* Dossier Tabs */}
          <div className="flex border-b border-border overflow-x-auto">
            {DOSSIER_DEMOS.map((demo, idx) => (
              <button
                key={demo.title}
                onClick={() => setActiveDossierIndex(idx)}
                className={`px-5 py-3.5 text-xs font-mono tracking-wider whitespace-nowrap transition-colors border-r border-border text-left ${
                  activeDossierIndex === idx
                    ? 'bg-secondary text-foreground font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                }`}
              >
                <span className="text-[10px] block opacity-60 uppercase">{demo.category}</span>
                <span>{demo.title}</span>
              </button>
            ))}
          </div>

          {/* Dossier Body */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-muted-foreground border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-foreground" />
                <span className="text-foreground font-semibold">{activeDossier.docName}</span>
                <span>&bull;</span>
                <span>{activeDossier.chunksFound} chunks verified</span>
              </div>
              <div className="flex items-center gap-4">
                <span>Model: {activeDossier.model}</span>
                <span>Latency: {activeDossier.latency}</span>
                <span className="px-2 py-0.5 rounded bg-secondary text-foreground font-semibold">
                  {activeDossier.confidence}
                </span>
              </div>
            </div>

            {/* Query */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                Inquiry
              </span>
              <p className="text-base font-semibold text-foreground">
                &ldquo;{activeDossier.query}&rdquo;
              </p>
            </div>

            {/* Grounded Synthesis */}
            <div className="space-y-2 p-5 rounded-md border border-border bg-secondary/30">
              <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-foreground" />
                <span>Grounded Intelligence Output</span>
              </span>
              <p className="text-sm leading-relaxed text-foreground">
                {activeDossier.synthesis}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Unique Capabilities Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-left mb-12">
          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground block mb-2">
            Engineering Foundations
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
            Designed for truth, built against hallucinations.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-lg border border-border bg-card space-y-3">
            <div className="w-9 h-9 rounded-md bg-foreground text-background flex items-center justify-center mb-4">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="font-grotesk text-lg font-bold">Strict Distance Thresholding</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Standard RAG forces answers even when documents contain no relevant evidence. NexusRAG validates cosine nearest neighbors below 0.75, asserting clear negations instead of hallucinating.
            </p>
          </div>

          <div className="p-6 rounded-lg border border-border bg-card space-y-3">
            <div className="w-9 h-9 rounded-md bg-foreground text-background flex items-center justify-center mb-4">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="font-grotesk text-lg font-bold">Frontier Model Fleet</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Route queries seamlessly across Google Gemini 2.0 Flash, Claude 3.5 Sonnet, Llama 3.3 70B, and DeepSeek via unified OpenRouter connectivity, matched to context requirements.
            </p>
          </div>

          <div className="p-6 rounded-lg border border-border bg-card space-y-3">
            <div className="w-9 h-9 rounded-md bg-foreground text-background flex items-center justify-center mb-4">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="font-grotesk text-lg font-bold">Data Sovereignty & Purge</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your files and embeddings are completely isolated. Ingested dossiers are never used to train foundation models, with complete one-click data destruction whenever needed.
            </p>
          </div>
        </div>
      </section>

      {/* Model Fleet Catalog Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-border">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground block mb-2">
              Engine Catalog
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
              Curated OpenRouter Models
            </h2>
          </div>
          <span className="text-xs text-muted-foreground font-mono">
            Switch anytime via workspace header
          </span>
        </div>

        <div className="border border-border rounded-lg bg-card overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/50 font-mono text-muted-foreground">
                <th className="p-3.5 font-semibold">Model</th>
                <th className="p-3.5 font-semibold">Provider</th>
                <th className="p-3.5 font-semibold">Context Limit</th>
                <th className="p-3.5 font-semibold">Ideal Workload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="p-3.5 font-semibold">Gemini 2.0 Flash</td>
                <td className="p-3.5 text-muted-foreground">Google</td>
                <td className="p-3.5 font-mono">1,048,576 tokens</td>
                <td className="p-3.5 text-muted-foreground">High-volume dossiers & rapid synthesis</td>
              </tr>
              <tr>
                <td className="p-3.5 font-semibold">Claude 3.5 Sonnet</td>
                <td className="p-3.5 text-muted-foreground">Anthropic</td>
                <td className="p-3.5 font-mono">200,000 tokens</td>
                <td className="p-3.5 text-muted-foreground">Exhaustive legal & analytical audits</td>
              </tr>
              <tr>
                <td className="p-3.5 font-semibold">Llama 3.3 70B</td>
                <td className="p-3.5 text-muted-foreground">Meta</td>
                <td className="p-3.5 font-mono">128,000 tokens</td>
                <td className="p-3.5 text-muted-foreground">Open-weights reasoning & enterprise governance</td>
              </tr>
              <tr>
                <td className="p-3.5 font-semibold">DeepSeek Chat</td>
                <td className="p-3.5 text-muted-foreground">DeepSeek</td>
                <td className="p-3.5 font-mono">64,000 tokens</td>
                <td className="p-3.5 text-muted-foreground">Fast technical & code extraction</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="p-8 sm:p-12 rounded-lg border border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="space-y-2">
            <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
              Start synthesizing your documents now.
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
              Instant developer guest mode available with zero setup, or provide your OpenRouter key for custom frontier routing.
            </p>
          </div>
          <button
            onClick={onGetStarted}
            className="px-6 py-3 rounded-md bg-foreground text-background font-semibold text-xs font-mono uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center gap-2 whitespace-nowrap"
          >
            <span>Launch Studio</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
