import { createContext, useContext, useState } from 'react';
import { post } from '../api/client.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const save = (u, token) => {
    setUser(u);
    localStorage.setItem('user', JSON.stringify(u));
    if (token) localStorage.setItem('token', token);
  };
  const login = async (email, password) => {
    const fallback = { user: { name: email.split('@')[0], email, phone: '', city: '' }, token: 'demo' };
    const r = await post('/auth/login', { email, password }, fallback);
    save(r.user, r.token);
  };
  const signup = async (form) => {
    const fallback = { user: { name: form.name, email: form.email, phone: form.phone || '', city: '' }, token: 'demo' };
    const r = await post('/auth/signup', form, fallback);
    save(r.user, r.token);
  };
  const updateUser = async (patch) => {
    const u = { ...user, ...patch };
    await post('/user/profile', u, null);
    save(u);
  };
  const logout = () => { setUser(null); localStorage.removeItem('user'); localStorage.removeItem('token'); };
  return <Ctx.Provider value={{ user, login, signup, updateUser, logout }}>{children}</Ctx.Provider>;
}
