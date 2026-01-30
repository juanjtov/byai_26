import { useEffect, useRef } from 'react';
import { useChat } from '@/hooks/useChat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ConversationList } from './ConversationList';
import { TypingIndicator } from './TypingIndicator';

export function ChatInterface() {
  const {
    messages,
    isLoading,
    isStreaming,
    conversationId,
    conversations,
    searchQuery,
    setSearchQuery,
    isSearching,
    error,
    sendMessage,
    loadConversation,
    startNewConversation,
    deleteConversation,
    clearError,
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex h-[calc(100vh-12rem)] gap-6">
      {/* Sidebar - Conversations */}
      <div className="w-72 flex-shrink-0">
        <ConversationList
          conversations={conversations}
          activeId={conversationId}
          onSelect={loadConversation}
          onNew={startNewConversation}
          onDelete={deleteConversation}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isSearching={isSearching}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-ivory/5 border border-ivory/10 rounded-xl overflow-hidden">
        {/* Error Banner */}
        {error && (
          <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/50 text-red-400 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-300"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-body">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 mx-auto mb-4 bg-copper/20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-copper" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl text-ivory mb-2">Start an Estimate</h3>
                <p className="text-body">
                  Describe the project you need to estimate. Include details like room dimensions,
                  materials, and any specific requirements.
                </p>
                <div className="mt-4 text-sm text-body/80">
                  <p className="font-medium text-ivory mb-2">Example prompts:</p>
                  <ul className="space-y-1 text-left">
                    <li>&quot;I need to estimate a bathroom remodel with new tile floors&quot;</li>
                    <li>&quot;Kitchen cabinet replacement, 15 linear feet&quot;</li>
                    <li>&quot;Paint 3 bedrooms, approximately 400 sq ft each&quot;</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              {isLoading && !isStreaming && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <ChatInput
          onSend={sendMessage}
          disabled={isLoading}
          isSending={isLoading}
        />
      </div>
    </div>
  );
}
