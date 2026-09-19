// Same "parchment" palette as the web client (client/src/index.css @theme).
// Native system fonts are used instead of the web's Lora/Inter pairing —
// that's the idiomatic choice for a native app and avoids a custom
// font-loading step that isn't needed for functional parity.
export const colors = {
  paper: '#fffdf9',
  paperSoft: '#f3ead9',
  page: '#f2ecdf',
  ink: '#2b241d',
  inkSoft: '#8a7d6c',
  accent: '#c1652f',
  accentSoft: '#f3decb',
  line: '#e8dcc6',
  white: '#ffffff',
  danger: '#dc2626',
  success: '#059669',
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export const spacing = (n) => n * 4;
