import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { chatApi } from '@/lib/api';
import type { ChatMessage, Conversation } from '@/types/chat';

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  conversationId: string | null;
  conversations: Conversation[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearching: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  loadConversation: (id: string) => Promise<void>;
  startNewConversation: () => void;
  deleteConversation: (id: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
  clearError: () => void;
}

const ACTIVE_CONVERSATION_KEY = 'remodly_active_conversation';

function getStoredConversationId(orgId: string): string | null {
  try {
    const stored = sessionStorage.getItem(ACTIVE_CONVERSATION_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Only restore if it's for the same organization
      if (parsed.orgId === orgId) {
        return parsed.conversationId;
      }
    }
  } catch {
    // Ignore storage errors
  }
  return null;
}

function storeConversationId(orgId: string, conversationId: string | null): void {
  try {
    if (conversationId) {
      sessionStorage.setItem(ACTIVE_CONVERSATION_KEY, JSON.stringify({ orgId, conversationId }));
    } else {
      sessionStorage.removeItem(ACTIVE_CONVERSATION_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export function useChat(): UseChatReturn {
  const { organization, accessToken } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Conversation[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasRestoredRef = useRef(false);

  const clearError = useCallback(() => setError(null), []);

  // Debounced search effect
  useEffect(() => {
    if (!organization?.id || !accessToken) return;

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim()) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    // Debounce search by 300ms
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await chatApi.searchConversations(
          organization.id,
          searchQuery,
          accessToken
        );
        setSearchResults(results);
      } catch (err) {
        console.error('Search failed:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, organization?.id, accessToken]);

  // Memoized conversation list - use search results when searching
  const displayedConversations = useMemo(() => {
    return searchResults !== null ? searchResults : conversations;
  }, [searchResults, conversations]);

  // Persist conversation ID changes to sessionStorage
  useEffect(() => {
    if (organization?.id && hasRestoredRef.current) {
      storeConversationId(organization.id, conversationId);
    }
  }, [conversationId, organization?.id]);

  const refreshConversations = useCallback(async () => {
    if (!organization?.id || !accessToken) return;

    try {
      // All conversations are auto-saved now, so savedOnly=false
      const convs = await chatApi.listConversations(organization.id, false, accessToken);
      setConversations(convs);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
  }, [organization?.id, accessToken]);

  // Load conversations on mount and restore active conversation
  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  // Restore active conversation from sessionStorage on mount
  useEffect(() => {
    if (!organization?.id || !accessToken || hasRestoredRef.current) return;

    const storedId = getStoredConversationId(organization.id);
    if (storedId) {
      // Mark as restored before loading to prevent re-triggering
      hasRestoredRef.current = true;

      // Load the conversation
      (async () => {
        try {
          const conv = await chatApi.getConversation(organization.id, storedId, accessToken);
          setConversationId(conv.id);
          setMessages(conv.messages);
        } catch (err) {
          console.error('Failed to restore conversation:', err);
          // Clear invalid stored conversation
          storeConversationId(organization.id, null);
        }
      })();
    } else {
      hasRestoredRef.current = true;
    }
  }, [organization?.id, accessToken]);

  const sendMessage = useCallback(async (content: string) => {
    if (!organization?.id || !accessToken || !content.trim()) return;

    setError(null);

    // Add user message optimistically
    const tempUserMessage: ChatMessage = {
      id: `temp-user-${Date.now()}`,
      conversation_id: conversationId || '',
      role: 'user',
      content: content.trim(),
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMessage]);
    setIsLoading(true);

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(chatApi.getStreamUrl(organization.id), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          message: content.trim(),
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      // Prepare assistant message
      let assistantMessage: ChatMessage = {
        id: `temp-assistant-${Date.now()}`,
        conversation_id: conversationId || '',
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString(),
      };

      // Add empty assistant message to show typing
      setMessages(prev => [...prev, assistantMessage]);
      setIsStreaming(true);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'start' && data.conversation_id) {
                // Set conversation ID from response
                setConversationId(data.conversation_id);
                assistantMessage = {
                  ...assistantMessage,
                  conversation_id: data.conversation_id,
                };
              } else if (data.type === 'chunk' && data.content) {
                // Append content chunk
                assistantMessage = {
                  ...assistantMessage,
                  content: assistantMessage.content + data.content,
                };
                setMessages(prev => [
                  ...prev.slice(0, -1),
                  assistantMessage,
                ]);
              } else if (data.type === 'error') {
                setError(data.message || 'An error occurred');
              }
            } catch {
              // Skip invalid JSON lines
            }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Chat error:', err);
        setError((err as Error).message || 'Failed to send message');
        // Remove the optimistic message on error
        setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id));
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, [organization?.id, accessToken, conversationId]);

  const loadConversation = useCallback(async (id: string) => {
    if (!organization?.id || !accessToken) return;

    setError(null);
    setIsLoading(true);

    try {
      const conv = await chatApi.getConversation(organization.id, id, accessToken);
      setConversationId(conv.id);
      setMessages(conv.messages);
    } catch (err) {
      console.error('Failed to load conversation:', err);
      setError('Failed to load conversation');
    } finally {
      setIsLoading(false);
    }
  }, [organization?.id, accessToken]);

  const startNewConversation = useCallback(() => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setConversationId(null);
    setMessages([]);
    setError(null);
    setIsLoading(false);
    setIsStreaming(false);
    // Clear stored conversation so we don't restore it on next visit
    if (organization?.id) {
      storeConversationId(organization.id, null);
    }
  }, [organization?.id]);

  const deleteConversation = useCallback(async (id: string) => {
    if (!organization?.id || !accessToken) return;

    setError(null);

    try {
      await chatApi.deleteConversation(organization.id, id, accessToken);

      // If we deleted the current conversation, start fresh
      if (id === conversationId) {
        startNewConversation();
      }

      await refreshConversations();
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      setError('Failed to delete conversation');
    }
  }, [organization?.id, accessToken, conversationId, startNewConversation, refreshConversations]);

  return {
    messages,
    isLoading,
    isStreaming,
    conversationId,
    conversations: displayedConversations,
    searchQuery,
    setSearchQuery,
    isSearching,
    error,
    sendMessage,
    loadConversation,
    startNewConversation,
    deleteConversation,
    refreshConversations,
    clearError,
  };
}
