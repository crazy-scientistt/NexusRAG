import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface TermsPageProps {
  onBack: () => void;
}

export function TermsPage({ onBack }: TermsPageProps) {
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
            <span>Legal Documentation</span>
            <span>&bull;</span>
            <span>Document ID: TOS-2026-V2</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Terms of Service
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Effective Date: September 18, 2026. Please read these terms carefully before utilizing the NexusRAG document synthesis engine and frontier model orchestration services.
          </p>
        </header>

        {/* Executive Summary Card */}
        <div className="p-6 rounded-lg border border-border bg-card mb-12">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-md bg-foreground text-background flex items-center justify-center flex-shrink-0 mt-0.5">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold mb-1">Executive Summary of User Protections</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You retain 100% intellectual property rights and confidentiality over any documents, dossiers, and queries processed through NexusRAG. We never sell your data, never use your proprietary files to train foundational models, and provide instant irreversible deletion capabilities.
              </p>
            </div>
          </div>
        </div>

        {/* Policy Body */}
        <div className="space-y-12 text-sm leading-relaxed text-foreground">
          <section className="space-y-4">
            <h2 className="font-grotesk text-xl font-bold tracking-tight flex items-center gap-3">
              <span className="text-xs font-mono text-muted-foreground">01.</span>
              Acceptance of Terms
            </h2>
            <p className="text-muted-foreground">
              By accessing or using the NexusRAG platform, web interface, API endpoints, or associated document synthesis tools (collectively, the &ldquo;Service&rdquo;), you agree to be bound by these Terms of Service. If you do not agree to all terms, you must not access or utilize the Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-grotesk text-xl font-bold tracking-tight flex items-center gap-3">
              <span className="text-xs font-mono text-muted-foreground">02.</span>
              Document Ownership & Intellectual Property
            </h2>
            <p className="text-muted-foreground">
              All proprietary documents, PDF dossiers, spreadsheets, text archives, and proprietary materials uploaded to NexusRAG remain the sole exclusive property of the user or organization providing them.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-md border border-border bg-secondary/40">
                <div className="flex items-center gap-2 text-xs font-semibold mb-1.5">
                  <CheckCircle2 className="w-4 h-4 text-foreground" />
                  <span>Zero-Training Commitment</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your ingested text and embeddings are never submitted to public LLM training datasets or utilized to improve third-party base weights.
                </p>
              </div>
              <div className="p-4 rounded-md border border-border bg-secondary/40">
                <div className="flex items-center gap-2 text-xs font-semibold mb-1.5">
                  <CheckCircle2 className="w-4 h-4 text-foreground" />
                  <span>Synthesized Output Rights</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  All summaries, extracted tables, and synthesized intelligence reports generated from your files are licensed exclusively to you.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-grotesk text-xl font-bold tracking-tight flex items-center gap-3">
              <span className="text-xs font-mono text-muted-foreground">03.</span>
              Frontier Model Routing & OpenRouter Disclaimers
            </h2>
            <p className="text-muted-foreground">
              NexusRAG acts as an intelligent orchestration layer connecting vector retrieval with frontier language models via OpenRouter (including Google Gemini, Anthropic Claude, Meta Llama, and DeepSeek). You acknowledge that:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>Language models generate probabilistic outputs based on nearest-neighbor document chunks. While Strict Mode enforces similarity distance boundaries, users are advised to verify critical financial, medical, and legal claims against primary sources.</li>
              <li>When using custom OpenRouter keys, request rate limits, model availability, and direct billing terms are governed by OpenRouter policies.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="font-grotesk text-xl font-bold tracking-tight flex items-center gap-3">
              <span className="text-xs font-mono text-muted-foreground">04.</span>
              Acceptable Use Policy
            </h2>
            <p className="text-muted-foreground">
              You agree not to use NexusRAG to ingest or synthesize:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
              <li>Classified government materials or data subject to export control restrictions without appropriate self-hosted isolated infrastructure.</li>
              <li>Malicious code, exploits, or materials intended to probe or compromise host server architecture.</li>
              <li>Automated scraping bots designed to overwhelm or deny service to other studio participants.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="font-grotesk text-xl font-bold tracking-tight flex items-center gap-3">
              <span className="text-xs font-mono text-muted-foreground">05.</span>
              Data Deletion & Retention Lifecycles
            </h2>
            <p className="text-muted-foreground">
              Users may initiate permanent data erasure at any time via the Studio workspace by clicking &ldquo;Clear All Documents&rdquo;. This operation immediately purges the active Chroma collection vectors, removes stored disk representations, and clears active session memory.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-grotesk text-xl font-bold tracking-tight flex items-center gap-3">
              <span className="text-xs font-mono text-muted-foreground">06.</span>
              Limitation of Liability
            </h2>
            <p className="text-muted-foreground">
              To the maximum extent permitted by applicable law, NexusRAG and its contributors shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from decisions made in reliance on synthesized document outputs.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
