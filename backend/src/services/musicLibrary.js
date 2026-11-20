// The player's library: the Grimoire's music section (grimoire.piogino.ch/music, 2026-11-20) — one list of music and
// ambience links for every table, each with its sound (ambience, music, music with vocals), settings and moods. The
// player reads it from there (public) and saves, changes and deletes with this server's key (ADENAI_MEDIA_KEY, the
// Grimoire's GRIMOIRE_MEDIA_KEYS). Every page hears 'library:changed' after a change and reads it again.
const { parseVideoId } = require('../../../shared/player.mjs');

const GRIMOIRE = (process.env.GRIMOIRE_URL || 'https://grimoire.piogino.ch').replace(/\/+$/, '');
const FRESH_MS = 30 * 1000;
let io = null;
let cache = null; // { at, value }

const bad = (status, message) => Object.assign(new Error(message), { status });
async function call(method, path, body) {
  const r = await fetch(`${GRIMOIRE}/api${path}`, {
    method,
    headers: { ...(method === 'GET' ? {} : { 'X-Media-Key': process.env.ADENAI_MEDIA_KEY || '' }), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(10000),
  });
  const text = await r.text();
  const data = text ? JSON.parse(text) : null;
  if (!r.ok) throw bad(r.status === 404 ? 404 : r.status === 400 ? 400 : 502, data?.error || `The Grimoire answered ${r.status}`);
  return data;
}

// an entry of the section → a track of the player's library
const track = (e) => ({
  id: e.slug, name: e.name, videoId: parseVideoId(e.data.youtube), title: e.name,
  sound: e.data.sound || null, settings: e.data.settings || [], moods: e.data.moods || [],
  length: e.data.length || null, channel: e.data.channel || null, addedAt: e.createdAt,
});

// { tracks, options: { sounds, settings, moods } } — the options are the section's own lists
async function list({ fresh = false } = {}) {
  if (!fresh && cache && Date.now() - cache.at < FRESH_MS) return cache.value;
  const [{ entries }, { kinds }] = await Promise.all([call('GET', '/music'), call('GET', '/kinds')]);
  const field = (k) => kinds.music.fields.find((f) => f.key === k)?.options || [];
  const value = { tracks: entries.map(track).filter((t) => t.videoId), options: { sounds: field('sound'), settings: field('settings'), moods: field('moods') } };
  cache = { at: Date.now(), value };
  return value;
}

const changed = () => { cache = null; io?.emit('library:changed', { at: Date.now() }); };
const pick = (body) => Object.fromEntries(['sound', 'settings', 'moods'].filter((k) => k in body).map((k) => [k, body[k] || undefined]));

// a video into the section: { videoId, title, channel } and the body's name, sound, settings, moods
async function save(video, body = {}) {
  const { entry } = await call('POST', '/music', {
    name: (body.name || '').trim() || video.title,
    data: { youtube: `https://www.youtube.com/watch?v=${video.videoId}`, channel: video.channel, ...pick(body) },
  });
  changed();
  return track(entry);
}

// name, sound, settings, moods changed; the rest of the entry kept
async function update(slug, body = {}) {
  const { entry } = await call('GET', `/music/${encodeURIComponent(slug)}`);
  const name = (body.name ?? entry.name).trim();
  if (!name) throw bad(400, 'Name is required');
  const { entry: next } = await call('PUT', `/music/${encodeURIComponent(slug)}`, { name, summary: entry.summary, body: entry.body, tags: entry.tags, data: { ...entry.data, ...pick(body) } });
  changed();
  return track(next);
}

async function remove(slug) {
  await call('DELETE', `/music/${encodeURIComponent(slug)}`);
  changed();
}

module.exports = { list, save, update, remove, init: (socketServer) => { io = socketServer; } };
