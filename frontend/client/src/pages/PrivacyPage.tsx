import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, EyeOff, Database, Server, RefreshCw } from 'lucide-react';

interface PrivacyPageProps {
  onBack: () => void;
}

export function PrivacyPage({ onBack }: PrivacyPageProps) {
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
            <span>Data Governance</span>
            <span>&bull;</span>
            <span>Version 2.4.0</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Our architectural commitment to zero document retention, cryptographic isolation, and complete data sovereignty for all ingested enterprise files.
          </p>
        </header>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="p-5 rounded-lg border border-border bg-card">
            <div className="w-8 h-8 rounded-md bg-foreground text-background flex items-center justify-center mb-3">
              <EyeOff className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold mb-1">Zero Training</h3>
            <p className="text-xs text-muted-foreground">
              Uploaded files and prompt completions are never used to train or refine foundational AI models.
            </p>
          </div>

          <div className="p-5 rounded-lg border border-border bg-card">
            <div className="w-8 h-8 rounded-md bg-foreground text-background flex items-center justify-center mb-3">
              <Database className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold mb-1">Isolated Vectors</h3>
            <p className="text-xs text-muted-foreground">
              Document chunks reside in partitioned, user-keyed collections with strict similarity boundary checks.
            </p>
          </div>

          <div className="p-5 rounded-lg border border-border bg-card">
            <div className="w-8 h-8 rounded-md bg-foreground text-background flex items-center justify-center mb-3">
              <RefreshCw className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold mb-1">Instant Purge</h3>
            <p className="text-xs text-muted-foreground">
              One-click deletion instantly removes SQLite database rows, file disk buffers, and Chroma vectors.
            </p>
          </div>
        </div>

        {/* Policy Content */}
        <div className="space-y-12 text-sm leading-relaxed text-foreground">
          <section className="space-y-4">
            <h2 className="font-grotesk text-xl font-bold tracking-tight flex items-center gap-3">
              <span className="text-xs font-mono text-muted-foreground">01.</span>
              Information We Process
            </h2>
            <p className="text-muted-foreground">
              When utilizing NexusRAG, the platform processes the following data classes strictly to fulfill document synthesis requests:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Uploaded Documents:</strong> PDF, DOCX, TXT, and Markdown files uploaded by you. These are split into localized chunk tokens and processed through our local dense embedding model.</li>
              <li><strong className="text-foreground">Session Metadata:</strong> Session timestamps, synthesis mode selections (Executive, Academic, Extraction), and query logs required to present dialogue history.</li>
              <li><strong className="text-foreground">Authentication Credentials:</strong> NexusRAG has no accounts and no sign-in. We never ask for a password, and no login credentials are collected or stored.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="font-grotesk text-xl font-bold tracking-tight flex items-center gap-3">
              <span className="text-xs font-mono text-muted-foreground">02.</span>
              How Your Data Is Used
            </h2>
            <p className="text-muted-foreground">
              NexusRAG operates as a deterministic retrieval pipeline. Ingested documents are transformed into multi-dimensional vectors for semantic indexing. When you ask a question:
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
              <li>Only the top nearest-neighbor chunk snippets meeting strict cosine distance thresholds are extracted.</li>
              <li>Those isolated snippets are injected into an ephemeral context envelope.</li>
              <li>The envelope is sent to the selected frontier model via OpenRouter solely to generate the cited answer.</li>
              <li>No document data is retained by OpenRouter or model creators beyond the immediate API response window.</li>
            </ol>
          </section>

          <section className="space-y-4">
            <h2 className="font-grotesk text-xl font-bold tracking-tight flex items-center gap-3">
              <span className="text-xs font-mono text-muted-foreground">03.</span>
              Storage & Security Controls
            </h2>
            <p className="text-muted-foreground">
              NexusRAG enforces robust data safety controls:
            </p>
            <div className="p-4 rounded-md border border-border bg-secondary/30 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <Server className="w-4 h-4 text-foreground" />
                <span>Local & Cloud Sandboxing</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Embeddings are generated locally using high-efficiency sentence transformers, preventing raw unchunked file transfers across third-party embedding vendors.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-grotesk text-xl font-bold tracking-tight flex items-center gap-3">
              <span className="text-xs font-mono text-muted-foreground">04.</span>
              User Rights & Deletion
            </h2>
            <p className="text-muted-foreground">
              In accordance with international privacy principles (including GDPR and CCPA):
            </p>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>You have the right to inspect all document chunks and source citations currently stored for your user ID.</li>
              <li>You may wipe all stored vectors, session dialogues, and cached documents in a single click using the &ldquo;Clear All Documents&rdquo; control in the workspace.</li>
              <li>No ghost backups or residual vector indexes survive after a clear operation.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
