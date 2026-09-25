// One-off script: registers a brand-new test user (no existing password
// needed) and creates N posts as that user through the real API
// (POST /api/posts), so the feed has content to scroll.
//
// Usage:
//   API_URL=http://192.168.37.52:8000/api node scripts/seed-posts.js
//
// Pass COUNT=5 to change how many posts, or SEED_USER=some_name to control
// the generated username instead of the random default.

const API_URL = process.env.API_URL || 'http://localhost:8000/api';
const IDENTIFIER = process.env.SEED_USER || `seed_${Date.now()}`;
const PASSWORD = process.env.SEED_PASS || 'Seed-Pass-123';
const COUNT = Number(process.env.COUNT || 20);

// Reuses files already sitting in server/src/uploads (previously uploaded
// via the app) as post images/videos, so this script needs no separate
// upload step -- it just references their existing /uploads/... path.
const MEDIA = [
  { url: '/uploads/1789830620112-1000013507.jpg', mediaType: 'image' },
  { url: '/uploads/1790350064585-example-1.jpg', mediaType: 'image' },
  { url: '/uploads/1789979442002-Screenshot_2026-09-21_at_1_52_42___PM.png', mediaType: 'image' },
  { url: '/uploads/1789824020811-test.mp4', mediaType: 'video' },
];

const CAPTIONS = [
  'Just setting up my feed.',
  'Coffee first, thoughts later. ☕',
  'Weekend vibes hitting different today.',
  'Anyone else debugging their life rn?',
  'New week, new bugs to fix.',
  'Sunset walk cleared my head.',
  'Trying out this new post feature 👀',
  'Small wins count too.',
  'Rain outside, code inside.',
  'Nothing like a good deploy that just works.',
  'Reading something interesting lately.',
  'Late night thoughts on the timeline.',
  'Testing, testing, is this thing on?',
  'Grateful for the little things today.',
  'Another day, another commit.',
  'Music on, headphones in, focus mode.',
  'Quick update from the desk.',
  'Feeling productive today!',
  'Just a random thought I had.',
  'Signing off for the day, catch you later.',
];

async function main() {
  const registerRes = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: IDENTIFIER, username: IDENTIFIER, password: PASSWORD }),
  });
  if (!registerRes.ok) {
    console.error('Register failed:', registerRes.status, await registerRes.text());
    process.exit(1);
  }
  const { accessToken } = await registerRes.json();
  console.log(`Registered and logged in as ${IDENTIFIER} (password: ${PASSWORD}).`);

  for (let i = 0; i < COUNT; i++) {
    const content = CAPTIONS[i % CAPTIONS.length] + (COUNT > CAPTIONS.length ? ` (#${i + 1})` : '');
    // Every 4th post gets one of the reused media files attached.
    const media = i % 4 === 0 ? MEDIA[(i / 4) % MEDIA.length] : null;
    const body = media
      ? { content, imageUrl: media.url, mediaType: media.mediaType, visibility: 'public' }
      : { content, visibility: 'public' };

    const res = await fetch(`${API_URL}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error(`Post ${i + 1} failed:`, res.status, await res.text());
      continue;
    }
    console.log(`Created post ${i + 1}/${COUNT}`);
  }

  console.log('Done.');
}

main();
