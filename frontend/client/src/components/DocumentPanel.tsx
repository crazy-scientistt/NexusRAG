/**
 * DocumentPanel Component
 * Displays uploaded documents and file upload area
 * Supports drag-drop and click-to-upload
 */

import { useRef, useState } from 'react';
import {
  Upload,
  File,
  Trash2,
  Eye,
  AlertCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Document } from '@/types';
import type { UploadProgress } from '@/hooks/useDocuments';
import type { FC } from 'react';

interface DocumentPanelProps {
  documents: Document[];
  uploads: Map<string, UploadProgress>;
  onUpload: (file: File, isTemp: boolean) => Promise<void>;
  onDelete: (docId: string) => void;
  onPreview: (docId: string) => void;
  isLoading: boolean;
  error: string | null;
}

export const DocumentPanel: FC<DocumentPanelProps> = ({
  documents,
  uploads,
  onUpload,
  onDelete,
  onPreview,
  isLoading,
  error,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isTemp, setIsTemp] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setUploadError(null);

    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      try {
        await onUpload(file, isTemp);
      } catch (err) {
        setUploadError(
          err instanceof Error ? err.message : 'Upload failed'
        );
      }
    }
  };

  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    setUploadError(null);

    for (const file of files) {
      try {
        await onUpload(file, isTemp);
      } catch (err) {
        setUploadError(
          err instanceof Error ? err.message : 'Upload failed'
        );
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-4 sm:p-6 text-center transition-all duration-300 backdrop-blur ${
          isDragging
            ? 'border-cyan-400/80 bg-cyan-50 dark:bg-white/10 shadow-lg scale-105'
            : 'border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-white/5 hover:border-cyan-300 dark:hover:border-cyan-300/60 hover:shadow-md'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.txt,.docx,.html,.htm"
          disabled={isLoading}
        />

        <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-500 dark:text-cyan-300 mx-auto mb-2" />
        <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-white mb-1">
          Drag files here or click to browse
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-300 mb-3">
          PDF, TXT, DOCX, HTML (max 50 MB)
        </p>

        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          size="sm"
          disabled={isLoading}
          className="text-xs sm:text-sm"
        >
          Select Files
        </Button>

        <label className="flex items-center justify-center gap-2 mt-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isTemp}
            onChange={(e) => setIsTemp(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <span className="text-xs text-slate-600 dark:text-slate-200">
            Temporary (auto-expire)
          </span>
        </label>
      </div>

      {/* Error Messages */}
      {(error || uploadError) && (
        <div className="flex gap-2 p-2 sm:p-3 bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-500/40 rounded-lg">
          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-200 flex-shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-red-700 dark:text-red-100">
            {error || uploadError}
          </p>
        </div>
      )}

      {/* Upload Progress */}
      {uploads.size > 0 && (
        <div className="space-y-2">
          {Array.from(uploads.values()).map((upload) => (
            <div
              key={upload.docId}
              className="p-2 sm:p-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg backdrop-blur animate-in fade-in slide-in-from-right-4 duration-300"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white truncate">
                  {upload.filename}
                </span>
                {upload.status === 'uploading' && (
                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin text-blue-500" />
                )}
              </div>
              <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-2">
                <div
                  className="bg-cyan-500 dark:bg-cyan-400 h-2 rounded-full transition-all"
                  style={{ width: `${upload.progress}%` }}
                />
              </div>
              {upload.error && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                  {upload.error}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Documents List */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
            Documents ({documents.length})
          </h3>
          <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 transition-all duration-300 group backdrop-blur animate-in fade-in slide-in-from-right-4 duration-300 hover:shadow-md hover:scale-105"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <File className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-500 dark:text-cyan-200 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white truncate">
                      {doc.filename}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-300">
                      {formatFileSize(doc.size_bytes)}
                      {doc.is_temp && (
                        <>
                          {' '}
                          • <Clock className="w-3 h-3 inline" /> Expires{' '}
                          {formatDate(doc.expires_at || '')}
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPreview(doc.id)}
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10"
                    title="Preview"
                  >
                    <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(doc.id)}
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-slate-600 dark:text-slate-200 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/40"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
