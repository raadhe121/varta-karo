# vartakaro

A real-time chat app (1:1 + group messaging, media sharing, presence, typing
and read receipts) with a Facebook-style social layer (public profiles,
friends/follow, a posts feed with likes/comments) on top, built with React,
Node/Express, Socket.io, and MySQL via Sequelize. Visual style is a deliberate
"notebook" theme (warm cream/charcoal palette, amber accent, serif headings)
instead of the usual blue/green chat chrome.

## Stack

- **Client**: React 19 + Vite, Tailwind CSS v4, React Router, Zustand, socket.io-client
- **Server**: Node.js + Express, Socket.io, Sequelize + mysql2
- **Auth**: JWT (access + refresh) via email/password, plus phone + OTP
  (OTP codes are printed to the server console in dev — no SMS vendor wired
  up yet; swap `server/src/services/otp.service.js`'s provider for Twilio/etc.
  when you're ready to send real texts)

## Project layout

```
vartakaro/
  server/   Express + Socket.io API, Sequelize models, JWT auth
  client/   React app (Vite)
```

## Setup

### 1. Database

Create an empty MySQL database (MariaDB works too):

```sql
CREATE DATABASE vartakaro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Server config

```bash
cd server
cp .env.example .env
# edit .env with your DB credentials if they differ from the defaults
```

### 3. Install dependencies (from the repo root)

```bash
npm install
```

### 4. Run both apps

```bash
npm run dev
```

This starts the API server on `http://localhost:5000` (which creates/syncs
all tables automatically on boot) and the Vite dev server on
`http://localhost:5173`, proxied so `/api`, `/uploads` and `/socket.io`
all reach the backend. Open `http://localhost:5173`.

You can also run them separately: `npm run dev:server` / `npm run dev:client`.

## Using it

1. Register an account (email/password, or the "Phone code" tab — the OTP
   is printed in the server's terminal output in dev mode).
2. Go to the **Contacts** tab, search for another user by name/username, and
   send a request. Have that user accept it from their own **Contacts** tab.
3. Click the contact to start a direct chat, or use **+ Group** to create a
   group with 2+ contacts.
4. Messages, typing indicators, presence and read receipts all update live
   over the socket connection; the 📎 button attaches images/files.

## The social layer

Separate from chat contacts (which only unlock messaging), there's a
Facebook-style graph and profile:

- **Friends** (`/api/friends/...`) — request/accept, mutual. **Follow**
  (`/api/follow/...`) — one-way, instant, no acceptance. A user can follow
  someone without being their friend, and vice versa.
- **Profiles** at `/profile` (yours) or `/profile/:userId` (anyone's) —
  cover photo, profile photo, bio, and an About section (work/education/
  location/links) gated by a `public` / `friends` / `only_me` visibility
  setting you control from "Edit profile".
- **Feed** at `/feed` — a composer (text + optional image + per-post
  visibility) and a feed of posts from yourself, your friends, and the
  people you follow, each filtered by that post's own visibility.
- **Activity Log** — a private, owner-only tab on your own profile listing
  your own posts, likes, and comments (not visible to anyone else, matching
  how Facebook's own Activity Log works).

## Notes / next steps

- No automated test suite yet — this MVP was verified with manual end-to-end
  smoke tests (REST flows, socket events, and a scripted two/three-user
  browser walkthrough).
- Media files are stored on local disk under `server/src/uploads/` — swap
  `server/src/middleware/upload.js` for S3/Cloud Storage before deploying
  anywhere with ephemeral disks.
- Dark mode is not implemented yet; the theme tokens live in
  `client/src/index.css` (`@theme` block) if you want to add a dark variant.
- The feed/likes/comments are REST-only for now — no live socket push, so a
  friend's new post or like shows up on your next visit/refresh rather than
  instantly. The chat socket layer is untouched and still fully real-time.
