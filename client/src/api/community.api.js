import { http } from './http';

export const fetchCommunities = (search) =>
  http.get('/communities', { params: search ? { search } : {} }).then((r) => r.data);
export const fetchMyCommunities = () => http.get('/communities', { params: { mine: true } }).then((r) => r.data);
export const fetchCommunity = (id) => http.get(`/communities/${id}`).then((r) => r.data);
export const createCommunity = (payload) => http.post('/communities', payload).then((r) => r.data);
export const deleteCommunity = (id) => http.delete(`/communities/${id}`).then((r) => r.data);
export const joinCommunity = (id) => http.post(`/communities/${id}/join`).then((r) => r.data);
export const leaveCommunity = (id) => http.post(`/communities/${id}/leave`).then((r) => r.data);
export const fetchCommunityMembers = (id) => http.get(`/communities/${id}/members`).then((r) => r.data);
export const fetchCommunityPosts = (id, before) =>
  http.get(`/communities/${id}/posts`, { params: before ? { before } : {} }).then((r) => r.data);
export const createCommunityPost = (id, payload) => http.post(`/communities/${id}/posts`, payload).then((r) => r.data);
export const deleteCommunityPost = (id, postId) => http.delete(`/communities/${id}/posts/${postId}`).then((r) => r.data);
