import { Link } from 'react-router-dom';

const POINTS = [
  ['Be kind', 'Disagree with ideas, not with people. No harassment, hate speech, or targeted abuse.'],
  ['Be honest', "Don't impersonate someone else or spread content you know to be false."],
  ['Respect privacy', "Don't share someone else's private information or media without their consent."],
  ['No spam', "Don't flood chats or feeds with repetitive, unsolicited, or purely promotional content."],
];

export default function GuidelinesPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <p className="font-display text-3xl font-semibold mb-2">Community Guidelines</p>
        <p className="text-ink-soft mb-8">A short list of what keeps VartaKaro a good place to talk.</p>

        <div className="space-y-4">
          {POINTS.map(([title, body]) => (
            <div key={title} className="rounded-2xl bg-paper p-4 shadow-sm shadow-ink/5">
              <p className="font-semibold mb-1">{title}</p>
              <p className="text-sm text-ink-soft">{body}</p>
            </div>
          ))}
        </div>

        <Link to="/register" className="inline-block mt-8 text-accent font-medium">
          &larr; Back to create account
        </Link>
      </div>
    </div>
  );
}
