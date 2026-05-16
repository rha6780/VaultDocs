import axios from 'axios';
import type { AuthResponse } from '@shared/types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
});

export async function devLogin(): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/api/auth/dev-login');
  return data;
}
