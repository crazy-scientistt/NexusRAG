import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Upload,
  FileText,
  Trash2,
  Eye,
  Clock,
  HardDrive,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { Document } from '@/types';
import { formatFileSize, formatDate } from '@/lib/utils';
import { apiClient } from '@/services/api';
import { useIsMobile } from '@/hooks/useMobile';

interface DocumentVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: Document[];
  onUpload: (files: FileList | null) => Promise<void>;
  onDelete: (docId: string) => Promise<void>;
  isUploading?: boolean;
}

export function DocumentVaultModal({
  isOpen,
  onClose,
  documents,
  onUpload,
  onDelete,
  isUploading = false,
}: DocumentVaultModalProps) {
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ filename: string; text?: string } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  if (!isOpen) return null;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    onUpload(e.dataTransfer.files);
  };

  const handlePreview = async (docId: string, filename: string) => {
    setPreviewLoading(true);
    try {
      const res = await apiClient.previewDocument(docId);
      setPreviewDoc({ filename, text: res.text || 'Preview not available for this file type.' });
    } catch (e) {
      setPreviewDoc({ filename, text: 'Failed to load document preview from server.' });
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex ${isMobile ? 'items-end justify-center' : 'items-center justify-center p-4'}`}>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-xs"
      />

      {/* Modal / Bottom Sheet */}
      <motion.div
        initial={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.98, y: 10 }}
        animate={isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
        exit={isMobile ? { y: '100%' } : { opacity: 0, scale: 0.98, y: 10 }}
        transition={{ duration: 0.2 }}
        className={`relative w-full max-w-2xl bg-card border border-border shadow-xl p-5 sm:p-8 space-y-5 z-10 overflow-y-auto text-foreground ${
          isMobile
            ? 'max-h-[88vh] rounded-t-2xl border-b-0 pb-[max(1.5rem,env(safe-area-inset-bottom))]'
            : 'max-h-[90vh] rounded-lg'
        }`}
      >
        {isMobile && <div className="w-12 h-1 rounded-full bg-border mx-auto mb-2 flex-shrink-0" />}

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold">Document Vault</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Upload dossiers, PDFs, and data files to index into your dense vector space.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drag & Drop Upload Target */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`p-6 sm:p-8 rounded-lg border-2 border-dashed text-center cursor-pointer transition-colors ${
            dragOver
              ? 'border-foreground bg-secondary'
              : 'border-border hover:border-foreground/40 bg-secondary/20'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.md,.json"
            onChange={(e) => onUpload(e.target.files)}
            className="hidden"
          />
          <Upload className="w-7 h-7 sm:w-8 sm:h-8 text-muted-foreground mx-auto mb-2.5" />
          <p className="text-xs sm:text-sm font-semibold mb-1">
            {isUploading ? 'Chunking & Indexing Embeddings...' : 'Tap to upload or drop documents'}
          </p>
          <p className="text-[11px] sm:text-xs text-muted-foreground">
            Supports PDF, DOCX, TXT, Markdown, JSON (up to 25MB)
          </p>
        </div>

        {/* Document List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-muted-foreground uppercase">
            <span>Indexed Documents ({documents.length})</span>
            <span>384D Vector Space</span>
          </div>

          {documents.length === 0 ? (
            <div className="p-6 rounded-md border border-border bg-secondary/30 text-center text-xs text-muted-foreground">
              No documents in this session vault yet. Upload a file above to begin grounded synthesis.
            </div>
          ) : (
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 rounded-md border border-border bg-secondary/30 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 truncate flex-1">
                    <FileText className="w-4 h-4 text-foreground flex-shrink-0" />
                    <div className="truncate">
                      <p className="font-semibold text-foreground truncate">{doc.filename}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">
                        {formatFileSize(doc.file_size)} &bull; {doc.chunk_count || '1'} chunks &bull; {formatDate(doc.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handlePreview(doc.id, doc.filename)}
                      title="Preview Text"
                      className="p-2 rounded border border-border text-muted-foreground hover:text-foreground hover:bg-secondary min-h-[36px] min-w-[36px] flex items-center justify-center"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(doc.id)}
                      title="Delete from Vault"
                      className="p-2 rounded border border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 min-h-[36px] min-w-[36px] flex items-center justify-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Text Preview Modal if open */}
        {previewDoc && (
          <div className="p-3.5 rounded-md border border-border bg-background space-y-2">
            <div className="flex items-center justify-between border-b border-border pb-2 text-xs font-mono">
              <span className="font-semibold truncate">Preview: {previewDoc.filename}</span>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
            </div>
            <div className="max-h-36 overflow-y-auto font-mono text-xs text-muted-foreground whitespace-pre-wrap">
              {previewLoading ? 'Loading document text...' : previewDoc.text}
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-border flex items-center justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-md bg-foreground text-background text-xs font-semibold"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}
