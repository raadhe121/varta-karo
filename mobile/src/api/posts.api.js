import { http } from './http';

export const fetchFeed = (before) => http.get('/posts/feed', { params: before ? { before } : {} }).then((r) => r.data);
export const fetchUserPosts = (userId, before) =>
  http.get(`/users/${userId}/posts`, { params: before ? { before } : {} }).then((r) => r.data);
export const createPost = (payload) => http.post('/posts', payload).then((r) => r.data);
export const deletePost = (postId) => http.delete(`/posts/${postId}`).then((r) => r.data);
export const toggleLike = (postId) => http.post(`/posts/${postId}/like`).then((r) => r.data);
export const fetchComments = (postId) => http.get(`/posts/${postId}/comments`).then((r) => r.data);
export const addComment = (postId, content) => http.post(`/posts/${postId}/comments`, { content }).then((r) => r.data);
