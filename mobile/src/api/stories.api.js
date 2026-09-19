import { http } from './http';

export const fetchFeedStories = () => http.get('/stories/feed').then((r) => r.data);
export const fetchUserStories = (userId) => http.get(`/stories/user/${userId}`).then((r) => r.data);
export const createStory = (payload) => http.post('/stories', payload).then((r) => r.data);
export const viewStory = (storyId) => http.post(`/stories/${storyId}/view`).then((r) => r.data);
export const fetchStoryViewers = (storyId) => http.get(`/stories/${storyId}/viewers`).then((r) => r.data);
export const deleteStory = (storyId) => http.delete(`/stories/${storyId}`).then((r) => r.data);
