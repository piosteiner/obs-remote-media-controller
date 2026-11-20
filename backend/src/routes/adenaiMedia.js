// The campaigns' pictures, shown through this server (2026-11-20): they live in the Grimoire's image library
// (grimoire.piogino.ch, one library for every campaign: Adenai's set, and the sets of others), which gives most of them
// only to each campaign's group — an OBS browser source has no password cookie. This server asks with a key of its own
// (ADENAI_MEDIA_KEY, X-Media-Key; its SHA-256 is in the Grimoire's GRIMOIRE_MEDIA_KEYS) and passes them on — but only
//   · pictures in use here: in a slot, a quick image, a rotation, a scene or the library (what the stream shows), or
//   · to the controller (admin key) while it browses the Adenai pictures: a token valid for 12 hours, ?t=…
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const express = require('express');
const { requireApiKey } = require('../middleware/auth');

const router = express.Router();
const GRIMOIRE = (process.env.GRIMOIRE_URL || 'https://grimoire.piogino.ch').replace(/\/+$/, '');
const FILE = /^[A-Za-z0-9_-]+\.(webp|jpe?g|png|gif)$/;
const TOKEN_MS = 12 * 60 * 60 * 1000;

const sign = (exp) => crypto.createHmac('sha256', `adenai-media:${process.env.ADMIN_API_KEY || ''}`).update(String(exp)).digest('base64url');
const makeToken = () => { const exp = Date.now() + TOKEN_MS; return `${exp}.${sign(exp)}`; };
function tokenValid(t) {
  const [exp, sig] = String(t || '').split('.');
  if (!process.env.ADMIN_API_KEY || !exp || !sig || Number(exp) < Date.now()) return false;
  const want = Buffer.from(sign(exp)); const got = Buffer.from(sig);
  return want.length === got.length && crypto.timingSafeEqual(want, got);
}

// the pictures in use: every file name in this server's data (read at most every 2 s)
let inUse = { at: 0, text: '' };
async function usedHere(file) {
  if (Date.now() - inUse.at > 2000) {
    const dir = process.env.OBS_DATA_DIR || path.join(__dirname, '../../data');
    const texts = await Promise.all(['slots.json', 'scenes.json', 'images.json'].map((f) => fs.readFile(path.join(dir, f), 'utf8').catch(() => '')));
    inUse = { at: Date.now(), text: texts.join('\n') };
  }
  return inUse.text.includes(`/${file}`);
}

router.get('/token', requireApiKey, (req, res) => res.json({ success: true, token: makeToken(), expiresIn: TOKEN_MS }));

// the library for the controller (admin key): every picture with the sets it is in (each campaign's own title for it)
router.get('/library', requireApiKey, async (req, res, next) => {
  try {
    const r = await fetch(`${GRIMOIRE}/api/media`, { headers: { 'X-Media-Key': process.env.ADENAI_MEDIA_KEY || '' }, signal: AbortSignal.timeout(15000) });
    if (!r.ok) return res.status(502).json({ success: false, error: { message: `The Grimoire answered ${r.status}` } });
    const { images, projects } = await r.json();
    res.json({ success: true, projects: projects || [], images });
  } catch (err) { next(err); }
});

router.get('/:file', async (req, res, next) => {
  try {
    const { file } = req.params;
    if (!FILE.test(file)) return res.status(404).end();
    if (!tokenValid(req.query.t) && !(await usedHere(file))) return res.status(403).end();
    const up = await fetch(`${GRIMOIRE}/api/media/files/${file}`, { headers: { 'X-Media-Key': process.env.ADENAI_MEDIA_KEY || '' } });
    if (!up.ok) return res.status(up.status === 404 ? 404 : 502).end();
    res.set('Content-Type', up.headers.get('content-type') || 'image/webp');
    res.set('Cache-Control', 'private, max-age=86400');
    res.send(Buffer.from(await up.arrayBuffer()));
  } catch (err) { next(err); }
});

module.exports = { router, tokenValid, makeToken };
