import axios from 'axios';
import { useEffect, useState } from 'react';

// Flask backend base URL (set VITE_API_URL in .env). If the backend is offline,
// every call falls back to the mock data so the UI always works.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 3000,
});

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export async function get(path, fallback) {
  try { return (await api.get(path)).data; } catch { return fallback; }
}
export async function post(path, body, fallback) {
  try { return (await api.post(path, body)).data; } catch { return fallback; }
}

export function useApi(path, fallback) {
  const [data, setData] = useState(fallback);
  useEffect(() => {
    let live = true;
    get(path, fallback).then((d) => live && setData(d));
    return () => { live = false; };
    // eslint-disable-next-line
  }, [path]);
  return data;
}
