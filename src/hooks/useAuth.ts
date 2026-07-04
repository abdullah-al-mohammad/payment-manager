import { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { AuthUser } from '../types';
import * as api from '../lib/sheets';

const TOKEN_KEY = 'pmToken';
const USER_KEY  = 'pmUser';
const URL_KEY   = 'pmWebAppUrl';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Restore URL first — must happen before any API call
    const url = localStorage.getItem(URL_KEY);
    if (url) api.setWebAppUrl(url);

    const token    = localStorage.getItem(TOKEN_KEY);
    const userJson = localStorage.getItem(USER_KEY);
    if (token && userJson) {
      try {
        const parsed = JSON.parse(userJson) as AuthUser;
        api.setToken(token);
        setUser(parsed);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
    setReady(true);
  }, []);

  const persist = (token: string, u: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    api.setToken(token);
    setUser(u);
  };

  const signup = useCallback(async (email: string, password: string) => {
    const { token, user: u } = await api.signup(email, password);
    persist(token, u);
    toast.success('Account created — your private spreadsheet is ready');
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user: u } = await api.login(email, password);
    persist(token, u);
    toast.success(`Welcome back, ${u.email}`);
  }, []);

  const logout = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    api.clearToken();
    setUser(null);
    if (token) {
      try { await api.logout(token); } catch { /* best-effort */ }
    }
  }, []);

  return { user, ready, signup, login, logout };
}
