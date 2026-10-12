const path = require('path');
const crypto = require('crypto');
const storage = require('./storage');

// Shared YouTube player. The server owns the timeline: clients play
// `current.videoId` at position + (now - updatedAt) while `playing`, so every
// device (and late joiners) land on the same spot. The server also advances
// the queue when a video ends, so it works with any number of open clients.

const playerFile = path.join(storage.dataDir, 'player.json');
const REPEAT_MODES = ['off', 'one', 'all'];
const END_GRACE_MS = 750;

const defaultState = () => ({
  current: null,      // { sessionId, videoId, title, duration }
  playing: false,
  position: 0,        // seconds at updatedAt
  updatedAt: Date.now(),
  repeat: 'off',
  queue: [],          // [{ id, videoId, title }]
  saved: []           // [{ id, name, videoId, title }]
});

let io = null;
let endTimer = null;

const newId = () => crypto.randomBytes(6).toString('hex');

// Accepts watch/short/embed/live/youtu.be links or a bare 11-character id
function parseVideoId(input) {
  const value = String(input || '').trim();
  if (/^[\w-]{11}$/.test(value)) return value;
  let url;
  try {
    url = new URL(value.startsWith('http') ? value : `https://${value}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www\.|m\.|music\.)/, '');
  let id = null;
  if (host === 'youtu.be') id = url.pathname.slice(1);
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    id = url.searchParams.get('v') ||
      url.pathname.match(/^\/(?:shorts|embed|live|v)\/([\w-]{11})/)?.[1];
  }
  return id && /^[\w-]{11}$/.test(id.slice(0, 11)) ? id.slice(0, 11) : null;
}

// Title via YouTube oEmbed (no API key needed); falls back to the id
async function fetchTitle(videoId) {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (!response.ok) return videoId;
    return (await response.json()).title || videoId;
  } catch {
    return videoId;
  }
}

function currentPosition(state, now = Date.now()) {
  if (!state.current) return 0;
  const position = state.position + (state.playing ? (now - state.updatedAt) / 1000 : 0);
  const duration = state.current.duration;
  return Math.max(0, duration ? Math.min(position, duration) : position);
}

const publicState = (state) => ({ ...state, serverTime: Date.now() });

function startVideo(state, item) {
  state.current = { sessionId: newId(), videoId: item.videoId, title: item.title, duration: null };
  state.playing = true;
  state.position = 0;
  state.updatedAt = Date.now();
}

// Called when the current video reaches its end
function advance(state) {
  if (!state.current) return;
  if (state.repeat === 'one') {
    startVideo(state, state.current);
    return;
  }
  const finished = state.current;
  const next = state.queue.shift();
  if (state.repeat === 'all') {
    state.queue.push({ id: newId(), videoId: finished.videoId, title: finished.title });
  }
  if (next) {
    startVideo(state, next);
  } else if (state.repeat === 'all') {
    startVideo(state, state.queue.shift());
  } else {
    // Nothing left: stay on the finished video, paused at the start
    state.playing = false;
    state.position = 0;
    state.updatedAt = Date.now();
  }
}

function scheduleEnd(state) {
  clearTimeout(endTimer);
  if (!state.playing || !state.current?.duration) return;
  const remainingMs = (state.current.duration - currentPosition(state)) * 1000;
  const sessionId = state.current.sessionId;
  endTimer = setTimeout(() => {
    update((s) => {
      if (s.current?.sessionId === sessionId && s.playing) advance(s);
    }).catch((error) => console.error('Player advance failed:', error));
  }, Math.max(0, remainingMs) + END_GRACE_MS);
}

// Serialized read-modify-write of the player state, then broadcast it
async function update(fn) {
  let result;
  const state = await storage.update(playerFile, defaultState(), async (s) => {
    result = await fn(s);
    return s;
  });
  const snapshot = JSON.parse(JSON.stringify(state));
  scheduleEnd(snapshot);
  if (io) io.emit('player:state', publicState(snapshot));
  return { state: publicState(snapshot), result };
}

async function getState() {
  return publicState(await storage.readJson(playerFile, defaultState()));
}

function init(socketServer) {
  io = socketServer;

  io.on('connection', (socket) => {
    // New clients start from the current state
    getState()
      .then((state) => socket.emit('player:state', state))
      .catch((error) => console.error('Failed to send player state:', error));

    // Clients estimate their clock offset to the server with this
    socket.on('player:time', (ack) => {
      if (typeof ack === 'function') ack(Date.now());
    });

    // Any client may report the duration once the YouTube player knows it;
    // only the first sane value per video session is kept
    socket.on('player:duration', ({ sessionId, duration } = {}) => {
      if (!(duration > 0 && duration < 24 * 3600)) return;
      update((s) => {
        if (s.current?.sessionId === sessionId && !s.current.duration) {
          s.current.duration = duration;
        }
      }).catch((error) => console.error('Player duration update failed:', error));
    });
  });

  // Resume the end timer after a restart
  storage.readJson(playerFile, defaultState())
    .then(scheduleEnd)
    .catch((error) => console.error('Failed to read player state:', error));
}

module.exports = {
  REPEAT_MODES,
  parseVideoId,
  fetchTitle,
  currentPosition,
  startVideo,
  advance,
  update,
  getState,
  init,
  newId
};
