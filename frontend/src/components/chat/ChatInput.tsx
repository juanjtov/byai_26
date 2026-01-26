import { useState, type KeyboardEvent } from 'react';

interface Props {
  onSend: (content: string) => void;
  onSave: () => void;
  disabled: boolean;
  canSave: boolean;
  isSending: boolean;
}

export function ChatInput({ onSend, onSave, disabled, canSave, isSending }: Props) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim() || disabled) return;
    onSend(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 border-t border-ivory/10 bg-obsidian/50">
      <div className="flex items-end gap-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your project or ask a question..."
          className="flex-1 px-4 py-3 bg-ivory/5 border border-ivory/10 rounded-lg text-ivory placeholder:text-body resize-none focus:outline-none focus:border-copper transition-colors"
          rows={2}
          disabled={disabled}
        />
        <div className="flex flex-col gap-2">
          <button
            onClick={handleSend}
            disabled={disabled || !input.trim()}
            className="px-6 py-3 bg-copper text-obsidian font-medium rounded-lg hover:bg-copper/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSending ? (
              <>
                <span className="animate-spin">&#9696;</span>
                Sending
              </>
            ) : (
              'Send'
            )}
          </button>
          {canSave && (
            <button
              onClick={onSave}
              className="px-4 py-2 text-sm text-ivory/60 hover:text-ivory transition-colors"
            >
              Save Chat
            </button>
          )}
        </div>
      </div>
      <p className="mt-2 text-xs text-body">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}
