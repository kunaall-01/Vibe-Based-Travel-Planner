import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem('token');
      const stored = localStorage.getItem('user');
      return token && stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [ready, setReady] = useState(false);

  const save = (u, token) => {
    setUser(u);
    if (u) localStorage.setItem('user', JSON.stringify(u));
    else localStorage.removeItem('user');
    if (token) localStorage.setItem('token', token);
  };

  // Verify stored token against the SQLite backend on startup
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      save(null);
      setReady(true);
      return;
    }
    api.get('/user/profile')
      .then((res) => {
        if (res.data?.user) save(res.data.user);
      })
      .catch(() => {
        localStorage.removeItem('token');
        save(null);
      })
      .finally(() => setReady(true));
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      save(res.data.user, res.data.token);
      return res.data.user;
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to log in. Please check your credentials.';
      throw new Error(msg);
    }
  };

  const signup = async (form) => {
    try {
      const res = await api.post('/auth/signup', form);
      save(res.data.user, res.data.token);
      return res.data.user;
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to create account.';
      throw new Error(msg);
    }
  };

  const updateUser = async (patch) => {
    try {
      const payload = { ...user, ...patch };
      const res = await api.post('/user/profile', payload);
      save(res.data.user);
      return res.data.user;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save profile.';
      throw new Error(msg);
    }
  };

  const logout = async () => {
    try {
      if (localStorage.getItem('token')) await api.post('/auth/logout');
    } catch {
      // ignore
    }
    localStorage.removeItem('token');
    save(null);
  };

  return (
    <Ctx.Provider value={{ user, ready, login, signup, updateUser, logout }}>
      {children}
    </Ctx.Provider>
  );
}
