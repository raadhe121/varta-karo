import { http } from './http';

export const fetchNotifications = () => http.get('/notifications').then((r) => r.data);
export const fetchUnreadCount = () => http.get('/notifications/unread-count').then((r) => r.data);
export const markNotificationRead = (id) => http.post(`/notifications/${id}/read`).then((r) => r.data);
export const markAllNotificationsRead = () => http.post('/notifications/read-all').then((r) => r.data);
