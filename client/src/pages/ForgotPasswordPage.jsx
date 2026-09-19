import { Link } from 'react-router-dom';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <p className="font-display text-2xl font-semibold mb-2">Password reset isn't available yet</p>
        <p className="text-ink-soft mb-6">
          This is a demo app without an email delivery service, so there's no automated way to reset a
          forgotten password yet. If you're testing locally, the simplest option is registering a new account.
        </p>
        <Link to="/login" className="text-accent font-medium">
          &larr; Back to sign in
        </Link>
      </div>
    </div>
  );
}
