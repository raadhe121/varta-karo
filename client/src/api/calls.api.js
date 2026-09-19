import { http } from './http';

export const fetchCallLog = () => http.get('/calls').then((r) => r.data);
export const logCall = (payload) => http.post('/calls', payload).then((r) => r.data);
