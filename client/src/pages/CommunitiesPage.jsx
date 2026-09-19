import AppNav from '../components/layout/AppNav';

export default function CommunitiesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <AppNav />
      <div className="flex-1 flex items-center justify-center text-center px-4">
        <div>
          <p className="font-display text-2xl font-semibold mb-2">Communities are coming soon</p>
          <p className="text-ink-soft">Curated circles for shared interests aren't open yet — check back later.</p>
        </div>
      </div>
    </div>
  );
}
