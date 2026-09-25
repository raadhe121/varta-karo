import { http } from './http';

export const searchUsers = (q) => http.get('/users/search', { params: { q } }).then((r) => r.data);
export const updateMe = (payload) => http.patch('/users/me', payload).then((r) => r.data);
export const updateEmail = (email) => http.patch('/users/me/email', { email }).then((r) => r.data);
export const updatePassword = (payload) => http.patch('/users/me/password', payload).then((r) => r.data);
export const fetchMe = () => http.get('/users/me').then((r) => r.data);
