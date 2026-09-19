export default function Spinner({ className = '' }) {
  return (
    <div
      className={`h-5 w-5 rounded-full border-2 border-line border-t-accent animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
