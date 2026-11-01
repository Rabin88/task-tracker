import { request } from '../../api/client';
import type { AuthResult, User } from './types';

export async function register(email: string, password: string) {
  const res = await request<{ data: AuthResult }>('/auth/register', { method: 'POST', body: { email, password } });
  return res.data;
}

export async function login(email: string, password: string) {
  const res = await request<{ data: AuthResult }>('/auth/login', { method: 'POST', body: { email, password } });
  return res.data;
}

export async function getMe() {
  const res = await request<{ data: User }>('/auth/me');
  return res.data;
}
