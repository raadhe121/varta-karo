import { http } from './http';

export const blockUser = (userId) => http.post(`/blocks/${userId}`).then((r) => r.data);
export const unblockUser = (userId) => http.delete(`/blocks/${userId}`).then((r) => r.data);
export const fetchBlockedUsers = () => http.get('/blocks').then((r) => r.data);
