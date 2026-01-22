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
export const authApi = {
  signup: (email: string, password: string, organizationName: string) =>
    api('/api/v1/auth/signup', {
      method: 'POST',
      body: { email, password, organization_name: organizationName },
    }),

  login: (email: string, password: string) =>
    api('/api/v1/auth/login', {
      method: 'POST',
      body: { email, password },
    }),

  me: (token: string) =>
    api('/api/v1/auth/me', { token }),

  logout: (token: string) =>
    api('/api/v1/auth/logout', { method: 'POST', token }),
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
};
