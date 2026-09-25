import dotenv from 'dotenv';

dotenv.config();

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT || 5000),
  host: process.env.HOST || '0.0.0.0',
  // A small allow-list rather than one origin: the web client (Vite) and
  // Expo's web-preview target run on different dev ports. Native mobile
  // requests (Expo Go / a built app) aren't subject to browser CORS at all,
  // so this only matters for browser-based clients.
  clientOrigins: (process.env.CLIENT_ORIGINS || 'http://localhost:5173,http://localhost:8081')
    .split(',')
    .map((o) => o.trim()),
  db: {
    host: required('DB_HOST', '127.0.0.1'),
    port: Number(process.env.DB_PORT || 5432),
    name: required('DB_NAME', 'vartakaro'),
    user: required('DB_USER', 'postgres'),
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true',
  },
  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET', 'dev-access-secret'),
    refreshSecret: required('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  otp: {
    expiresInMinutes: Number(process.env.OTP_EXPIRES_IN_MINUTES || 5),
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
  },
};
