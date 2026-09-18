import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cpu, Check } from 'lucide-react';
import type { ModelInfo } from '@/types';

interface MobileModelSheetProps {
  isOpen: boolean;
  onClose: () => void;
  models: ModelInfo[];
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
}

export function MobileModelSheet({
  isOpen,
  onClose,
  models,
  selectedModelId,
  onSelectModel,
}: MobileModelSheetProps) {
  if (!isOpen) return null;

  const formatContext = (len?: number) => {
    if (!len) return '128K';
    if (len >= 1000000) return `${(len / 1000000).toFixed(1)}M`;
    return `${Math.round(len / 1000)}K`;
  };

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
                <Cpu className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-display font-bold text-base">Select Model Engine</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Models List */}
          <div className="flex-1 overflow-y-auto space-y-2 py-1">
            {models.map((model) => {
              const isSelected = model.id === selectedModelId;
              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => {
                    onSelectModel(model.id);
                    onClose();
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-colors flex items-start justify-between min-h-[56px] ${
                    isSelected
                      ? 'bg-secondary border-foreground text-foreground font-semibold'
                      : 'border-border hover:bg-secondary/40 text-muted-foreground'
                  }`}
                >
                  <div className="space-y-1 flex-1 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {model.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-secondary border border-border text-muted-foreground">
                        {model.provider}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {formatContext(model.context_length)} ctx
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {model.description}
                    </p>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center flex-shrink-0 mt-1">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
