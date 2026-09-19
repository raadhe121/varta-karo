import { useEffect, useState } from 'react';
import { fetchMyActivity } from '../../api/social.api';

const TYPE_LABEL = {
  post: 'You posted',
  like: 'You liked',
  comment: 'You commented',
};

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function ActivityLog() {
  const [entries, setEntries] = useState(null);

  useEffect(() => {
    fetchMyActivity().then(setEntries);
  }, []);

  if (!entries) return <p className="text-sm text-ink-soft">Loading...</p>;
  if (entries.length === 0) return <p className="text-sm text-ink-soft">Nothing here yet.</p>;

  return (
    <div className="flex flex-col gap-2">
      {entries.map((entry, i) => (
        <div key={i} className="flex items-start justify-between gap-3 rounded-2xl bg-paper px-4 py-3 shadow-sm shadow-ink/5">
          <div>
            <p className="text-sm font-medium">{TYPE_LABEL[entry.type]}</p>
            <p className="text-sm text-ink-soft truncate max-w-md">{entry.summary}</p>
          </div>
          <span className="text-xs text-ink-soft shrink-0">{formatDate(entry.createdAt)}</span>
        </div>
      ))}
    </div>
  );
}
