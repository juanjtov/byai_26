import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { IconButton } from '@/components/ui/IconButton';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface Document {
  id: string;
  name: string;
  type: string;
  file_size: number | null;
  status: string;
}

interface DocumentCardProps {
  document: Document;
  onReprocess: () => void;
  onDelete: () => void;
  isReprocessing: boolean;
  typeLabel: string;
}

const documentTypeIcons: Record<string, ReactNode> = {
  contract: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  ),
  cost_sheet: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
    </svg>
  ),
  addendum: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  ),
  other: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
    </svg>
  ),
};

function formatFileSize(bytes: number | null): string {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentCard({
  document,
  onReprocess,
  onDelete,
  isReprocessing,
  typeLabel,
}: DocumentCardProps) {
  const icon = documentTypeIcons[document.type] || documentTypeIcons.other;
  const status = document.status as 'pending' | 'processing' | 'processed' | 'error';
  const canReprocess = status === 'error' || status === 'pending' || status === 'processed';

  return (
    <motion.div
      className={`
        p-4
        bg-ivory/[0.02]
        border-b border-ivory/10
        hover:bg-ivory/5
        transition-colors duration-200
        ${status === 'processing' ? 'animate-processing-pulse' : ''}
      `}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Desktop layout */}
      <div className="hidden sm:flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="w-10 h-10 bg-copper/10 rounded-lg flex items-center justify-center text-copper flex-shrink-0">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-ivory font-medium truncate">{document.name}</div>
            <div className="text-sm text-body">
              {typeLabel} &middot; {formatFileSize(document.file_size)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <StatusBadge status={status} />
          <div className="flex items-center gap-1">
            {canReprocess && (
              <IconButton
                icon="reprocess"
                onClick={onReprocess}
                disabled={isReprocessing}
                tooltip={isReprocessing ? 'Reprocessing...' : 'Reprocess'}
              />
            )}
            <IconButton
              icon="delete"
              onClick={onDelete}
              variant="danger"
              tooltip="Delete"
            />
          </div>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="sm:hidden">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 bg-copper/10 rounded-lg flex items-center justify-center text-copper flex-shrink-0">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-ivory font-medium line-clamp-2">{document.name}</div>
            <div className="text-sm text-body mt-0.5">
              {typeLabel} &middot; {formatFileSize(document.file_size)}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <StatusBadge status={status} />
          <div className="flex items-center gap-1">
            {canReprocess && (
              <IconButton
                icon="reprocess"
                onClick={onReprocess}
                disabled={isReprocessing}
                tooltip={isReprocessing ? 'Reprocessing...' : 'Reprocess'}
              />
            )}
            <IconButton
              icon="delete"
              onClick={onDelete}
              variant="danger"
              tooltip="Delete"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
