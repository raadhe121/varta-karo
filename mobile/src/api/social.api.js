import { http } from './http';

export const fetchProfile = (userId) => http.get(`/users/${userId}/profile`).then((r) => r.data);
export const fetchMyActivity = () => http.get('/users/me/activity').then((r) => r.data);

export const sendFriendRequest = (userId) => http.post(`/friends/request/${userId}`).then((r) => r.data);
export const acceptFriendRequest = (requestId) => http.post(`/friends/${requestId}/accept`).then((r) => r.data);
export const declineFriendRequest = (requestId) => http.post(`/friends/${requestId}/decline`).then((r) => r.data);
export const fetchFriends = () => http.get('/friends').then((r) => r.data);
export const fetchIncomingFriendRequests = () => http.get('/friends/requests/incoming').then((r) => r.data);

export const followUser = (userId) => http.post(`/follow/${userId}`).then((r) => r.data);
export const unfollowUser = (userId) => http.delete(`/follow/${userId}`).then((r) => r.data);
