import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api, { getToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api.get('/auth/me')
      .then((res) => setUser(res.data.data))
      .catch(() => {
        localStorage.removeItem('lumen_token');
        sessionStorage.removeItem('lumen_token');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password, remember) => {
    const { data } = await api.post('/auth/login', { email, password, remember });
    localStorage.removeItem('lumen_token');
    sessionStorage.removeItem('lumen_token');
    const store = remember ? localStorage : sessionStorage;
    store.setItem('lumen_token', data.data.token);
    setUser(data.data.user);
    return data.data.user;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch { /* token may already be dead */ }
    localStorage.removeItem('lumen_token');
    sessionStorage.removeItem('lumen_token');
    setUser(null);
  };

  const can = (...perms) => {
    if (!user) return false;
    if (user.role?.slug === 'super-admin') return true;
    return perms.some((perm) => user.role?.permissions?.includes(perm));
  };

  const value = useMemo(() => ({ user, loading, login, logout, can, setUser }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
