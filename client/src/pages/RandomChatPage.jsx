import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { login as loginApi } from '../api/auth.api';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';

const apiOrigin = import.meta.env.VITE_API_URL ?? '';

function getGuestId() {
  let id = localStorage.getItem('vartakaro.guestId');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('vartakaro.guestId', id);
  }
  return id;
}

/** Small inline login form used only to let an anonymous guest accept a
 * pending friend request without leaving (and disconnecting) the random
 * chat session. Registration lives on its own page — a stranger deciding
 * to accept a request mid-chat is assumed to already have an account. */
function InlineLoginForm({ onAuthenticated }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await loginApi({ identifier, password });
      onAuthenticated(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-2 mt-2">
      <input
        className="input"
        placeholder="Username or email"
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        required
      />
      <input
        className="input"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" className="text-sm px-4" disabled={loading}>
          {loading ? 'Logging in...' : 'Log in & accept'}
        </Button>
        <Link to="/register" target="_blank" className="text-xs text-accent font-semibold">
          Create an account instead
        </Link>
      </div>
    </form>
  );
}

export default function RandomChatPage() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const socketRef = useRef(null);
  const [phase, setPhase] = useState('idle'); // idle | waiting | chatting
  const [partner, setPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [requestState, setRequestState] = useState('none'); // none | pending | sent
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [connectedNotice, setConnectedNotice] = useState(null);

  useEffect(() => {
    const socket = io(`${apiOrigin}/random`, {
      auth: accessToken ? { token: accessToken } : { guestId: getGuestId(), guestName: user?.name },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('random:waiting', () => setPhase('waiting'));
    socket.on('random:matched', ({ partner: p }) => {
      setPhase('chatting');
      setPartner(p);
      setMessages([]);
      setRequestState('none');
      setHasPendingRequest(false);
    });
    socket.on('random:message', ({ text: msg, at }) => {
      setMessages((prev) => [...prev, { fromSelf: false, text: msg, at }]);
    });
    socket.on('random:partner-left', () => {
      setPhase('idle');
      setPartner(null);
      setHasPendingRequest(false);
    });
    socket.on('random:request-sent', ({ pending }) => setRequestState(pending ? 'pending' : 'sent'));
    socket.on('random:pending-request', () => setHasPendingRequest(true));
    socket.on('random:friend-added', ({ conversationId }) => {
      setConnectedNotice(conversationId);
    });

    return () => socket.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const findStranger = () => socketRef.current?.emit('random:join');

  const next = () => {
    setMessages([]);
    setPartner(null);
    setRequestState('none');
    setHasPendingRequest(false);
    socketRef.current?.emit('random:next');
  };

  const leave = () => {
    socketRef.current?.emit('random:leave');
    setPhase('idle');
    setPartner(null);
    setMessages([]);
  };

  const send = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    socketRef.current?.emit('random:message', { text: trimmed });
    setMessages((prev) => [...prev, { fromSelf: true, text: trimmed, at: new Date().toISOString() }]);
    setText('');
  };

  const sendRequest = () => socketRef.current?.emit('random:send-request');

  const onGuestAuthenticated = (data) => {
    setAuth(data);
    socketRef.current?.emit('random:authenticate', { token: data.accessToken });
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-page px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <p className="font-display font-bold text-xl">Talk to a Stranger</p>
          <p className="text-sm text-ink-soft mt-1">
            {user ? `Chatting as ${user.name}` : 'Chatting anonymously — no account needed'}
          </p>
        </div>

        <div className="rounded-2xl bg-paper border border-line overflow-hidden">
          {phase === 'idle' && (
            <div className="p-8 text-center space-y-4">
              <p className="text-sm text-ink-soft">Tap below to get matched with a random person online right now.</p>
              <Button onClick={findStranger} className="px-6">
                Find a stranger
              </Button>
            </div>
          )}

          {phase === 'waiting' && (
            <div className="p-8 text-center space-y-3">
              <div className="h-8 w-8 mx-auto rounded-full border-2 border-accent border-t-transparent animate-spin" />
              <p className="text-sm text-ink-soft">Looking for someone to match you with...</p>
              <button onClick={leave} className="text-xs text-ink-soft hover:underline">
                Cancel
              </button>
            </div>
          )}

          {phase === 'chatting' && (
            <div className="flex flex-col h-[520px]">
              <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-line">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar user={partner?.isGuest ? { name: partner?.name } : partner} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{partner?.isGuest ? partner.name : partner?.name}</p>
                    <p className="text-xs text-ink-soft">{partner?.isGuest ? 'Anonymous' : 'Has an account'}</p>
                  </div>
                </div>
                {user && requestState === 'none' && (
                  <button onClick={sendRequest} className="text-xs font-semibold text-accent shrink-0">
                    Add Friend
                  </button>
                )}
                {requestState === 'sent' && <span className="text-xs text-ink-soft shrink-0">Request sent</span>}
                {requestState === 'pending' && <span className="text-xs text-ink-soft shrink-0">Waiting for sign-up</span>}
              </div>

              {hasPendingRequest && (
                <div className="mx-4 mt-3 rounded-xl bg-accent-soft p-3">
                  <p className="text-sm font-semibold">Your chat partner wants to add you as a friend</p>
                  <p className="text-xs text-ink-soft mt-0.5">Log in to accept — you'll both be able to keep chatting after.</p>
                  <InlineLoginForm onAuthenticated={onGuestAuthenticated} />
                </div>
              )}

              {connectedNotice && (
                <div className="mx-4 mt-3 rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center justify-between">
                  <p className="text-sm text-emerald-800 font-medium">You're friends now!</p>
                  <button onClick={() => navigate('/chat')} className="text-xs font-semibold text-emerald-800 underline">
                    Open chat
                  </button>
                </div>
              )}

              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                {messages.length === 0 && (
                  <p className="text-xs text-ink-soft text-center mt-6">Say hi 👋 — you're now connected.</p>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.fromSelf ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                        m.fromSelf ? 'bg-accent text-white' : 'bg-paper-soft text-ink'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={send} className="flex items-center gap-2 px-4 py-3 border-t border-line">
                <input
                  className="input flex-1"
                  placeholder="Type a message..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <Button type="submit" className="text-sm px-4">
                  Send
                </Button>
              </form>

              <div className="flex items-center justify-center gap-4 px-4 py-2.5 border-t border-line">
                <button onClick={next} className="text-sm font-semibold text-accent">
                  Next stranger
                </button>
                <button onClick={leave} className="text-sm text-ink-soft">
                  Stop
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center mt-6">
          <Link to={user ? '/feed' : '/login'} className="text-sm text-ink-soft hover:underline">
            &larr; Back to {user ? 'VartaKaro' : 'sign in'}
          </Link>
        </p>
      </div>
    </div>
  );
}
