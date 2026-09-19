import { http } from './http';

export const fetchConversations = () => http.get('/conversations').then((r) => r.data);
export const createConversation = (payload) => http.post('/conversations', payload).then((r) => r.data);
export const updateConversation = (id, payload) => http.patch(`/conversations/${id}`, payload).then((r) => r.data);
export const addParticipants = (id, userIds) =>
  http.post(`/conversations/${id}/participants`, { userIds }).then((r) => r.data);
export const fetchMessages = (id, before) =>
  http.get(`/conversations/${id}/messages`, { params: before ? { before } : {} }).then((r) => r.data);
export const uploadMedia = (file) => {
  const form = new FormData();
  form.append('file', file);
  return http.post('/media/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
};
