import { http } from './http';
import { uploadMedia } from './cloudinary';

export const fetchConversations = () => http.get('/conversations').then((r) => r.data);
export const createConversation = (payload) => http.post('/conversations', payload).then((r) => r.data);
export const updateConversation = (id, payload) => http.patch(`/conversations/${id}`, payload).then((r) => r.data);
export const setConversationMuted = (id, muted) => http.patch(`/conversations/${id}/mute`, { muted }).then((r) => r.data);
export const setConversationDisappearing = (id, seconds) =>
  http.patch(`/conversations/${id}/disappearing`, { seconds }).then((r) => r.data);
export const addParticipants = (id, userIds) =>
  http.post(`/conversations/${id}/participants`, { userIds }).then((r) => r.data);
export const fetchMessages = (id, before) =>
  http.get(`/conversations/${id}/messages`, { params: before ? { before } : {} }).then((r) => r.data);
export { uploadMedia };
