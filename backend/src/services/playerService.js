const path = require('path');
const storage = require('./storage');
// the rules (timeline, queue, repeat) are shared with the browser demo
const { REPEAT_MODES, defaultState, newId, parseVideoId, currentPosition, startVideo, advance } = require('../../../shared/player.mjs');

// Shared YouTube player. The server owns the timeline: clients play
// `current.videoId` at position + (now - updatedAt) while `playing`, so every
// device (and late joiners) land on the same spot. The server also advances
// the queue when a video ends, so it works with any number of open clients.

const playerFile = path.join(storage.dataDir, 'player.json');
const END_GRACE_MS = 750;

let io = null;
let endTimer = null;

// Title and channel via YouTube oEmbed (no API key needed); the title falls back to the id
async function fetchInfo(videoId) {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (!response.ok) return { title: videoId };
    const data = await response.json();
    return { title: data.title || videoId, channel: data.author_name || undefined };
  } catch {
    return { title: videoId };
  }
}

// the saved links are the Grimoire's now (services/musicLibrary.js); an old list in the file is not sent
const publicState = ({ saved, ...state }) => ({ ...state, serverTime: Date.now() });

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
  fetchInfo,
  currentPosition,
  startVideo,
  advance,
  update,
  getState,
  init,
  newId
};
