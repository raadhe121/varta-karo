import { http } from './http';

export const fetchFeed = (before) => http.get('/posts/feed', { params: before ? { before } : {} }).then((r) => r.data);
export const fetchDiscoverPosts = () => http.get('/posts/discover').then((r) => r.data);
export const fetchReels = (before) => http.get('/posts/reels', { params: before ? { before } : {} }).then((r) => r.data);
export const fetchUserPosts = (userId, before) =>
  http.get(`/users/${userId}/posts`, { params: before ? { before } : {} }).then((r) => r.data);
export const createPost = (payload) => http.post('/posts', payload).then((r) => r.data);
export const deletePost = (postId) => http.delete(`/posts/${postId}`).then((r) => r.data);
export const toggleLike = (postId) => http.post(`/posts/${postId}/like`).then((r) => r.data);
export const toggleSave = (postId, collectionId) =>
  http.post(`/posts/${postId}/save`, collectionId !== undefined ? { collectionId } : {}).then((r) => r.data);
export const sharePost = (postId) => http.post(`/posts/${postId}/share`).then((r) => r.data);
export const fetchComments = (postId) => http.get(`/posts/${postId}/comments`).then((r) => r.data);
export const addComment = (postId, content, parentId) =>
  http.post(`/posts/${postId}/comments`, { content, parentId }).then((r) => r.data);
export const fetchSavedPosts = (collectionId) =>
  http.get('/posts/saved', { params: collectionId !== undefined ? { collectionId: collectionId ?? 'none' } : {} }).then((r) => r.data);
