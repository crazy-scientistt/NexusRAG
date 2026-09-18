import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Cpu, Check } from 'lucide-react';
import type { ModelInfo } from '@/types';

interface ModelSelectorDropdownProps {
  models: ModelInfo[];
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  compact?: boolean;
}

export function ModelSelectorDropdown({
  models,
  selectedModelId,
  onSelectModel,
  compact = false,
}: ModelSelectorDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedModel = models.find((m) => m.id === selectedModelId) || models[0] || {
    id: selectedModelId,
    name: selectedModelId.split('/').pop() || selectedModelId,
    provider: 'OpenRouter',
    badge: 'Active',
    context_length: 128000,
    description: 'Cloud LLM inference model',
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatContextLength = (len?: number) => {
    if (!len) return '--';
    if (len >= 1000000) return `${(len / 1000000).toFixed(1)}M`;
    return `${Math.round(len / 1000)}K`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center gap-2 rounded-md border border-border bg-card hover:bg-secondary text-foreground transition-colors ${
          compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs'
        }`}
      >
        <div className="flex items-center justify-center w-4 h-4 rounded bg-foreground text-background">
          <Cpu className="w-2.5 h-2.5" />
        </div>

        <div className="flex items-center gap-1.5 text-left font-mono">
          <span className="font-semibold">{selectedModel.name}</span>
          <span className="text-[10px] text-muted-foreground">
            ({formatContextLength(selectedModel.context_length)})
          </span>
        </div>

        <ChevronDown
          className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-foreground' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 mt-1.5 w-80 rounded-md bg-card border border-border p-1.5 shadow-lg z-50 overflow-hidden text-foreground"
          >
            <div className="px-2.5 py-1.5 border-b border-border mb-1 flex items-center justify-between text-[10px] font-mono text-muted-foreground uppercase">
              <span>Select Model Engine</span>
              <span>OpenRouter</span>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1">
              {models.length === 0 && (
                <p className="px-2.5 py-3 text-[11px] text-muted-foreground">
                  Model catalog unavailable &mdash; could not reach the API.
                </p>
              )}
              {models.map((model) => {
                const isSelected = model.id === selectedModelId;
                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => {
                      onSelectModel(model.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded transition-colors flex items-start justify-between ${
                      isSelected
                        ? 'bg-secondary font-semibold text-foreground'
                        : 'hover:bg-secondary/60 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className="space-y-0.5 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-foreground font-medium">
                          {model.name}
                        </span>
                        <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-secondary border border-border text-muted-foreground">
                          {model.provider}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {model.description}
                      </p>
                    </div>

                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-foreground flex-shrink-0 mt-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
