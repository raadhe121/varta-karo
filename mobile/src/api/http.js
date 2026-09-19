import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { disconnectSocket } from '../socket/socket';
import { API_URL } from '../config/env';

export const http = axios.create({ baseURL: API_URL });

http.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise = null;

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;
    const { refreshToken, setAuth, clearAuth } = useAuthStore.getState();

    if (response?.status === 401 && refreshToken && !config._retried) {
      config._retried = true;
      try {
        refreshPromise ??= axios
          .post(`${API_URL}/auth/refresh`, { refreshToken })
          .finally(() => {
            refreshPromise = null;
          });
        const { data } = await refreshPromise;
        setAuth(data);
        config.headers.Authorization = `Bearer ${data.accessToken}`;
        return http(config);
      } catch {
        clearAuth();
      }
    }

    // Same policy as the web client: any 404 or 500 forces a logout so a
    // broken/expired session doesn't stay half-alive in the UI.
    if (response?.status === 404 || response?.status === 500) {
      disconnectSocket();
      clearAuth();
    }

    return Promise.reject(error);
  }
);
