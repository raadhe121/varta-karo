const VARIANTS = {
  primary: 'bg-accent text-white hover:bg-accent/90 disabled:opacity-50',
  ghost: 'bg-transparent text-ink hover:bg-paper-soft disabled:opacity-50',
  outline: 'bg-transparent border border-line text-ink hover:bg-paper-soft disabled:opacity-50',
  danger: 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50',
};

export default function Button({ variant = 'primary', className = '', children, ...props }) {
  return (
    <button
      className={`px-4 py-2 rounded-xl font-semibold text-sm transition-colors disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
