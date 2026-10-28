// What a slot holds and how a change is applied to it (routes/slots.js). Besides the image shown, a slot has
// quick images — ten prepared ones to switch to — and a rotation: several images shown in turn, faded into each
// other. The display computes which one is on (rotationIndex: from startedAt and the interval, the same on every
// device), so a reloaded browser source carries on where it was.
//
//   { imageId, imageUrl, updatedAt,
//     quick: [ { url, imageId, thumbnailUrl, name } | null ] (QUICK_SLOTS),
//     rotation: { active, items: [ { url, imageId, thumbnailUrl, name } ], intervalSec, startedAt } | null }
const QUICK_SLOTS = 10;
const MAX_ROTATION = 11; // the image shown and the ten quick ones
const INTERVAL = { min: 2, max: 3600, default: 10 };

const badRequest = (message) => Object.assign(new Error(message), { status: 400 });
const text = (v, max) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);

// an image as quick slots and rotations keep it; null for nothing usable
function cleanItem(x) {
  const url = x && text(x.url, 2000);
  if (!url) return null;
  return { url, imageId: x.imageId ?? null, thumbnailUrl: text(x.thumbnailUrl, 2000), name: text(x.name, 200) };
}

function cleanQuick(quick) {
  if (!Array.isArray(quick)) throw badRequest('quick: a list is needed');
  return Array.from({ length: QUICK_SLOTS }, (_, i) => cleanItem(quick[i]));
}

function cleanRotation(rotation, now) {
  if (!rotation) return null;
  const items = (Array.isArray(rotation.items) ? rotation.items : []).map(cleanItem).filter(Boolean).slice(0, MAX_ROTATION);
  const seconds = Number(rotation.intervalSec);
  const intervalSec = Number.isFinite(seconds) ? Math.min(INTERVAL.max, Math.max(INTERVAL.min, Math.round(seconds))) : INTERVAL.default;
  const active = !!rotation.active;
  if (active && items.length < 2) throw badRequest('A rotation needs at least two images');
  return { active, items, intervalSec, startedAt: active ? now : null };
}

// The slot after a change: only what the body names changes. Showing an image (imageUrl) stops a rotation;
// starting a rotation shows its first image.
function applySlotUpdate(current = {}, body = {}, now = Date.now()) {
  const next = { imageId: null, imageUrl: null, quick: null, rotation: null, ...current };
  if ('quick' in body) next.quick = cleanQuick(body.quick);
  if ('imageUrl' in body || 'imageId' in body) {
    next.imageUrl = text(body.imageUrl, 2000);
    next.imageId = body.imageId ?? null;
    if (!('rotation' in body) && next.rotation) next.rotation = { ...next.rotation, active: false, startedAt: null };
  }
  if ('rotation' in body) {
    next.rotation = cleanRotation(body.rotation, now);
    if (next.rotation?.active) {
      next.imageUrl = next.rotation.items[0].url;
      next.imageId = next.rotation.items[0].imageId;
    }
  }
  next.updatedAt = new Date(now).toISOString();
  return next;
}

// Cleared: no image, no rotation — the prepared quick images stay
const clearSlot = (current = {}) => ({ ...current, imageId: null, imageUrl: null, rotation: null, updatedAt: null });

// Which of a rotation's images is on at a time (ms, the server's clock)
function rotationIndex(rotation, now) {
  if (!rotation?.active || !rotation.items?.length || !rotation.startedAt) return 0;
  return Math.floor(Math.max(0, now - rotation.startedAt) / (rotation.intervalSec * 1000)) % rotation.items.length;
}

module.exports = { QUICK_SLOTS, MAX_ROTATION, INTERVAL, cleanItem, applySlotUpdate, clearSlot, rotationIndex };
