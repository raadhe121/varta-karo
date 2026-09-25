import { http } from './http';

export const fetchProfile = (userId) => http.get(`/users/${userId}/profile`).then((r) => r.data);
export const fetchSuggestions = () => http.get('/users/suggestions').then((r) => r.data);
export const fetchMyActivity = () => http.get('/users/me/activity').then((r) => r.data);

export const followUser = (userId) => http.post(`/follow/${userId}`).then((r) => r.data);
export const unfollowUser = (userId) => http.delete(`/follow/${userId}`).then((r) => r.data);
export const fetchMutualFollows = () => http.get('/follow/mutual').then((r) => r.data);
export const fetchFollowers = (userId) => http.get(`/follow/${userId}/followers`).then((r) => r.data);
export const fetchFollowing = (userId) => http.get(`/follow/${userId}/following`).then((r) => r.data);
