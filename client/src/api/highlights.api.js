import { http } from './http';

export const fetchHighlights = (userId) => http.get(`/highlights/user/${userId}`).then((r) => r.data);
export const createHighlight = (name, storyIds) => http.post('/highlights', { name, storyIds }).then((r) => r.data);
export const addStoriesToHighlight = (id, storyIds) => http.post(`/highlights/${id}/stories`, { storyIds }).then((r) => r.data);
export const deleteHighlight = (id) => http.delete(`/highlights/${id}`).then((r) => r.data);
