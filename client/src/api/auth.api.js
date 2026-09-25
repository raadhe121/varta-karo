import { http } from './http';

export const registerAccount = (payload) => http.post('/auth/register', payload).then((r) => r.data);
export const checkUsername = (username) =>
  http.get('/auth/check-username', { params: { username } }).then((r) => r.data);
export const login = (payload) => http.post('/auth/login', payload).then((r) => r.data);
export const googleLogin = (idToken) => http.post('/auth/google', { idToken }).then((r) => r.data);
export const requestOtp = (phone) => http.post('/auth/otp/request', { phone }).then((r) => r.data);
export const verifyOtp = (phone, code) => http.post('/auth/otp/verify', { phone, code }).then((r) => r.data);
export const logout = () => http.post('/auth/logout').then((r) => r.data);
