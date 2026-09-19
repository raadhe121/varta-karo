import { useEffect, useState } from 'react';
import { fetchIncomingRequests, acceptContactRequest } from '../../api/contacts.api';
import Avatar from '../common/Avatar';
import Button from '../common/Button';

export default function ContactRequests({ onAccepted }) {
  const [requests, setRequests] = useState([]);

  const load = async () => setRequests(await fetchIncomingRequests());

  useEffect(() => {
    load();
  }, []);

  const accept = async (request) => {
    await acceptContactRequest(request.id);
    setRequests((prev) => prev.filter((r) => r.id !== request.id));
    onAccepted?.(request.requester);
  };

  if (requests.length === 0) return null;

  return (
    <div className="mb-4">
      <p className="text-xs uppercase tracking-wide text-ink-soft mb-2">Requests</p>
      <div className="flex flex-col gap-2">
        {requests.map((r) => (
          <div key={r.id} className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-paper-soft">
            <Avatar user={r.requester} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{r.requester.name}</p>
              <p className="text-xs text-ink-soft truncate">@{r.requester.username}</p>
            </div>
            <Button className="text-xs px-2 py-1" onClick={() => accept(r)}>
              Accept
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
