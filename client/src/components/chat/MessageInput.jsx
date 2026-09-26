import { useRef, useState } from 'react';
import { getSocket } from '../../socket/socket';
import { uploadMedia } from '../../api/chat.api';
import { useChatStore } from '../../store/chatStore';
import Button from '../common/Button';

const TYPING_STOP_DELAY = 2000;
const QUICK_REPLIES = ['Sounds good', 'On it', 'Got it', "Let's talk later"];

export default function MessageInput({ conversationId, disabled, placeholder = 'Write something...' }) {
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const typingTimeout = useRef(null);
  const fileInputRef = useRef(null);
  const addMessage = useChatStore((s) => s.addMessage);

  const emitTyping = (isTyping) => {
    const socket = getSocket();
    socket?.emit(isTyping ? 'typing:start' : 'typing:stop', { conversationId });
  };

  const handleChange = (e) => {
    setText(e.target.value);
    emitTyping(true);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => emitTyping(false), TYPING_STOP_DELAY);
  };

  const send = (payload) => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('message:send', { conversationId, ...payload }, (res) => {
      if (res?.message) {
        addMessage(conversationId, res.message);
        setError('');
      } else if (res?.error) {
        setError(res.error);
      }
    });
  };

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    send({ type: 'text', content: text.trim() });
    setText('');
    clearTimeout(typingTimeout.current);
    emitTyping(false);
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadMedia(file);
      const type = file.type.startsWith('image/') ? 'image' : 'file';
      send({ type, mediaUrl: uploaded.url, mediaMeta: { originalName: uploaded.originalName } });
    } finally {
      setUploading(false);
    }
  };

  if (disabled) {
    return (
      <div className="border-t border-line bg-paper p-3">
        <p className="text-sm text-ink-soft text-center">You can't send messages in this conversation.</p>
      </div>
    );
  }

  return (
    <div className="border-t border-line bg-paper">
      {error && <p className="text-xs text-red-600 px-3 pt-2">{error}</p>}
      <div className="flex items-center gap-2 px-3 pt-2.5 overflow-x-auto">
        {QUICK_REPLIES.map((reply) => (
          <button
            key={reply}
            type="button"
            onClick={() => setText(reply)}
            className="shrink-0 text-xs font-medium px-3.5 py-1.5 rounded-full bg-paper-soft hover:bg-line whitespace-nowrap"
          >
            {reply}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="flex items-center gap-2 p-3">
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFile} />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-ink-soft hover:bg-paper-soft"
          title="Attach a file"
        >
          {uploading ? (
            '...'
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.4 11 12 20.4a5.5 5.5 0 0 1-7.8-7.8l9-9a3.7 3.7 0 0 1 5.2 5.2l-9 9a1.8 1.8 0 0 1-2.6-2.6l8.2-8.2" />
            </svg>
          )}
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-ink-soft hover:bg-paper-soft"
          title="Send a photo or video"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="9" cy="10.5" r="1.6" />
            <path strokeLinecap="round" strokeLinejoin="round" d="m5 17 5-4.5 3.5 3L18 11l3 3" />
          </svg>
        </button>
        <input className="input rounded-full" placeholder={placeholder} value={text} onChange={handleChange} />
        <Button type="submit" className="shrink-0 rounded-full flex items-center gap-1.5">
          Send
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />
          </svg>
        </Button>
      </form>
    </div>
  );
}
