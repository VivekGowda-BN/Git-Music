import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function getAuthToken() {
  return localStorage.getItem('access_token');
}

export function getAuthUserId() {
  return localStorage.getItem('user_id');
}

export function setAuthSession(token, userId) {
  if (token) localStorage.setItem('access_token', token);
  if (userId) localStorage.setItem('user_id', String(userId));
  window.dispatchEvent(new Event('swarlab-auth'));
}

export function clearAuthSession() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user_id');
  window.dispatchEvent(new Event('swarlab-auth'));
}

export function getAuthHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchCurrentUser() {
  const token = getAuthToken();
  if (!token) return null;
  const res = await axios.get(`${API_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}
