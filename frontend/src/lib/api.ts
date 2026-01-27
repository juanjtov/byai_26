const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string;
}

export async function api<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(error.detail || 'An error occurred');
  }

  return response.json();
}

// Auth endpoints
// Note: signup/login/logout are now handled by Supabase directly
export const authApi = {
  // Get current user and their organization
  me: (token: string) =>
    api('/api/v1/auth/me', { token }),

  // Initialize organization after Supabase signup
  initializeOrganization: (organizationName: string, token: string) =>
    api<{ organization: { id: string; name: string; slug: string; role: string }; is_new: boolean }>(
      '/api/v1/auth/initialize-organization',
      {
        method: 'POST',
        body: { organization_name: organizationName },
        token,
      }
    ),
};

// Organization endpoints
export const organizationApi = {
  getProfile: (orgId: string, token: string) =>
    api(`/api/v1/organizations/${orgId}/profile`, { token }),

  updateProfile: (orgId: string, data: Record<string, unknown>, token: string) =>
    api(`/api/v1/organizations/${orgId}/profile`, {
      method: 'PATCH',
      body: data,
      token,
    }),

  getPricing: (orgId: string, token: string) =>
    api(`/api/v1/organizations/${orgId}/pricing`, { token }),

  updatePricing: (orgId: string, data: Record<string, unknown>, token: string) =>
    api(`/api/v1/organizations/${orgId}/pricing`, {
      method: 'PATCH',
      body: data,
      token,
    }),

  getLaborItems: (orgId: string, token: string) =>
    api(`/api/v1/organizations/${orgId}/labor-items`, { token }),

  createLaborItem: (orgId: string, data: Record<string, unknown>, token: string) =>
    api(`/api/v1/organizations/${orgId}/labor-items`, {
      method: 'POST',
      body: data,
      token,
    }),

  updateLaborItem: (orgId: string, itemId: string, data: Record<string, unknown>, token: string) =>
    api(`/api/v1/organizations/${orgId}/labor-items/${itemId}`, {
      method: 'PATCH',
      body: data,
      token,
    }),

  deleteLaborItem: (orgId: string, itemId: string, token: string) =>
    api(`/api/v1/organizations/${orgId}/labor-items/${itemId}`, {
      method: 'DELETE',
      token,
    }),
};

// Document endpoints
export const documentApi = {
  getUploadUrl: (orgId: string, filename: string, contentType: string, token: string) =>
    api(`/api/v1/organizations/${orgId}/documents/upload-url`, {
      method: 'POST',
      body: { filename, content_type: contentType },
      token,
    }),

  create: (orgId: string, data: Record<string, unknown>, token: string) =>
    api(`/api/v1/organizations/${orgId}/documents`, {
      method: 'POST',
      body: data,
      token,
    }),

  list: (orgId: string, token: string) =>
    api(`/api/v1/organizations/${orgId}/documents`, { token }),

  get: (orgId: string, docId: string, token: string) =>
    api(`/api/v1/organizations/${orgId}/documents/${docId}`, { token }),

  getDownloadUrl: (orgId: string, docId: string, token: string) =>
    api(`/api/v1/organizations/${orgId}/documents/${docId}/download-url`, { token }),

  delete: (orgId: string, docId: string, token: string) =>
    api(`/api/v1/organizations/${orgId}/documents/${docId}`, {
      method: 'DELETE',
      token,
    }),

  reprocess: (orgId: string, docId: string, token: string) =>
    api<{ message: string; status: string }>(
      `/api/v1/organizations/${orgId}/documents/${docId}/reprocess`,
      {
        method: 'POST',
        token,
      }
    ),
};

// Chat types - re-exported from types/chat.ts
export type { ChatMessage, Conversation, ConversationWithMessages } from '@/types/chat';
import type { Conversation, ConversationWithMessages } from '@/types/chat';

// Chat endpoints
export const chatApi = {
  // Create new conversation
  createConversation: (orgId: string, title: string | null, token: string) =>
    api<Conversation>(`/api/v1/organizations/${orgId}/chat/conversations`, {
      method: 'POST',
      body: { title },
      token,
    }),

  // List conversations
  listConversations: (orgId: string, savedOnly: boolean, token: string) =>
    api<Conversation[]>(
      `/api/v1/organizations/${orgId}/chat/conversations?saved_only=${savedOnly}`,
      { token }
    ),

  // Get single conversation with messages
  getConversation: (orgId: string, conversationId: string, token: string) =>
    api<ConversationWithMessages>(
      `/api/v1/organizations/${orgId}/chat/conversations/${conversationId}`,
      { token }
    ),

  // Update conversation (save, rename)
  updateConversation: (
    orgId: string,
    conversationId: string,
    data: { title?: string; is_saved?: boolean },
    token: string
  ) =>
    api<Conversation>(
      `/api/v1/organizations/${orgId}/chat/conversations/${conversationId}`,
      {
        method: 'PATCH',
        body: data,
        token,
      }
    ),

  // Delete conversation
  deleteConversation: (orgId: string, conversationId: string, token: string) =>
    api(`/api/v1/organizations/${orgId}/chat/conversations/${conversationId}`, {
      method: 'DELETE',
      token,
    }),

  // Get stream URL for SSE
  getStreamUrl: (orgId: string) =>
    `${API_URL}/api/v1/organizations/${orgId}/chat/stream`,
};

// Waitlist endpoints (public, no auth required)
export const waitlistApi = {
  join: (email: string, source: string = 'landing_page') =>
    api<{ id: string; email: string; message: string }>('/api/v1/waitlist', {
      method: 'POST',
      body: { email, source },
    }),
};
