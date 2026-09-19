export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-3xl bg-paper shadow-2xl shadow-ink/10 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-ink-soft hover:text-ink text-xl leading-none">
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
