import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

interface DropZoneProps {
  onFilesSelect: (files: File[]) => void;
  onRemoveFile?: (index: number) => void;
  selectedFiles?: File[];
  accept?: string;
  disabled?: boolean;
  uploading?: boolean;
  multiple?: boolean;
  className?: string;
}

export function DropZone({
  onFilesSelect,
  onRemoveFile,
  selectedFiles = [],
  accept = '.pdf,.doc,.docx,.xls,.xlsx',
  disabled = false,
  uploading = false,
  multiple = true,
  className = '',
}: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !uploading) {
      setIsDragging(true);
    }
  }, [disabled, uploading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled || uploading) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        onFilesSelect(multiple ? files : [files[0]]);
      }
    },
    [disabled, uploading, onFilesSelect, multiple]
  );

  const handleClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesSelect(multiple ? files : [files[0]]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const handleRemove = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    onRemoveFile?.(index);
  };

  const isActive = isDragging && !disabled && !uploading;
  const hasFiles = selectedFiles.length > 0;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={className}>
      <motion.div
        className="relative"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled || uploading}
        />

        <motion.div
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          role="button"
          tabIndex={disabled || uploading ? -1 : 0}
          aria-label="Upload documents, drag and drop or press enter to browse"
          className={`
            flex flex-col items-center justify-center
            min-h-[120px] p-6
            border-2 border-dashed rounded-xl
            transition-colors duration-200
            ${
              isActive
                ? 'border-copper bg-copper/5 animate-drop-zone-glow'
                : 'border-ivory/20 hover:border-ivory/40'
            }
            ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          animate={{
            scale: isActive ? 1.01 : 1,
            borderColor: isActive ? '#C88D74' : 'rgba(250, 248, 244, 0.2)',
          }}
          transition={{ duration: 0.2 }}
        >
          {uploading ? (
            <>
              <motion.div
                className="w-8 h-8 mb-3 text-copper"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </motion.div>
              <span className="text-ivory/60 text-sm">Uploading...</span>
            </>
          ) : (
            <>
              <motion.div
                className={`w-8 h-8 mb-2 ${isActive ? 'text-copper' : 'text-body'}`}
                animate={{ y: isActive ? -4 : 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </motion.div>

              <div className="hidden sm:block text-center">
                <p className="text-ivory/60 text-sm">
                  Drag & drop files here
                </p>
                <p className="mt-1">
                  <span className="text-copper text-sm hover:underline">
                    or click to browse
                  </span>
                </p>
              </div>

              <div className="sm:hidden text-center">
                <p className="text-copper text-sm">
                  Tap to upload
                </p>
              </div>

              <p className="mt-2 text-body/60 text-xs">
                .pdf, .docx, .xlsx
              </p>
            </>
          )}
        </motion.div>
      </motion.div>

      {/* Selected files list */}
      {hasFiles && !uploading && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-body/60">
            Selected files ({selectedFiles.length}):
          </p>
          <div className="space-y-1">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between gap-2 px-3 py-2 bg-ivory/5 rounded-lg"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-5 h-5 text-copper flex-shrink-0">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <span className="text-sm text-ivory truncate">{file.name}</span>
                  <span className="text-xs text-body/60 flex-shrink-0">
                    ({formatFileSize(file.size)})
                  </span>
                </div>
                {onRemoveFile && (
                  <button
                    type="button"
                    onClick={(e) => handleRemove(e, index)}
                    className="p-1 text-body/60 hover:text-red-400 transition-colors flex-shrink-0"
                    aria-label={`Remove ${file.name}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
