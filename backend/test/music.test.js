// The player's library is the Grimoire's music section (services/musicLibrary.js): read from there, saved, changed
// and deleted there with this server's key — here against a stand-in Grimoire
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const { startServer } = require('./helpers');

const entries = [{ slug: 'tavern', name: 'Tavern', createdAt: '2026-11-20T10:00:00Z', data: { youtube: 'https://www.youtube.com/watch?v=abcdefghijk', sound: 'Ambience', settings: ['Tavern & inn'], moods: ['Cheerful'], length: '1 hour', channel: 'Bardify' } }];
const seen = [];
const grimoire = http.createServer((req, res) => {
  let body = '';
  req.on('data', (d) => { body += d; });
  req.on('end', () => {
    seen.push({ method: req.method, url: req.url, key: req.headers['x-media-key'], body: body ? JSON.parse(body) : null });
    const json = (status, data) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(data ? JSON.stringify(data) : ''); };
    if (req.method !== 'GET' && req.headers['x-media-key'] !== 'test-media-key') return json(401, { error: 'Login required' });
    if (req.url === '/api/kinds') return json(200, { kinds: { music: { fields: [{ key: 'sound', options: ['Ambience', 'Music', 'Music with vocals'] }, { key: 'settings', options: ['Tavern & inn', 'Forest'] }, { key: 'moods', options: ['Calm', 'Cheerful'] }] } } });
    if (req.url === '/api/music' && req.method === 'GET') return json(200, { entries });
    if (req.url === '/api/music' && req.method === 'POST') { const e = { slug: 'forest', createdAt: '2026-11-20T11:00:00Z', ...JSON.parse(body) }; entries.push(e); return json(201, { entry: e }); }
    const m = /^\/api\/music\/([\w-]+)$/.exec(req.url);
    const e = m && entries.find((x) => x.slug === m[1]);
    if (!e) return json(404, { error: 'Not found' });
    if (req.method === 'GET') return json(200, { entry: e });
    if (req.method === 'PUT') { Object.assign(e, JSON.parse(body)); return json(200, { entry: e }); }
    if (req.method === 'DELETE') { entries.splice(entries.indexOf(e), 1); return json(204); }
  });
});

let server;
test.before(async () => {
  await new Promise((r) => grimoire.listen(0, r));
  server = await startServer({ GRIMOIRE_URL: `http://127.0.0.1:${grimoire.address().port}` });
});
test.after(async () => { await server.stop(); grimoire.close(); });

test('the library: the section\'s tracks with their sound, settings and moods, and the lists to choose from', async () => {
  const r = await server.api('GET', '/player/library', null, { key: null });
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.data.tracks[0], { id: 'tavern', name: 'Tavern', videoId: 'abcdefghijk', title: 'Tavern', sound: 'Ambience', settings: ['Tavern & inn'], moods: ['Cheerful'], length: '1 hour', channel: 'Bardify', addedAt: '2026-11-20T10:00:00Z' });
  assert.deepEqual(r.body.data.options.settings, ['Tavern & inn', 'Forest']);
});

test('saving, changing and deleting go to the Grimoire with this server\'s key; without the admin key nothing', async () => {
  assert.equal((await server.api('POST', '/player/saved', { url: 'https://youtu.be/zyxwvutsrqp', name: 'Woods' }, { key: null })).status, 401);
  const made = await server.api('POST', '/player/saved', { url: 'https://youtu.be/zyxwvutsrqp', name: 'Woods', title: 'Woods', sound: 'Music', settings: ['Forest'] });
  assert.equal(made.status, 201);
  const post = seen.find((s) => s.method === 'POST');
  assert.equal(post.key, 'test-media-key');
  assert.deepEqual(post.body.data, { youtube: 'https://www.youtube.com/watch?v=zyxwvutsrqp', sound: 'Music', settings: ['Forest'] });
  assert.equal(post.body.name, 'Woods');
  const changed = await server.api('PUT', '/player/saved/forest', { name: 'Old Woods', moods: ['Calm'] });
  assert.equal(changed.body.data.name, 'Old Woods');
  assert.deepEqual(changed.body.data.moods, ['Calm']);
  assert.deepEqual(changed.body.data.settings, ['Forest']); // what the change did not name stays
  assert.equal((await server.api('PUT', '/player/saved/nothing', { name: 'x' })).status, 404);
  assert.equal((await server.api('DELETE', '/player/saved/forest')).status, 200);
  assert.equal((await server.api('GET', '/player/library?fresh=1', null, { key: null })).body.data.tracks.length, 1);
});
