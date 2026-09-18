import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Cpu, Lock, CheckCircle2, Terminal, Layers, FileCheck } from 'lucide-react';

interface SecurityPageProps {
  onBack: () => void;
  onGetStarted: () => void;
}

export function SecurityPage({ onBack, onGetStarted }: SecurityPageProps) {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24">
        {/* Back navigation */}
        <motion.button
          onClick={onBack}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground mb-12 transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
          Back to Overview
        </motion.button>

        {/* Header */}
        <header className="border-b border-border pb-10 mb-12">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
            <span>Engineering Architecture</span>
            <span>&bull;</span>
            <span>System Spec V2.5</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Security & System Architecture
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Technical blueprint of our cosine distance thresholding, zero-hallucination negative assertion gates, and isolated vector synthesis pipelines.
          </p>
        </header>

        {/* Architecture Diagram Card */}
        <div className="p-6 rounded-lg border border-border bg-card mb-12 space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2.5">
              <Terminal className="w-4 h-4 text-foreground" />
              <span className="font-mono text-xs font-semibold">PIPELINE INTEGRITY VERIFICATION</span>
            </div>
            <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-secondary text-muted-foreground border border-border">
              DETERMINISTIC
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
            <div className="p-4 rounded-md border border-border bg-secondary/30">
              <span className="block text-[11px] font-mono text-muted-foreground mb-1">01. INGESTION</span>
              <span className="text-xs font-semibold">Dynamic Chunking</span>
              <span className="block text-[10px] text-muted-foreground mt-1">750 Tokens / 150 Overlap</span>
            </div>
            <div className="p-4 rounded-md border border-border bg-secondary/30">
              <span className="block text-[11px] font-mono text-muted-foreground mb-1">02. EMBEDDING</span>
              <span className="text-xs font-semibold">Dense 384D Vector</span>
              <span className="block text-[10px] text-muted-foreground mt-1">Local Cosine Space</span>
            </div>
            <div className="p-4 rounded-md border border-border bg-secondary/30">
              <span className="block text-[11px] font-mono text-muted-foreground mb-1">03. RETRIEVAL</span>
              <span className="text-xs font-semibold">Distance Filter</span>
              <span className="block text-[10px] text-muted-foreground mt-1">D &lt; 0.75 Strict Cutoff</span>
            </div>
            <div className="p-4 rounded-md border border-border bg-secondary/30">
              <span className="block text-[11px] font-mono text-muted-foreground mb-1">04. SYNTHESIS</span>
              <span className="text-xs font-semibold">Frontier Models</span>
              <span className="block text-[10px] text-muted-foreground mt-1">Grounded Citations</span>
            </div>
          </div>
        </div>

        {/* Technical Deep Dive Sections */}
        <div className="space-y-12 text-sm leading-relaxed text-foreground">
          <section className="space-y-4">
            <h2 className="font-grotesk text-xl font-bold tracking-tight flex items-center gap-3">
              <span className="text-xs font-mono text-muted-foreground">01.</span>
              The Zero-Hallucination Distance Gate
            </h2>
            <p className="text-muted-foreground">
              Most standard RAG implementations naively pass the top-k retrieved documents directly to the LLM regardless of relevance, causing severe hallucinations when the query is unrelated to the files.
            </p>
            <p className="text-muted-foreground">
              NexusRAG implements a mathematical distance gate in Chroma cosine space:
            </p>
            <div className="p-4 rounded-md bg-secondary/50 border border-border font-mono text-xs">
              Cosine Distance: D = 1 - cos(&theta;) &lt; 0.75 (Similarity &gt; 0.25)
            </div>
            <p className="text-muted-foreground">
              If all retrieved chunks exceed the distance boundary (indicating zero textual evidence in the user&rsquo;s documents), the system immediately halts generation and returns an explicit grounded negation rather than allowing the model to fabricate answers.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-grotesk text-xl font-bold tracking-tight flex items-center gap-3">
              <span className="text-xs font-mono text-muted-foreground">02.</span>
              Multi-Model Fleet Routing
            </h2>
            <p className="text-muted-foreground">
              NexusRAG decouples model intelligence from proprietary cloud lock-in by interfacing with OpenRouter. Users can switch dynamically between leading frontier architectures based on their synthesis objective:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-md border border-border bg-card">
                <span className="font-semibold text-xs block mb-1">High-Throughput Ingestion</span>
                <p className="text-xs text-muted-foreground">
                  <strong>Gemini 2.0 Flash:</strong> Ultra-low latency retrieval with a 1M+ token context envelope for massive document sets.
                </p>
              </div>
              <div className="p-4 rounded-md border border-border bg-card">
                <span className="font-semibold text-xs block mb-1">Deep Analytical Rigor</span>
                <p className="text-xs text-muted-foreground">
                  <strong>Claude 3.5 Sonnet:</strong> Unmatched nuance for legal auditing, technical contracts, and comparative thesis extraction.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-grotesk text-xl font-bold tracking-tight flex items-center gap-3">
              <span className="text-xs font-mono text-muted-foreground">03.</span>
              Data Protection & Transport
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li><strong>Transport Security:</strong> All API requests and file transmissions require HTTPS/TLS 1.3 encryption.</li>
              <li><strong>Memory Isolation:</strong> Uploaded files are processed in ephemeral temp workspaces keyed to individual user sessions.</li>
              <li><strong>One-Click Wiping:</strong> All vector records, session contexts, and temporary file artifacts can be permanently wiped on demand.</li>
            </ul>
          </section>

          {/* Call to Action */}
          <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-base mb-1">Ready to explore the synthesis studio?</h3>
              <p className="text-xs text-muted-foreground">Enter as a guest or connect your OpenRouter credentials.</p>
            </div>
            <button
              onClick={onGetStarted}
              className="px-5 py-2.5 rounded-md bg-foreground text-background text-xs font-semibold tracking-wide hover:opacity-90 transition-opacity"
            >
              Launch Studio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
