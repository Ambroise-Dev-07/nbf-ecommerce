import api from './api';

export const login = async (username, password) => {
  const res = await api.post('token/', { username, password });
  localStorage.setItem('access_token', res.data.access);
  localStorage.setItem('refresh_token', res.data.refresh);
  return res.data;
};

export const register = async (data) => {
  const res = await api.post('register/', data);
  return res.data;
};

export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

export const isAuthenticated = () => !!localStorage.getItem('access_token');

export const getCurrentUser = async () => {
  const res = await api.get('me/');
  return res.data;
};