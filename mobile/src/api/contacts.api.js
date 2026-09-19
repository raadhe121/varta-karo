import { http } from './http';

export const searchUsers = (q) => http.get('/users/search', { params: { q } }).then((r) => r.data);
export const fetchContacts = () => http.get('/contacts').then((r) => r.data);
export const fetchIncomingRequests = () => http.get('/contacts/requests/incoming').then((r) => r.data);
export const sendContactRequest = (userId) => http.post(`/contacts/request/${userId}`).then((r) => r.data);
export const acceptContactRequest = (requestId) => http.post(`/contacts/${requestId}/accept`).then((r) => r.data);
export const updateMe = (payload) => http.patch('/users/me', payload).then((r) => r.data);
export const fetchMe = () => http.get('/users/me').then((r) => r.data);
