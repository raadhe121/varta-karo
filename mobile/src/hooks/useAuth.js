import { useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import * as authApi from '../api/auth.api';
import { connectSocket, disconnectSocket } from '../socket/socket';

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const applyAuth = useCallback(
    (data) => {
      setAuth(data);
      connectSocket();
    },
    [setAuth]
  );

  const register = useCallback((payload) => authApi.registerAccount(payload).then(applyAuth), [applyAuth]);
  const login = useCallback((payload) => authApi.login(payload).then(applyAuth), [applyAuth]);
  const requestOtp = useCallback((phone) => authApi.requestOtp(phone), []);
  const verifyOtp = useCallback((phone, code) => authApi.verifyOtp(phone, code).then(applyAuth), [applyAuth]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      disconnectSocket();
      clearAuth();
    }
  }, [clearAuth]);

  return {
    user,
    isAuthenticated: Boolean(user),
    register,
    login,
    requestOtp,
    verifyOtp,
    logout,
  };
}
