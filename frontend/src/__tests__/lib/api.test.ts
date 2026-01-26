/**
 * Tests for the API wrapper module.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { api, authApi, organizationApi, documentApi, chatApi, waitlistApi } from '@/lib/api'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('api wrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('api function', () => {
    it('makes GET request by default', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: 'test' }),
      })

      await api('/test')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({ method: 'GET' })
      )
    })

    it('includes authorization header when token provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })

      await api('/test', { token: 'my-token' })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-token',
          }),
        })
      )
    })

    it('sends JSON body for POST requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })

      await api('/test', { method: 'POST', body: { name: 'test' } })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'test' }),
        })
      )
    })

    it('throws error on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ detail: 'Not found' }),
      })

      await expect(api('/test')).rejects.toThrow('Not found')
    })

    it('handles json parse error in error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.reject(new Error('Invalid JSON')),
      })

      await expect(api('/test')).rejects.toThrow('An error occurred')
    })
  })

  describe('authApi', () => {
    it('calls me endpoint with token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ user: {}, organization: null }),
      })

      await authApi.me('token123')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/auth/me'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer token123',
          }),
        })
      )
    })

    it('initializes organization', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ organization: { id: '123' }, is_new: true }),
      })

      const result = await authApi.initializeOrganization('Test Company', 'token')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/auth/initialize-organization'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ organization_name: 'Test Company' }),
        })
      )
      expect(result.is_new).toBe(true)
    })
  })

  describe('organizationApi', () => {
    const orgId = 'org-123'
    const token = 'token-abc'

    it('gets profile', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ company_name: 'Test' }),
      })

      await organizationApi.getProfile(orgId, token)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/organizations/${orgId}/profile`),
        expect.any(Object)
      )
    })

    it('updates profile', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ company_name: 'Updated' }),
      })

      await organizationApi.updateProfile(orgId, { company_name: 'Updated' }, token)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/organizations/${orgId}/profile`),
        expect.objectContaining({ method: 'PATCH' })
      )
    })

    it('gets pricing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ labor_rate_per_hour: 75 }),
      })

      await organizationApi.getPricing(orgId, token)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/organizations/${orgId}/pricing`),
        expect.any(Object)
      )
    })

    it('updates pricing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ labor_rate_per_hour: 85 }),
      })

      await organizationApi.updatePricing(orgId, { labor_rate_per_hour: 85 }, token)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/organizations/${orgId}/pricing`),
        expect.objectContaining({ method: 'PATCH' })
      )
    })

    it('gets labor items', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })

      await organizationApi.getLaborItems(orgId, token)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/organizations/${orgId}/labor-items`),
        expect.any(Object)
      )
    })

    it('creates labor item', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'item-1' }),
      })

      await organizationApi.createLaborItem(orgId, { name: 'Tile' }, token)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/organizations/${orgId}/labor-items`),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('updates labor item', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'item-1' }),
      })

      await organizationApi.updateLaborItem(orgId, 'item-1', { rate: 15 }, token)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/organizations/${orgId}/labor-items/item-1`),
        expect.objectContaining({ method: 'PATCH' })
      )
    })

    it('deletes labor item', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })

      await organizationApi.deleteLaborItem(orgId, 'item-1', token)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/organizations/${orgId}/labor-items/item-1`),
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })

  describe('documentApi', () => {
    const orgId = 'org-123'
    const token = 'token-abc'

    it('gets upload URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ upload_url: 'https://...', file_path: 'path' }),
      })

      await documentApi.getUploadUrl(orgId, 'doc.pdf', 'application/pdf', token)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/organizations/${orgId}/documents/upload-url`),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('creates document', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'doc-1' }),
      })

      await documentApi.create(orgId, { name: 'doc.pdf' }, token)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/organizations/${orgId}/documents`),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('lists documents', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })

      await documentApi.list(orgId, token)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/organizations/${orgId}/documents`),
        expect.any(Object)
      )
    })

    it('deletes document', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })

      await documentApi.delete(orgId, 'doc-1', token)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/organizations/${orgId}/documents/doc-1`),
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })

  describe('chatApi', () => {
    const orgId = 'org-123'
    const token = 'token-abc'

    it('creates conversation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'conv-1' }),
      })

      await chatApi.createConversation(orgId, 'Test Chat', token)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/organizations/${orgId}/chat/conversations`),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('lists conversations', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })

      await chatApi.listConversations(orgId, true, token)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/organizations/${orgId}/chat/conversations?saved_only=true`),
        expect.any(Object)
      )
    })

    it('gets stream URL', () => {
      const url = chatApi.getStreamUrl(orgId)
      expect(url).toContain(`/organizations/${orgId}/chat/stream`)
    })

    it('deletes conversation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })

      await chatApi.deleteConversation(orgId, 'conv-1', token)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/organizations/${orgId}/chat/conversations/conv-1`),
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })

  describe('waitlistApi', () => {
    it('joins waitlist', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'w-1', email: 'test@example.com', message: 'Success' }),
      })

      const result = await waitlistApi.join('test@example.com')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/waitlist'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com', source: 'landing_page' }),
        })
      )
      expect(result.email).toBe('test@example.com')
    })

    it('joins waitlist with custom source', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'w-1', email: 'test@example.com', message: 'Success' }),
      })

      await waitlistApi.join('test@example.com', 'referral')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ email: 'test@example.com', source: 'referral' }),
        })
      )
    })
  })
})
