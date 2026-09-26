// Which in-app notification toasts/badges the user wants on this device.
// Purely client-side (no server opt-out endpoint exists), shared between the
// Notifications page's quick-toggle rail and Settings > Notifications so
// both read/write the same source of truth.
const KEY = 'vartakaro.notificationPrefs';

export const DEFAULT_PREFS = {
  newFollowers: true,
  likes: true,
  commentsAndMentions: true,
  messages: true,
};

export function getNotificationPrefs() {
  try {
    return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function setNotificationPrefs(prefs) {
  localStorage.setItem(KEY, JSON.stringify(prefs));
}
