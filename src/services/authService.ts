import { API_CONFIG } from '@/config/api';
import { http, setAuthToken } from './httpClient';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
}

interface LoginResponse {
  user: AuthUser;
  token: string;
}

// ─── Données mock (localStorage) ──────────────────────────────
const DEMO_USERS = [
  { email: 'adminctn@gmail.com', password: 'Admin@09', fullName: 'Administrateur' },
];

function mockLogin(email: string, password: string): AuthUser | null {
  const registered = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
  const all = [...DEMO_USERS, ...registered];
  const found = all.find(u => u.email === email && u.password === password);
  if (!found) return null;
  return { id: btoa(found.email), email: found.email, fullName: found.fullName };
}

function mockRegister(email: string, password: string, fullName: string): AuthUser | null {
  const registered = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
  const all = [...DEMO_USERS, ...registered];
  if (all.some(u => u.email === email)) return null;
  registered.push({ email, password, fullName });
  localStorage.setItem('registeredUsers', JSON.stringify(registered));
  return { id: btoa(email), email, fullName };
}

// ─── Service public ───────────────────────────────────────────
export const authService = {
  async login(email: string, password: string): Promise<AuthUser | null> {
    if (API_CONFIG.USE_MOCK) {
      await delay(400);
      const user = mockLogin(email, password);
      if (user) localStorage.setItem('currentUser', JSON.stringify(user));
      return user;
    }
    // Laravel Sanctum
    const { user, token } = await http.post<LoginResponse>('/login', { email, password });
    setAuthToken(token);
    return user;
  },

  async register(email: string, password: string, fullName: string): Promise<AuthUser | null> {
    if (API_CONFIG.USE_MOCK) {
      await delay(400);
      const user = mockRegister(email, password, fullName);
      if (user) localStorage.setItem('currentUser', JSON.stringify(user));
      return user;
    }
    const { user, token } = await http.post<LoginResponse>('/register', {
      email, password, full_name: fullName,
    });
    setAuthToken(token);
    return user;
  },

  async logout(): Promise<void> {
    if (API_CONFIG.USE_MOCK) {
      localStorage.removeItem('currentUser');
      return;
    }
    await http.post('/logout');
    setAuthToken(null);
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    if (API_CONFIG.USE_MOCK) {
      const stored = localStorage.getItem('currentUser');
      return stored ? JSON.parse(stored) : null;
    }
    try {
      return await http.get<AuthUser>('/user');
    } catch {
      return null;
    }
  },
};

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
