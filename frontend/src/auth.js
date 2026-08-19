const TOKEN_KEY = 'agro_bi_token';
const SESSION_KEY = 'agro_bi_session';
const ROLE_KEY = 'agro_bi_role';
const USER_NAME_KEY = 'agro_bi_user_name';
const USER_EMAIL_KEY = 'agro_bi_user_email';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRole() {
  return localStorage.getItem(ROLE_KEY) || 'GERENTE';
}

export function getUserName() {
  return localStorage.getItem(USER_NAME_KEY) || '';
}

export function getUserEmail() {
  return localStorage.getItem(USER_EMAIL_KEY) || '';
}

export function isAuthenticated() {
  return localStorage.getItem(SESSION_KEY) === 'true' || !!getToken();
}

export function isAdmin() {
  return getRole() === 'ADMIN';
}

export function saveSession({ token, role, nome, email }) {
  // O token fica somente no cookie HttpOnly; o frontend guarda apenas metadados.
  localStorage.removeItem(TOKEN_KEY);
  localStorage.setItem(SESSION_KEY, 'true');
  localStorage.setItem(ROLE_KEY, role);
  if (nome) localStorage.setItem(USER_NAME_KEY, nome);
  if (email) localStorage.setItem(USER_EMAIL_KEY, email);
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(USER_NAME_KEY);
  localStorage.removeItem(USER_EMAIL_KEY);
}

export async function logout() {
  clearSession();
  // Notifica o backend para limpar o cookie HttpOnly.
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch (e) {
    // Ignora erros de rede no logout — a sessão local já foi limpa.
    console.warn('Falha ao notificar logout no servidor:', e);
  }
}

/**
 * Wrapper de fetch que adiciona automaticamente o header
 * 'Authorization: Bearer <TOKEN>' e envia cookies (credentials: 'include').
 */
export async function apiFetch(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // envia o cookie HttpOnly em todas as requisições
  });

  // Se receber 401 (token expirado/inválido), limpa a sessão.
  if (response.status === 401) {
    clearSession();
  }

  return response;
}

export function authHeaders() {
  return {};
}
