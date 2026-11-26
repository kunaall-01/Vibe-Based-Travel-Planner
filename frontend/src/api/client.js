import axios from 'axios';
import { useEffect, useState } from 'react';

export const api = axios.create({
  baseURL: '/api',
  timeout: 6000,
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
export async function postStrict(path, body) {
  const response = await api.post(path, body);
  return response.data;
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
