import { useAuthStore } from '../../store/authStore';
import { resolveMediaUrl } from '../../utils/media';

function statusSummary(statuses = []) {
  if (statuses.length === 0) return 'sent';
  if (statuses.every((s) => s.status === 'read')) return 'read';
  return 'delivered';
}

function Ticks({ status }) {
  if (status === 'sent') return <span className="text-[10px] opacity-70">✓</span>;
  if (status === 'delivered') return <span className="text-[10px] opacity-70">✓✓</span>;
  return <span className="text-[10px] text-white">✓✓</span>;
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({ message, showSender }) {
  const myId = useAuthStore((s) => s.user?.id);
  const isMine = message.senderId === myId;
  const status = statusSummary(message.statuses);

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-[70%] px-3.5 py-2 rounded-bubble shadow-sm ${
          isMine ? 'bg-accent text-white rounded-br-md' : 'bg-paper-soft text-ink rounded-bl-md'
        }`}
      >
        {showSender && !isMine && <p className="text-xs font-semibold text-accent mb-0.5">{message.senderName}</p>}

        {message.type === 'image' && message.mediaUrl && (
          <img src={resolveMediaUrl(message.mediaUrl)} alt="attachment" className="rounded-xl mb-1 max-h-64 object-cover" />
        )}
        {message.type === 'file' && message.mediaUrl && (
          <a href={resolveMediaUrl(message.mediaUrl)} target="_blank" rel="noreferrer" className="underline text-sm block mb-1">
            📎 {message.mediaMeta?.originalName || 'Attachment'}
          </a>
        )}
        {message.content && <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>}

        <div className={`flex items-center gap-1 justify-end mt-1 ${isMine ? 'text-white/80' : 'text-ink-soft'}`}>
          <span className="text-[10px]">{formatTime(message.createdAt)}</span>
          {isMine && <Ticks status={status} />}
        </div>
      </div>
    </div>
  );
}
