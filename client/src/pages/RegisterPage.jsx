import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { checkUsername } from '../api/auth.api';
import Button from '../components/common/Button';

function strengthScore(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

const STRENGTH_COLOR = ['bg-line', 'bg-red-400', 'bg-amber-400', 'bg-lime-500', 'bg-emerald-500'];

function StrengthMeter({ password }) {
  if (!password) return null;
  const score = strengthScore(password);
  return (
    <div className="flex gap-1.5 mt-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= score ? STRENGTH_COLOR[score] : 'bg-line'}`} />
      ))}
    </div>
  );
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', username: '', email: '', phone: '', password: '', confirm: '' });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [handleStatus, setHandleStatus] = useState('idle'); // idle | checking | available | taken
  const debounceRef = useRef(null);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  useEffect(() => {
    clearTimeout(debounceRef.current);
    const username = form.username.trim();
    if (!username) {
      setHandleStatus('idle');
      return;
    }
    setHandleStatus('checking');
    debounceRef.current = setTimeout(async () => {
      try {
        const { available } = await checkUsername(username);
        setHandleStatus(available ? 'available' : 'taken');
      } catch {
        setHandleStatus('idle');
      }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [form.username]);

  const passwordsMatch = form.confirm.length === 0 || form.password === form.confirm;
  const canSubmit = agreed && handleStatus !== 'taken' && form.password === form.confirm && form.password.length >= 8;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setLoading(true);
    try {
      await register({
        name: form.name,
        username: form.username,
        email: form.email || undefined,
        phone: form.phone || undefined,
        password: form.password,
      });
      navigate('/feed');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 -right-32 h-[480px] w-[480px] rounded-full bg-accent-soft/50 blur-3xl" />

      <div className="relative flex items-center px-6 py-4">
        <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center shrink-0 mr-2">
          <svg width="16" height="16" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <path d="M36,22 L72,22 Q86,22 86,36 L86,66 L66,86 L36,86 Q22,86 22,72 L22,36 Q22,22 36,22 Z" fill="#ffffff" />
          </svg>
        </div>
        <span className="font-display font-bold text-accent">VartaKaro</span>
        <span className="text-sm text-ink-soft ml-2">&mdash; Stories &amp; Conversations</span>
      </div>

      <div className="relative max-w-5xl mx-auto px-4 pb-16 pt-4 grid md:grid-cols-2 gap-10 items-start">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-accent uppercase tracking-wide bg-accent-soft rounded-full px-3 py-1 mb-4">
            ✦ Become a Scribe
          </span>
          <h1 className="font-display text-4xl font-bold leading-tight mb-4">Begin Your Quiet Digital Chronicle</h1>
          <p className="text-ink-soft mb-8">
            Join an unhurried social network for real conversations, photo-sharing, and small circles &mdash; without
            algorithmic noise.
          </p>

          <div className="rounded-2xl bg-accent-soft/60 p-6 mb-6">
            <p className="text-xs uppercase tracking-wide text-accent font-bold mb-2">Chronicle Rule No. 1</p>
            <p className="font-display text-xl italic">&ldquo;Write for depth, read for presence.&rdquo;</p>
          </div>

          <div className="rounded-2xl bg-paper p-4 shadow-sm shadow-ink/5 text-sm text-ink-soft">
            A quiet corner of the web. No tracking cookies, no surveillance monetization &mdash; just real conversations.
          </div>
        </div>

        <div className="rounded-3xl bg-paper shadow-xl shadow-ink/10 p-8">
          <p className="text-xs font-bold text-accent uppercase tracking-wide mb-1">Join VartaKaro</p>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-bold">Create Your Account</h2>
            <span className="text-xs text-ink-soft bg-paper-soft rounded-full px-3 py-1">Takes &lt; 1 min</span>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-sm font-semibold">Full Name</label>
              <input className="input mt-1.5" placeholder="e.g. Ananya Sharma" value={form.name} onChange={update('name')} required />
            </div>

            <div>
              <label className="text-sm font-semibold">Email Address</label>
              <input
                className="input mt-1.5"
                placeholder="name@domain.com"
                type="email"
                value={form.email}
                onChange={update('email')}
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold">Choose Username</label>
                {handleStatus === 'checking' && <span className="text-xs text-ink-soft">Checking...</span>}
                {handleStatus === 'available' && <span className="text-xs text-emerald-600 font-medium">Available ✓</span>}
                {handleStatus === 'taken' && <span className="text-xs text-red-600 font-medium">Already taken</span>}
              </div>
              <div className="relative mt-1.5">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-accent font-semibold">@</span>
                <input
                  className="input pl-8"
                  placeholder="ananya_crafts"
                  value={form.username}
                  onChange={update('username')}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold">Password</label>
              <input
                className="input mt-1.5"
                placeholder="At least 8 characters"
                type="password"
                value={form.password}
                onChange={update('password')}
                required
                minLength={8}
              />
              <StrengthMeter password={form.password} />
            </div>

            <div>
              <label className="text-sm font-semibold">Confirm Password</label>
              <input
                className="input mt-1.5"
                placeholder="Re-enter your password"
                type="password"
                value={form.confirm}
                onChange={update('confirm')}
                required
              />
              {!passwordsMatch && <p className="text-xs text-red-600 mt-1">Passwords don&apos;t match.</p>}
            </div>

            <div>
              <label className="text-sm font-semibold">Phone (optional, for phone sign-in)</label>
              <input className="input mt-1.5" placeholder="+91 98765 43210" value={form.phone} onChange={update('phone')} />
            </div>

            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-0.5" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
              <span>
                I agree to VartaKaro&apos;s{' '}
                <Link to="/guidelines" className="text-accent font-medium">
                  Community Guidelines
                </Link>
                .
              </span>
            </label>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" className="w-full flex items-center justify-center gap-2" disabled={loading || !canSubmit}>
              {loading ? 'Creating account...' : 'Create Account'}
              {!loading && <span>&rarr;</span>}
            </Button>
          </form>

          <p className="text-sm text-ink-soft text-center mt-5 pt-5 border-t border-line">
            Already have an account?{' '}
            <Link to="/login" className="text-accent font-semibold">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
