import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';

import { env } from './config/env.js';
import { sequelize } from './models/index.js';
import { attachSocket } from './socket/index.js';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import contactRoutes from './routes/contact.routes.js';
import conversationRoutes from './routes/conversation.routes.js';
import mediaRoutes from './routes/media.routes.js';
import friendRoutes from './routes/friend.routes.js';
import followRoutes from './routes/follow.routes.js';
import postRoutes from './routes/post.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import storyRoutes from './routes/story.routes.js';
import callRoutes from './routes/call.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors({ origin: env.clientOrigins, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/calls', callRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: env.clientOrigins, credentials: true },
});
attachSocket(io);
app.set('io', io);

async function start() {
  try {
    await sequelize.authenticate();
    // Plain sync() only creates missing tables. Don't switch to { alter: true } for
    // dev convenience: on MySQL it re-adds a new unique index for every unique:true
    // column on each restart instead of reusing the existing one, and repeated
    // nodemon restarts will eventually hit MySQL's 64-key-per-table limit (as
    // happened on `users`). Add real migrations instead if schema changes are needed
    // against an existing database.
    await sequelize.sync();
    console.log('Database connected and synced.');
  } catch (err) {
    console.error('Failed to connect to the database:', err.message);
    process.exit(1);
  }

  httpServer.listen(env.port, () => {
    console.log(`Vartakaro server listening on http://localhost:${env.port}`);
  });
}

start();
