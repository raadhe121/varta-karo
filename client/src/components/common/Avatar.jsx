import { resolveMediaUrl } from '../../utils/media';

function initials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return '?';
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

const SIZES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-20 w-20 text-2xl',
};

export default function Avatar({ user, size = 'md', showStatus = false, isOnline = false }) {
  const sizeClass = SIZES[size] || SIZES.md;

  return (
    <div className="relative inline-block shrink-0">
      {user?.avatarUrl ? (
        <img src={resolveMediaUrl(user.avatarUrl)} alt={user?.name} className={`${sizeClass} rounded-full object-cover border border-line`} />
      ) : (
        <div className={`${sizeClass} rounded-full flex items-center justify-center font-display font-semibold text-white bg-accent`}>
          {initials(user?.name)}
        </div>
      )}
      {showStatus && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-paper ${
            isOnline ? 'bg-emerald-500' : 'bg-ink-soft/50'
          }`}
        />
      )}
    </div>
  );
}
