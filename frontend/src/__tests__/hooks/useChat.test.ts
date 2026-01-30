/**
 * Tests for the useChat hook.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useChat } from '@/hooks/useChat'
import { chatApi } from '@/lib/api'

// Mock the auth context
const mockOrganization = { id: 'org-123', name: 'Test Org', slug: 'test-org', role: 'owner' }
const mockAccessToken = 'test-token'

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    organization: mockOrganization,
    accessToken: mockAccessToken,
  }),
}))

// Mock the chat API
vi.mock('@/lib/api', () => ({
  chatApi: {
    listConversations: vi.fn(),
    searchConversations: vi.fn(),
    getConversation: vi.fn(),
    createConversation: vi.fn(),
    updateConversation: vi.fn(),
    deleteConversation: vi.fn(),
    getStreamUrl: vi.fn(() => 'http://localhost:8000/api/v1/organizations/org-123/chat/stream'),
  },
}))

// Mock fetch for streaming
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useChat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()

    // Default mock implementations
    vi.mocked(chatApi.listConversations).mockResolvedValue([])
    vi.mocked(chatApi.getConversation).mockResolvedValue({
      id: 'conv-1',
      organization_id: 'org-123',
      user_id: 'user-1',
      title: 'Test Conversation',
      is_saved: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      messages: [],
    })
  })

  describe('initial state', () => {
    it('starts with empty messages', async () => {
      const { result } = renderHook(() => useChat())

      await waitFor(() => {
        expect(result.current.messages).toEqual([])
      })
    })

    it('starts with no conversation ID', async () => {
      const { result } = renderHook(() => useChat())

      await waitFor(() => {
        expect(result.current.conversationId).toBeNull()
      })
    })

    it('loads conversations on mount', async () => {
      renderHook(() => useChat())

      await waitFor(() => {
        // All conversations are auto-saved now, so savedOnly=false
        expect(chatApi.listConversations).toHaveBeenCalledWith(
          mockOrganization.id,
          false,
          mockAccessToken
        )
      })
    })
  })

  describe('session storage restoration', () => {
    it('restores conversation from sessionStorage', async () => {
      // Store a conversation ID in session storage
      sessionStorage.setItem(
        'remodly_active_conversation',
        JSON.stringify({ orgId: 'org-123', conversationId: 'conv-1' })
      )

      vi.mocked(chatApi.getConversation).mockResolvedValue({
        id: 'conv-1',
        organization_id: 'org-123',
        user_id: 'user-1',
        title: 'Restored Conversation',
        is_saved: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        messages: [
          { id: 'msg-1', conversation_id: 'conv-1', role: 'user', content: 'Hello', created_at: '2024-01-01T00:00:00Z' },
        ],
      })

      const { result } = renderHook(() => useChat())

      await waitFor(() => {
        expect(result.current.conversationId).toBe('conv-1')
        expect(result.current.messages).toHaveLength(1)
      })
    })

    it('ignores stored conversation from different org', async () => {
      sessionStorage.setItem(
        'remodly_active_conversation',
        JSON.stringify({ orgId: 'different-org', conversationId: 'conv-1' })
      )

      const { result } = renderHook(() => useChat())

      await waitFor(() => {
        expect(result.current.conversationId).toBeNull()
      })
      expect(chatApi.getConversation).not.toHaveBeenCalled()
    })
  })

  describe('loadConversation', () => {
    it('loads a conversation and its messages', async () => {
      vi.mocked(chatApi.getConversation).mockResolvedValue({
        id: 'conv-2',
        organization_id: 'org-123',
        user_id: 'user-1',
        title: 'Loaded Conversation',
        is_saved: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        messages: [
          { id: 'msg-1', conversation_id: 'conv-2', role: 'user', content: 'Test', created_at: '2024-01-01T00:00:00Z' },
          { id: 'msg-2', conversation_id: 'conv-2', role: 'assistant', content: 'Response', created_at: '2024-01-01T00:00:00Z' },
        ],
      })

      const { result } = renderHook(() => useChat())

      await act(async () => {
        await result.current.loadConversation('conv-2')
      })

      expect(result.current.conversationId).toBe('conv-2')
      expect(result.current.messages).toHaveLength(2)
    })

    it('sets error on failure', async () => {
      vi.mocked(chatApi.getConversation).mockRejectedValue(new Error('Not found'))

      const { result } = renderHook(() => useChat())

      await act(async () => {
        await result.current.loadConversation('invalid-id')
      })

      expect(result.current.error).toBe('Failed to load conversation')
    })
  })

  describe('startNewConversation', () => {
    it('clears messages and conversation ID', async () => {
      const { result } = renderHook(() => useChat())

      // First load a conversation
      vi.mocked(chatApi.getConversation).mockResolvedValue({
        id: 'conv-1',
        organization_id: 'org-123',
        user_id: 'user-1',
        title: 'Test',
        is_saved: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        messages: [{ id: 'msg-1', conversation_id: 'conv-1', role: 'user', content: 'Hello', created_at: '2024-01-01T00:00:00Z' }],
      })

      await act(async () => {
        await result.current.loadConversation('conv-1')
      })

      expect(result.current.messages).toHaveLength(1)

      // Start new conversation
      act(() => {
        result.current.startNewConversation()
      })

      expect(result.current.conversationId).toBeNull()
      expect(result.current.messages).toEqual([])
      expect(result.current.error).toBeNull()
    })
  })

  describe('deleteConversation', () => {
    it('deletes the specified conversation', async () => {
      vi.mocked(chatApi.deleteConversation).mockResolvedValue({})

      const { result } = renderHook(() => useChat())

      await act(async () => {
        await result.current.deleteConversation('conv-1')
      })

      expect(chatApi.deleteConversation).toHaveBeenCalledWith(
        'org-123',
        'conv-1',
        mockAccessToken
      )
    })

    it('starts new conversation if current is deleted', async () => {
      vi.mocked(chatApi.deleteConversation).mockResolvedValue({})

      const { result } = renderHook(() => useChat())

      // Load a conversation first
      await act(async () => {
        await result.current.loadConversation('conv-1')
      })

      expect(result.current.conversationId).toBe('conv-1')

      // Delete the current conversation
      await act(async () => {
        await result.current.deleteConversation('conv-1')
      })

      expect(result.current.conversationId).toBeNull()
      expect(result.current.messages).toEqual([])
    })
  })

  describe('clearError', () => {
    it('clears the error state', async () => {
      vi.mocked(chatApi.getConversation).mockRejectedValue(new Error('Error'))

      const { result } = renderHook(() => useChat())

      await act(async () => {
        await result.current.loadConversation('invalid')
      })

      expect(result.current.error).not.toBeNull()

      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })
  })

  describe('refreshConversations', () => {
    it('fetches all conversations (auto-saved)', async () => {
      vi.mocked(chatApi.listConversations).mockResolvedValue([
        {
          id: 'conv-1',
          organization_id: 'org-123',
          user_id: 'user-1',
          title: 'Conversation 1',
          summary: 'A bathroom remodel project',
          tags: ['bathroom'],
          message_count: 5,
          is_saved: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ])

      const { result } = renderHook(() => useChat())

      await waitFor(() => {
        expect(result.current.conversations).toHaveLength(1)
        expect(result.current.conversations[0].summary).toBe('A bathroom remodel project')
      })
    })
  })

  describe('search', () => {
    it('has initial search state', async () => {
      const { result } = renderHook(() => useChat())

      await waitFor(() => {
        expect(result.current.searchQuery).toBe('')
        expect(result.current.isSearching).toBe(false)
      })
    })
  })
})
