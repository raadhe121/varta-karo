import { useRef, useState } from 'react';
import { getSocket } from '../../socket/socket';
import { uploadMedia } from '../../api/chat.api';
import { useChatStore } from '../../store/chatStore';
import Button from '../common/Button';

const TYPING_STOP_DELAY = 2000;
const QUICK_REPLIES = ['Sounds good 👍', 'On it', 'Got it', "Let's talk later"];

export default function MessageInput({ conversationId }) {
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
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
      if (res?.message) addMessage(conversationId, res.message);
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

  return (
    <div className="border-t border-line bg-paper">
      <div className="flex items-center gap-2 px-3 pt-2.5 overflow-x-auto">
        <span className="text-[11px] font-semibold text-ink-soft shrink-0">QUICK:</span>
        {QUICK_REPLIES.map((reply) => (
          <button
            key={reply}
            type="button"
            onClick={() => setText(reply)}
            className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-line hover:bg-paper-soft whitespace-nowrap"
          >
            {reply}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="flex items-center gap-2 p-3">
        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFile} />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="h-10 w-10 shrink-0 rounded-xl border border-line flex items-center justify-center hover:bg-paper-soft"
        title="Attach a file"
      >
        {uploading ? '...' : '📎'}
      </button>
      <input
        className="input"
        placeholder="Write something..."
        value={text}
        onChange={handleChange}
      />
        <Button type="submit" className="shrink-0">
          Send
        </Button>
      </form>
    </div>
  );
}
