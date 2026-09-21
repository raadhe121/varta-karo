const apiOrigin = import.meta.env.VITE_API_URL ?? '';

// Backend media URLs (avatars, covers, uploaded attachments) come back as
// origin-relative paths like "/uploads/...". Those resolve fine when the
// client and API share an origin, but break once the client is deployed
// separately (e.g. Vercel) since the browser resolves them against the
// client's own origin instead of the API's.
export function resolveMediaUrl(url) {
  if (!url || !url.startsWith('/')) return url;
  return `${apiOrigin}${url}`;
}
