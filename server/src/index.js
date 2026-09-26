import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';

import { DataTypes } from 'sequelize';
import { env } from './config/env.js';
import { sequelize } from './models/index.js';
import { attachSocket } from './socket/index.js';
import { startDisappearingMessagesSweep } from './services/disappearingMessages.service.js';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import conversationRoutes from './routes/conversation.routes.js';
import mediaRoutes from './routes/media.routes.js';
import followRoutes from './routes/follow.routes.js';
import blockRoutes from './routes/block.routes.js';
import postRoutes from './routes/post.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import storyRoutes from './routes/story.routes.js';
import callRoutes from './routes/call.routes.js';
import communityRoutes from './routes/community.routes.js';
import collectionRoutes from './routes/collection.routes.js';
import highlightRoutes from './routes/highlight.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors({ origin: env.clientOrigins, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/blocks', blockRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/highlights', highlightRoutes);

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
startDisappearingMessagesSweep(io);

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

    // sync() (without { alter: true }) only creates missing tables, not
    // missing columns on tables that already exist — so newly added columns
    // on pre-existing tables (like `googleId` for Google sign-in) need a
    // one-off manual add. Cheap and idempotent: skip if it's already there.
    const usersTable = await sequelize.getQueryInterface().describeTable('users');
    if (!usersTable.googleId) {
      await sequelize.getQueryInterface().addColumn('users', 'googleId', {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      });
    }

    // Same one-off-add pattern for block/mute/disappearing-messages columns
    // added to pre-existing tables.
    const conversationsTable = await sequelize.getQueryInterface().describeTable('conversations');
    if (!conversationsTable.disappearingSeconds) {
      await sequelize.getQueryInterface().addColumn('conversations', 'disappearingSeconds', {
        type: DataTypes.INTEGER,
        allowNull: true,
      });
    }

    const participantsTable = await sequelize.getQueryInterface().describeTable('conversation_participants');
    if (!participantsTable.muted) {
      await sequelize.getQueryInterface().addColumn('conversation_participants', 'muted', {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }

    const messagesTable = await sequelize.getQueryInterface().describeTable('messages');
    if (!messagesTable.expiresAt) {
      await sequelize.getQueryInterface().addColumn('messages', 'expiresAt', {
        type: DataTypes.DATE,
        allowNull: true,
      });
    }

    if (!usersTable.isPrivate) {
      await sequelize.getQueryInterface().addColumn('users', 'isPrivate', {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }

    // sync() creates the enum type fresh for a brand-new notifications table,
    // but on a pre-existing one it never adds new values to an existing
    // Postgres enum -- so the two new notification types below need a
    // one-off ALTER TYPE. IF NOT EXISTS makes it safe to run on every boot.
    await sequelize.query(`ALTER TYPE "enum_notifications_type" ADD VALUE IF NOT EXISTS 'follow_request'`);
    await sequelize.query(`ALTER TYPE "enum_notifications_type" ADD VALUE IF NOT EXISTS 'follow_accept'`);

    const commentsTable = await sequelize.getQueryInterface().describeTable('comments');
    if (!commentsTable.parentId) {
      await sequelize.getQueryInterface().addColumn('comments', 'parentId', {
        type: DataTypes.UUID,
        allowNull: true,
      });
    }

    const postsTable = await sequelize.getQueryInterface().describeTable('posts');
    if (!postsTable.media) {
      await sequelize.getQueryInterface().addColumn('posts', 'media', {
        type: DataTypes.JSON,
        allowNull: true,
      });
      // Backfill existing single-media posts into the new array column so
      // old rows render as a one-item carousel instead of an empty one.
      await sequelize.query(`
        UPDATE posts SET media = json_build_array(json_build_object('url', "imageUrl", 'mediaType', "mediaType"))
        WHERE "imageUrl" IS NOT NULL AND media IS NULL
      `);
    }

    const savesTable = await sequelize.getQueryInterface().describeTable('saves');
    if (!savesTable.collectionId) {
      await sequelize.getQueryInterface().addColumn('saves', 'collectionId', {
        type: DataTypes.UUID,
        allowNull: true,
      });
    }

    console.log('Database connected and synced.');
  } catch (err) {
    console.error('Failed to connect to the database:', err.message);
    process.exit(1);
  }

  httpServer.listen(env.port, env.host, () => {
    console.log(`Vartakaro server listening on http://${env.host}:${env.port}`);
  });
}

start();
