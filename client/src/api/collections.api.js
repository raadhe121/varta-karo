import { http } from './http';

export const fetchCollections = () => http.get('/collections').then((r) => r.data);
export const createCollection = (name) => http.post('/collections', { name }).then((r) => r.data);
export const deleteCollection = (id) => http.delete(`/collections/${id}`).then((r) => r.data);
