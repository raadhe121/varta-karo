import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { disconnectSocket } from '../socket/socket';

const apiOrigin = import.meta.env.VITE_API_URL ?? '';

export const http = axios.create({ baseURL: `${apiOrigin}/api` });

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
          .post(`${apiOrigin}/api/auth/refresh`, { refreshToken })
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

    if (response?.status === 404 || response?.status === 500) {
      disconnectSocket();
      clearAuth();
    }

    return Promise.reject(error);
  }
);
