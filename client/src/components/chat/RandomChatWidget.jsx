import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRandomChatStore } from '../../store/randomChatStore';
import { nextRandomChat, sendRandomFriendRequest, sendRandomMessage, endRandomChat } from '../../random/randomChatClient';
import Avatar from '../common/Avatar';

/** Floating Messenger-style popup for a live random-chat session — purely
 * presentational against randomChatStore/randomChatClient, so the session
 * itself survives this being hidden (the X button minimizes, it doesn't end
 * the chat) — see Sidebar's "Anonymous" entry, which reopens this. */
export default function RandomChatWidget() {
  const visible = useRandomChatStore((s) => s.visible);
  const phase = useRandomChatStore((s) => s.phase);
  const partner = useRandomChatStore((s) => s.partner);
  const messages = useRandomChatStore((s) => s.messages);
  const requestState = useRandomChatStore((s) => s.requestState);
  const hasPendingRequest = useRandomChatStore((s) => s.hasPendingRequest);
  const conversationId = useRandomChatStore((s) => s.conversationId);
  const hide = useRandomChatStore((s) => s.hide);
  const navigate = useNavigate();

  const bodyRef = useRef(null);
  const [text, setText] = useState('');

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [messages]);

  if (!visible) return null;

  const send = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    sendRandomMessage(trimmed);
    setText('');
  };

  const openConversation = () => {
    hide();
    navigate('/chat');
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[560px] bg-paper rounded-2xl border border-line shadow-xl flex flex-col overflow-hidden z-40">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-line bg-accent-soft">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar user={partner?.isGuest ? { name: partner.name } : { name: 'Stranger' }} size="sm" />
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{phase === 'idle' ? 'Random Chat' : partner?.name || 'Waiting...'}</p>
            <p className="text-xs text-ink-soft">
              {phase === 'waiting' ? 'Finding someone...' : phase === 'chatting' ? (partner?.isGuest ? 'Anonymous' : 'Has an account') : ''}
            </p>
          </div>
        </div>
        <button onClick={hide} title="Minimize" className="text-ink-soft hover:text-ink shrink-0 text-lg leading-none px-1">
          &minus;
        </button>
      </div>

      {hasPendingRequest && phase === 'chatting' && (
        <div className="mx-3 mt-3 rounded-xl bg-accent-soft p-3">
          <p className="text-sm font-semibold">Your chat partner wants to add you as a friend</p>
          <p className="text-xs text-ink-soft mt-0.5">You're already logged in — nothing else to do here.</p>
        </div>
      )}

      {conversationId && (
        <div className="mx-3 mt-3 rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 flex items-center justify-between">
          <p className="text-xs text-emerald-800 font-medium">You're friends now!</p>
          <button onClick={openConversation} className="text-xs font-semibold text-emerald-800 underline">
            Open chat
          </button>
        </div>
      )}

      <div ref={bodyRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {phase === 'idle' && <p className="text-xs text-ink-soft text-center mt-10">Starting...</p>}
        {phase === 'waiting' && (
          <div className="flex flex-col items-center gap-2 mt-10">
            <div className="h-6 w-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            <p className="text-xs text-ink-soft">Looking for someone online...</p>
          </div>
        )}
        {phase === 'chatting' && messages.length === 0 && (
          <p className="text-xs text-ink-soft text-center mt-6">Say hi 👋 — you're now connected.</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.fromSelf ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] rounded-2xl px-3 py-1.5 text-sm ${m.fromSelf ? 'bg-accent text-white' : 'bg-paper-soft text-ink'}`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {phase === 'chatting' && (
        <>
          <form onSubmit={send} className="flex items-center gap-2 px-3 py-2 border-t border-line">
            <input
              className="input flex-1 text-sm"
              placeholder="Type a message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button type="submit" className="text-sm font-semibold text-accent px-2 shrink-0">
              Send
            </button>
          </form>
          <div className="flex items-center justify-center gap-3 px-3 py-2 border-t border-line bg-paper-soft/60 text-xs font-semibold">
            {requestState === 'none' && (
              <button onClick={sendRandomFriendRequest} className="text-accent">
                Add Friend
              </button>
            )}
            {requestState === 'sent' && <span className="text-ink-soft">Request sent</span>}
            {requestState === 'pending' && <span className="text-ink-soft">Waiting for sign-up</span>}
            <span className="text-line">|</span>
            <button onClick={nextRandomChat} className="text-accent">
              New Chat
            </button>
            <span className="text-line">|</span>
            <button onClick={endRandomChat} className="text-ink-soft">
              End Chat
            </button>
          </div>
        </>
      )}
    </div>
  );
}
