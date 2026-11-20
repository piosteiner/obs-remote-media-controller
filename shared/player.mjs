// The shared YouTube player's rules, used by the server (backend/src/services/playerService.js) and the browser demo
// (frontend/src/demo): the timeline (position + time since updatedAt while playing), starting a video, what comes
// after one ends (repeat one / all, the queue).
const REPEAT_MODES = ['off', 'one', 'all'];

const defaultState = () => ({
  current: null,      // { sessionId, videoId, title, duration }
  playing: false,
  position: 0,        // seconds at updatedAt
  updatedAt: Date.now(),
  repeat: 'off',
  queue: [],          // [{ id, videoId, title }]
  saved: []           // [{ id, name, videoId, title }]
});

// 12 hex characters (Web Crypto: in browsers and in Node)
const newId = () => Array.from(globalThis.crypto.getRandomValues(new Uint8Array(6)), (b) => b.toString(16).padStart(2, '0')).join('');

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

function currentPosition(state, now = Date.now()) {
  if (!state.current) return 0;
  const position = state.position + (state.playing ? (now - state.updatedAt) / 1000 : 0);
  const duration = state.current.duration;
  return Math.max(0, duration ? Math.min(position, duration) : position);
}

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

export { REPEAT_MODES, defaultState, newId, parseVideoId, currentPosition, startVideo, advance };
