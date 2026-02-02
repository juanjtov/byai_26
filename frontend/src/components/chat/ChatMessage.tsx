import { useState } from 'react';
import type { ChatMessage as ChatMessageType } from '@/types/chat';

interface Props {
  message: ChatMessageType;
  onExport?: (messageId: string) => Promise<void>;
}

// Download icon SVG
function DownloadIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

export function ChatMessage({ message, onExport }: Props) {
  const [isExporting, setIsExporting] = useState(false);
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isAssistant = message.role === 'assistant';

  const handleExport = async () => {
    if (!onExport || isExporting) return;
    setIsExporting(true);
    try {
      await onExport(message.id);
    } finally {
      setIsExporting(false);
    }
  };

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="px-4 py-2 bg-ivory/5 rounded-lg text-sm text-body italic">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`group flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`relative max-w-[80%] px-4 py-3 rounded-2xl ${
          isUser
            ? 'bg-copper text-obsidian rounded-br-md'
            : 'bg-ivory/10 text-ivory rounded-bl-md'
        }`}
      >
        <div className="whitespace-pre-wrap break-words">{message.content}</div>

        {/* Download button for assistant messages */}
        {isAssistant && onExport && (
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="absolute -right-10 top-2 p-2 opacity-0 group-hover:opacity-100
                       text-ivory/40 hover:text-copper transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download as Word document"
          >
            {isExporting ? (
              <span className="inline-block w-4 h-4 border-2 border-copper/30 border-t-copper rounded-full animate-spin" />
            ) : (
              <DownloadIcon />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
