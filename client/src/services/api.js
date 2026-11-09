const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

async function request(endpoint, options = {}, token = null) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.error?.message || `HTTP ${res.status}: Request failed`);
    error.status = res.status;
    error.code = data.error?.code;
    throw error;
  }

  return data;
}

export const api = {
  // Health
  getHealth: () => request('/api/health'),

  // Creator profile
  getCreator: () => request('/api/creator'),

  // User
  getUserProfile: (token) => request('/api/me', { method: 'GET' }, token),
  updateUserProfile: (token, updates) =>
    request('/api/me', { method: 'PATCH', body: JSON.stringify(updates) }, token),

  // Conversations
  getConversations: (token, { q = '', page = 1, limit = 50 } = {}) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (q) params.set('q', q);
    return request(`/api/conversations?${params.toString()}`, { method: 'GET' }, token);
  },

  createConversation: (token, title = 'New Conversation') =>
    request('/api/conversations', { method: 'POST', body: JSON.stringify({ title }) }, token),

  getConversation: (token, id) => request(`/api/conversations/${id}`, { method: 'GET' }, token),

  updateConversation: (token, id, updates) =>
    request(`/api/conversations/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }, token),

  deleteConversation: (token, id) =>
    request(`/api/conversations/${id}`, { method: 'DELETE' }, token),

  // Memories
  getMemories: (token) => request('/api/memories', { method: 'GET' }, token),

  createMemory: (token, content, category = 'fact') =>
    request('/api/memories', { method: 'POST', body: JSON.stringify({ content, category }) }, token),

  deleteMemory: (token, id) => request(`/api/memories/${id}`, { method: 'DELETE' }, token),

  clearMemories: (token) => request('/api/memories', { method: 'DELETE' }, token),

  // Message feedback
  submitFeedback: (token, messageId, feedback) =>
    request(
      `/api/chat/messages/${messageId}/feedback`,
      { method: 'POST', body: JSON.stringify({ feedback }) },
      token
    ),

  // Admin
  getAdminStats: (token) => request('/api/admin/stats', { method: 'GET' }, token),
  getAdminUsers: (token) => request('/api/admin/users', { method: 'GET' }, token),
  updateCreatorProfile: (token, data) =>
    request('/api/admin/creator', { method: 'PATCH', body: JSON.stringify(data) }, token),

  // Search & Web Scraping
  searchWeb: (query, mode = 'web', maxResults = 6, token = null) =>
    request('/api/search', { method: 'POST', body: JSON.stringify({ query, mode, maxResults }) }, token),

  searchAnswer: (query, mode = 'web', language = 'en', model = 'beam:cloud', token = null) =>
    request(
      '/api/search/answer',
      { method: 'POST', body: JSON.stringify({ query, mode, language, model }) },
      token
    ),

  extractUrl: (url, token = null) =>
    request('/api/scraper/extract', { method: 'POST', body: JSON.stringify({ url }) }, token),

  getSearchSources: (id, token = null) =>
    request(`/api/search/sources/${id}`, { method: 'GET' }, token),

  submitSearchFeedback: (searchId, rating, feedbackText = '', token = null) =>
    request(
      '/api/search/feedback',
      { method: 'POST', body: JSON.stringify({ searchId, rating, feedbackText }) },
      token
    ),

  // Streaming Chat via SSE
  streamChat: async ({
    token,
    conversationId,
    content,
    language = 'en',
    attachments = [],
    model = 'beam:cloud',
    searchMode = 'auto',
    onChunk,
    onStatus,
    onSources,
    onDone,
    onError,
    signal,
  }) => {
    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId,
          content,
          language,
          attachments,
          model,
          searchMode,
        }),
        signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}: Chat request failed`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const event = JSON.parse(jsonStr);

              if (event.status !== undefined && onStatus) {
                onStatus(event.status);
              }

              const discoveredSources = event.sources || event.citations;
              if (discoveredSources && onSources) {
                onSources(discoveredSources);
              }

              if (event.chunk && onChunk) {
                onChunk(event.chunk, discoveredSources);
              }

              if (event.done && onDone) {
                onDone(event.fullResponse, discoveredSources);
              }

              if (event.error && onError) {
                onError(new Error(event.error.message || 'Stream error'));
              }
            } catch (err) {
              console.warn('[SSE Parse Warning]:', err.message);
            }
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        if (onDone) onDone('');
        return;
      }
      if (onError) onError(err);
    }
  },
};

