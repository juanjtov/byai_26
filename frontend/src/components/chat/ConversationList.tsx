import type { Conversation } from '@/types/chat';

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isSearching: boolean;
}

// Tag color mapping for visual distinction
const TAG_COLORS: Record<string, string> = {
  bathroom: 'bg-blue-500/20 text-blue-300',
  kitchen: 'bg-orange-500/20 text-orange-300',
  flooring: 'bg-amber-500/20 text-amber-300',
  roofing: 'bg-slate-500/20 text-slate-300',
  painting: 'bg-purple-500/20 text-purple-300',
  plumbing: 'bg-cyan-500/20 text-cyan-300',
  electrical: 'bg-yellow-500/20 text-yellow-300',
  hvac: 'bg-teal-500/20 text-teal-300',
  siding: 'bg-stone-500/20 text-stone-300',
  windows: 'bg-sky-500/20 text-sky-300',
  doors: 'bg-rose-500/20 text-rose-300',
  deck: 'bg-green-500/20 text-green-300',
  basement: 'bg-indigo-500/20 text-indigo-300',
  addition: 'bg-pink-500/20 text-pink-300',
};

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  searchQuery,
  onSearchChange,
  isSearching,
}: Props) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getTagColor = (tag: string) => {
    return TAG_COLORS[tag] || 'bg-gray-500/20 text-gray-300';
  };

  return (
    <div className="h-full flex flex-col bg-ivory/5 border border-ivory/10 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-ivory/10 space-y-3">
        <button
          onClick={onNew}
          className="w-full px-4 py-2 bg-copper text-obsidian font-medium rounded-lg hover:bg-copper/90 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Estimate
        </button>

        {/* Search input */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-body"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 bg-ivory/5 border border-ivory/10 rounded-lg text-ivory placeholder:text-body text-sm focus:outline-none focus:border-copper transition-colors"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg className="w-4 h-4 text-copper animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-body text-sm">
            {searchQuery ? 'No matching conversations' : 'No conversations yet'}
          </div>
        ) : (
          <div className="divide-y divide-ivory/10">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group relative p-4 cursor-pointer hover:bg-ivory/5 transition-colors ${
                  activeId === conv.id ? 'bg-ivory/10' : ''
                }`}
                onClick={() => onSelect(conv.id)}
              >
                {/* Title and message count */}
                <div className="flex items-start justify-between gap-2 pr-8">
                  <div className="text-sm text-ivory font-medium truncate flex-1">
                    {conv.title || 'Untitled Estimate'}
                  </div>
                  {conv.message_count !== undefined && conv.message_count > 0 && (
                    <span className="text-xs text-body whitespace-nowrap">
                      {conv.message_count} msg{conv.message_count !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Summary */}
                {conv.summary && (
                  <div className="text-xs text-body/80 mt-1 line-clamp-2">
                    {conv.summary}
                  </div>
                )}

                {/* Tags */}
                {conv.tags && conv.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {conv.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className={`text-xs px-2 py-0.5 rounded-full ${getTagColor(tag)}`}
                      >
                        {tag}
                      </span>
                    ))}
                    {conv.tags.length > 3 && (
                      <span className="text-xs text-body">
                        +{conv.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Date */}
                <div className="text-xs text-body mt-2">
                  {formatDate(conv.updated_at)}
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Delete this conversation?')) {
                      onDelete(conv.id);
                    }
                  }}
                  className="absolute right-2 top-4 p-2 text-red-400/60 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete conversation"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
