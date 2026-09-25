import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/common/Button';
import GoogleSignInButton from '../components/auth/GoogleSignInButton';

function AtIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="4" />
      <path strokeLinecap="round" d="M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-4 7.5" />
    </svg>
  );
}
function KeyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="8" cy="14" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 11l8-8m0 0h-4m4 0v4m-7 3l2.5 2.5" />
    </svg>
  );
}
function EyeIcon({ off }) {
  return off ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.5 5.2A10.4 10.4 0 0112 5c5 0 9 4 10 7-.4 1.2-1.2 2.6-2.4 3.9M6.3 6.7C4.4 8 3 9.9 2 12c1 3 5 7 10 7 1.3 0 2.6-.3 3.7-.7" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function PasswordLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ identifier, password }, remember);
      navigate('/feed');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="text-sm font-semibold">Email or Username</label>
        <div className="relative mt-1.5">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft">
            <AtIcon />
          </span>
          <input
            className="input pl-10"
            placeholder="you@example.com"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold">Passphrase</label>
          <Link to="/forgot-password" className="text-xs font-medium text-accent">
            Forgot passphrase?
          </Link>
        </div>
        <div className="relative mt-1.5">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft">
            <KeyIcon />
          </span>
          <input
            className="input pl-10 pr-10"
            placeholder="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-soft"
          >
            <EyeIcon off={showPassword} />
          </button>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
        Remember this device for 30 days
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" className="w-full flex items-center justify-center gap-2" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In to VartaKaro'}
        {!loading && <span>&rarr;</span>}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  const [googleError, setGoogleError] = useState('');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[520px] w-[720px] rounded-full bg-accent-soft/50 blur-3xl" />

      <div className="relative flex items-center justify-between px-6 py-4">
        <div className="flex items-baseline gap-2">
          <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M36,22 L72,22 Q86,22 86,36 L86,66 L66,86 L36,86 Q22,86 22,72 L22,36 Q22,22 36,22 Z"
                fill="#ffffff"
              />
            </svg>
          </div>
          <span className="font-display font-bold text-accent">VartaKaro</span>
          <span className="text-sm text-ink-soft">&mdash; Stories &amp; Conversations</span>
        </div>
      </div>

      <div className="relative max-w-5xl mx-auto px-4 pb-16 pt-4 grid md:grid-cols-2 gap-10 items-start">
        <div className="hidden md:block">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-accent uppercase tracking-wide bg-accent-soft rounded-full px-3 py-1 mb-4">
            ✦ Welcome Back
          </span>
          <h1 className="font-display text-4xl font-bold leading-tight mb-4">Your Quiet Corner Is Right Where You Left It</h1>
          <p className="text-ink-soft mb-8">
            Real conversations, photo-sharing, and small circles &mdash; without algorithmic noise. Sign in to pick up
            where you left off.
          </p>

          <div className="rounded-2xl bg-accent-soft/60 p-6 mb-6">
            <p className="text-xs uppercase tracking-wide text-accent font-bold mb-2">Chronicle Rule No. 1</p>
            <p className="font-display text-xl italic">&ldquo;Write for depth, read for presence.&rdquo;</p>
          </div>

          <div className="rounded-2xl bg-paper p-4 shadow-sm shadow-ink/5 text-sm text-ink-soft">
            A quiet corner of the web. No tracking cookies, no surveillance monetization &mdash; just real
            conversations.
          </div>
        </div>

        <div className="w-full max-w-lg mx-auto md:mx-0">
          <div className="relative rounded-3xl bg-paper shadow-xl shadow-ink/10 overflow-hidden">
            <div className="absolute -top-3 right-8 flex gap-1.5">
              <span className="h-4 w-1.5 rounded-full bg-line" />
              <span className="h-4 w-1.5 rounded-full bg-line" />
              <span className="h-4 w-1.5 rounded-full bg-line" />
            </div>

            <div className="p-8">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-accent uppercase tracking-wide mb-4">
                ✦ Welcome back
              </span>

              <h1 className="font-display text-3xl font-bold mb-2">Welcome Back to the Sanctuary</h1>
              <p className="text-ink-soft mb-6">Enter your email or username and passphrase to access your chats and circles.</p>

              <PasswordLogin />

              <div className="flex items-center gap-3 my-5">
                <span className="h-px flex-1 bg-line" />
                <span className="text-xs text-ink-soft">or</span>
                <span className="h-px flex-1 bg-line" />
              </div>

              <GoogleSignInButton
                onSuccess={() => navigate('/feed')}
                onError={(err) => setGoogleError(err.message)}
              />
              {googleError && <p className="text-sm text-red-600 mt-2 text-center">{googleError}</p>}
            </div>

            <div className="px-8 py-4 border-t border-line flex items-center justify-between text-sm">
              <span />
              <p className="text-ink-soft">
                Don&apos;t have an account?{' '}
                <Link to="/register" className="text-accent font-semibold">
                  Create Account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
