const express = require('express');
const router = express.Router();
const player = require('../services/playerService');

const badRequest = (res, message) =>
  res.status(400).json({ success: false, error: { message } });
const notFound = (res, message) =>
  res.status(404).json({ success: false, error: { message } });

// Resolve { url | videoId, title? } into a video item, fetching the title if needed
async function resolveVideo(body) {
  const videoId = player.parseVideoId(body.url || body.videoId);
  if (!videoId) return null;
  const title = (body.title || '').trim() || await player.fetchTitle(videoId);
  return { videoId, title };
}

const send = (res, { state }) => res.json({ success: true, data: state });

// Current state (public, so anyone can follow along)
router.get('/', async (req, res) => {
  res.json({ success: true, data: await player.getState() });
});

// Play a link now (replaces the current video; the queue is kept)
router.post('/load', async (req, res) => {
  const video = await resolveVideo(req.body);
  if (!video) return badRequest(res, 'Not a valid YouTube link');
  send(res, await player.update((s) => player.startVideo(s, video)));
});

router.post('/play', async (req, res) => {
  send(res, await player.update((s) => {
    if (!s.current) return;
    s.position = player.currentPosition(s);
    // Pressing play on a finished video starts it over
    if (s.current.duration && s.position >= s.current.duration - 0.5) s.position = 0;
    s.playing = true;
    s.updatedAt = Date.now();
  }));
});

router.post('/pause', async (req, res) => {
  send(res, await player.update((s) => {
    if (!s.current) return;
    s.position = player.currentPosition(s);
    s.playing = false;
    s.updatedAt = Date.now();
  }));
});

router.post('/seek', async (req, res) => {
  const position = Number(req.body.position);
  if (!Number.isFinite(position) || position < 0) return badRequest(res, 'Invalid position');
  send(res, await player.update((s) => {
    if (!s.current) return;
    s.position = s.current.duration ? Math.min(position, s.current.duration) : position;
    s.updatedAt = Date.now();
  }));
});

// Skip to the next queued video (repeat-one does not apply to a manual skip)
router.post('/next', async (req, res) => {
  send(res, await player.update((s) => {
    const repeat = s.repeat;
    if (repeat === 'one') s.repeat = 'off';
    player.advance(s);
    s.repeat = repeat;
  }));
});

router.post('/stop', async (req, res) => {
  send(res, await player.update((s) => {
    s.current = null;
    s.playing = false;
    s.position = 0;
    s.updatedAt = Date.now();
  }));
});

router.put('/repeat', async (req, res) => {
  const { mode } = req.body;
  if (!player.REPEAT_MODES.includes(mode)) return badRequest(res, 'Repeat must be off, one or all');
  send(res, await player.update((s) => { s.repeat = mode; }));
});

// Queue
router.post('/queue', async (req, res) => {
  const video = await resolveVideo(req.body);
  if (!video) return badRequest(res, 'Not a valid YouTube link');
  send(res, await player.update((s) => {
    // With nothing playing, a queued video starts right away
    if (!s.current) player.startVideo(s, video);
    else s.queue.push({ id: player.newId(), ...video });
  }));
});

router.post('/queue/:id/play', async (req, res) => {
  const { state, result } = await player.update((s) => {
    const index = s.queue.findIndex(item => item.id === req.params.id);
    if (index === -1) return false;
    player.startVideo(s, s.queue.splice(index, 1)[0]);
    return true;
  });
  if (!result) return notFound(res, 'Queue item not found');
  send(res, { state });
});

router.post('/queue/:id/move', async (req, res) => {
  const offset = req.body.direction === 'up' ? -1 : 1;
  send(res, await player.update((s) => {
    const index = s.queue.findIndex(item => item.id === req.params.id);
    const target = index + offset;
    if (index === -1 || target < 0 || target >= s.queue.length) return;
    [s.queue[index], s.queue[target]] = [s.queue[target], s.queue[index]];
  }));
});

router.delete('/queue/:id', async (req, res) => {
  send(res, await player.update((s) => {
    s.queue = s.queue.filter(item => item.id !== req.params.id);
  }));
});

router.delete('/queue', async (req, res) => {
  send(res, await player.update((s) => { s.queue = []; }));
});

// Saved links
router.post('/saved', async (req, res) => {
  const video = await resolveVideo(req.body);
  if (!video) return badRequest(res, 'Not a valid YouTube link');
  const name = (req.body.name || '').trim() || video.title;
  send(res, await player.update((s) => {
    s.saved.push({ id: player.newId(), name, ...video });
  }));
});

router.put('/saved/:id', async (req, res) => {
  const name = (req.body.name || '').trim();
  if (!name) return badRequest(res, 'Name is required');
  const { state, result } = await player.update((s) => {
    const item = s.saved.find(entry => entry.id === req.params.id);
    if (item) item.name = name;
    return !!item;
  });
  if (!result) return notFound(res, 'Saved link not found');
  send(res, { state });
});

router.delete('/saved/:id', async (req, res) => {
  send(res, await player.update((s) => {
    s.saved = s.saved.filter(entry => entry.id !== req.params.id);
  }));
});

module.exports = router;
