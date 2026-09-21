// Tracks in-progress calls so a client that reconnects after a page reload
// (refresh, brief network drop) can silently rejoin instead of the call
// just dying. Both directions are stored so either side's socket handlers
// can look up "am I in a call, and with whom" in O(1).
const activeCalls = new Map(); // userId -> { peerId, conversationId, callType }

// call:answer only carries { toUserId, answer } -- the conversationId and
// callType live on the original call:invite. Bridge the two here.
const pendingInvites = new Map(); // fromUserId -> { toUserId, conversationId, callType }

export function setPendingInvite(fromUserId, invite) {
  pendingInvites.set(fromUserId, invite);
}

export function takePendingInvite(fromUserId) {
  const invite = pendingInvites.get(fromUserId);
  pendingInvites.delete(fromUserId);
  return invite;
}

export function startActiveCall(userIdA, userIdB, conversationId, callType) {
  activeCalls.set(userIdA, { peerId: userIdB, conversationId, callType });
  activeCalls.set(userIdB, { peerId: userIdA, conversationId, callType });
}

export function getActiveCall(userId) {
  return activeCalls.get(userId);
}

export function endActiveCall(userId) {
  const entry = activeCalls.get(userId);
  if (entry) {
    activeCalls.delete(userId);
    activeCalls.delete(entry.peerId);
  }
  return entry;
}
