(function () {
  const API_BASE = 'http://localhost:3006';
  const TOKEN_KEY = 'mf_token';

  async function safeParseResponse(res) {
    const text = await res.text();
    try { return text ? JSON.parse(text) : null; }
    catch { return text; }
  }

  async function apiFetch(path, opts = {}) {
    const url = `${API_BASE}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(opts.headers || {})
    };
    const res = await fetch(url, { ...opts, headers });
    const data = await safeParseResponse(res);

    if (!res.ok) {
      const message = data?.erro || data?.message || `Erro HTTP ${res.status}`;
      const error = new Error(message);
      error.status = res.status;
      error.body = data;
      throw error;
    }
    return data;
  }

  async function apiGet(path) { return apiFetch(path, { method: 'GET' }); }
  async function apiPost(path, body) {
    return apiFetch(path, { method: 'POST', body: JSON.stringify(body) });
  }

  function saveToken(token) { localStorage.setItem(TOKEN_KEY, token); }
  function getToken() { return localStorage.getItem(TOKEN_KEY); }
  function removeToken() { localStorage.removeItem(TOKEN_KEY); }

  async function apiAuthFetch(path, opts = {}) {
    const token = getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
    return apiFetch(path, { ...opts, headers });
  }
  const apiAuthGet = (path) => apiAuthFetch(path, { method: 'GET' });
  const apiAuthPost = (path, body) => apiAuthFetch(path, { method: 'POST', body: JSON.stringify(body) });

  window.MundoAPI = { apiGet, apiPost, apiAuthGet, apiAuthPost, saveToken, getToken, removeToken, API_BASE };
})();
