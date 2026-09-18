/**
 * Per-sentence evidence for an answer.
 *
 * Assistants cite a whole answer and leave you to work out which claim a source
 * actually backs. This shows the verdict for each sentence separately, so an
 * answer reads as a set of individually checked claims rather than one block to
 * be trusted or not.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react';
import type { EvidenceReport, EvidenceSentence } from '@/types';

const VERDICT_STYLE: Record<
  string,
  { border: string; dot: string; label: string; text: string }
> = {
  supported: {
    border: 'border-l-emerald-500',
    dot: 'bg-emerald-500',
    label: 'Supported',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  partial: {
    border: 'border-l-amber-500',
    dot: 'bg-amber-500',
    label: 'Partial',
    text: 'text-amber-600 dark:text-amber-400',
  },
  unverified: {
    border: 'border-l-rose-500',
    dot: 'bg-rose-500',
    label: 'Not found in sources',
    text: 'text-rose-600 dark:text-rose-400',
  },
};

function SentenceRow({ sentence }: { sentence: EvidenceSentence }) {
  const [open, setOpen] = useState(false);
  const style = VERDICT_STYLE[sentence.verdict];
  if (!style) return null;

  const hasSnippet = Boolean(sentence.snippet);

  return (
    <div className={`border-l-2 ${style.border} pl-3 py-1.5`}>
      <button
        type="button"
        onClick={() => hasSnippet && setOpen((v) => !v)}
        className={`w-full text-left group ${hasSnippet ? 'cursor-pointer' : 'cursor-default'}`}
        aria-expanded={open}
      >
        <p className="text-[13px] leading-relaxed text-foreground">{sentence.text}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-[10px] font-mono uppercase tracking-wide ${style.text}`}>
            {style.label}
          </span>
          {sentence.score !== null && (
            <span className="text-[10px] font-mono text-muted-foreground">
              {Math.round(sentence.score * 100)}% overlap
            </span>
          )}
          {sentence.source_name && (
            <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[40%]">
              {sentence.source_name}
            </span>
          )}
          {hasSnippet && (
            <ChevronDown
              className={`w-3 h-3 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
            />
          )}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && hasSnippet && (
          <motion.blockquote
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden mt-1.5 text-[12px] leading-relaxed text-muted-foreground bg-secondary/50 rounded px-2.5 py-2"
          >
            {sentence.snippet}
          </motion.blockquote>
        )}
      </AnimatePresence>
    </div>
  );
}

export function EvidencePanel({ evidence }: { evidence?: EvidenceReport }) {
  const [open, setOpen] = useState(false);
  if (!evidence?.sentences?.length) return null;

  const judged = evidence.sentences.filter((s) => s.verdict !== 'skipped');
  if (judged.length === 0) return null;

  const { supported, partial, unverified } = evidence.summary;
  const percent = Math.round((evidence.summary.grounded_ratio || 0) * 100);
  const Icon = unverified > 0 ? ShieldAlert : supported > 0 ? ShieldCheck : ShieldQuestion;
  const tone =
    unverified > 0
      ? 'text-rose-600 dark:text-rose-400'
      : 'text-emerald-600 dark:text-emerald-400';

  return (
    <div className="mt-2 border border-border rounded-md overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-secondary/60 transition-colors"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <Icon className={`w-3.5 h-3.5 ${tone}`} />
          <span className="text-[11px] font-mono uppercase tracking-wide text-foreground">
            Evidence &middot; {percent}% grounded
          </span>
        </span>
        <span className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {supported}
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 ml-1" />
            {partial}
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 ml-1" />
            {unverified}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="p-2 space-y-1">
              {judged.map((sentence, index) => (
                <SentenceRow key={index} sentence={sentence} />
              ))}
            </div>
            <p className="px-3 pb-2.5 text-[10px] leading-relaxed text-muted-foreground">
              Each sentence is matched against the retrieved passages by word overlap.
              A high score means the wording is backed by your documents; a low one
              means it is worth checking, not that it is wrong.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
