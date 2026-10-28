// The API of a real server (test/helpers.js): who may write, slots with quick images and rotation, scenes,
// image uploads, the live updates over the socket.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { io } = require('socket.io-client');
const { startServer, KEY } = require('./helpers');

let server;
test.before(async () => { server = await startServer(); });
test.after(() => server.stop());

const img = (n) => ({ url: `https://example.org/${n}.webp`, imageId: null, thumbnailUrl: null, name: `Image ${n}` });
const slotFile = () => JSON.parse(fs.readFileSync(path.join(server.dataDir, 'slots.json'), 'utf8'));

test('reading is open, writing needs the admin key', async () => {
  assert.equal((await server.api('GET', '/slots', null, { key: null })).status, 200);
  assert.equal((await server.api('PUT', '/slots/1', { imageUrl: img(1).url }, { key: null })).status, 401);
  assert.equal((await server.api('PUT', '/slots/1', { imageUrl: img(1).url }, { key: 'wrong' })).status, 401);
  assert.equal((await server.api('GET', '/auth/check', null, { key: 'wrong' })).status, 401);
  assert.equal((await server.api('GET', '/auth/check')).status, 200);
});

test('a slot keeps its quick images when an image is shown and when it is cleared — also on disk', async () => {
  await server.api('PUT', '/slots/2', { quick: [img(1), img(2)] });
  const shown = await server.api('PUT', '/slots/2', { imageUrl: img(2).url });
  assert.equal(shown.body.data.imageUrl, img(2).url);
  assert.deepEqual(shown.body.data.quick.slice(0, 2), [img(1), img(2)]);
  const cleared = await server.api('DELETE', '/slots/2');
  assert.equal(cleared.body.data.imageUrl, null);
  assert.deepEqual(cleared.body.data.quick.slice(0, 2), [img(1), img(2)]);
  assert.deepEqual(slotFile()['2'].quick.slice(0, 2), [img(1), img(2)]);
});

test('a rotation: started, its first image shown; one image is refused; showing an image stops it', async () => {
  const bad = await server.api('PUT', '/slots/3', { rotation: { active: true, items: [img(1)] } });
  assert.equal(bad.status, 400);
  const started = await server.api('PUT', '/slots/3', { rotation: { active: true, items: [img(4), img(5)], intervalSec: 3 } });
  assert.equal(started.status, 200);
  assert.equal(started.body.data.imageUrl, img(4).url);
  assert.equal(started.body.data.rotation.intervalSec, 3);
  assert.ok(Math.abs(started.body.data.rotation.startedAt - Date.now()) < 5000);
  const stopped = await server.api('PUT', '/slots/3', { imageUrl: img(6).url });
  assert.equal(stopped.body.data.rotation.active, false);
});

test('changes to one slot at the same time all arrive (one after the other on disk)', async () => {
  await Promise.all(Array.from({ length: 8 }, (_, i) => server.api('PUT', `/slots/${10 + i}`, { quick: [img(i)] })));
  const slots = slotFile();
  for (let i = 0; i < 8; i++) assert.deepEqual(slots[String(10 + i)].quick[0], img(i));
});

test('every client hears the whole slot over the socket', async () => {
  const socket = io(server.url, { transports: ['websocket'] });
  try {
    await new Promise((resolve, reject) => { socket.on('connect', resolve); socket.on('connect_error', reject); });
    const heard = new Promise((resolve) => socket.on('slot:updated', (d) => { if (d.slot === '4') resolve(d); }));
    await server.api('PUT', '/slots/4', { quick: [img(7)] });
    await server.api('PUT', '/slots/4', { imageUrl: img(8).url });
    const first = await heard;
    assert.deepEqual(first.quick[0], img(7));
  } finally {
    socket.close();
  }
});

test('a listening socket without the key may not change slots', async () => {
  const socket = io(server.url, { transports: ['websocket'], auth: { token: 'wrong' } });
  try {
    await new Promise((resolve) => socket.on('connect', resolve));
    const refused = new Promise((resolve) => socket.on('error', resolve));
    socket.emit('slot:update', { slot: 5, imageUrl: img(9).url });
    assert.match((await refused).message, /Unauthorized/);
  } finally {
    socket.close();
  }
});

test('a scene carries the quick images and the rotation, and brings them back', async () => {
  await server.api('PUT', '/slots/1', { quick: [img(1), img(2), img(3)], rotation: { active: true, items: [img(1), img(2)], intervalSec: 5 } });
  const scene = (await server.api('POST', '/scenes', { name: 'Session 12', slots: {} })).body.data;
  await server.api('POST', `/scenes/${scene.id}/capture`);
  await server.api('PUT', '/slots/1', { quick: [], rotation: null });
  await server.api('POST', `/scenes/${scene.id}/load`);
  const slot = slotFile()['1'];
  assert.deepEqual(slot.quick.slice(0, 3), [img(1), img(2), img(3)]);
  assert.equal(slot.rotation.active, true);
});

test('an uploaded image is stored with a thumbnail, served, listed, and deleted with its files', async () => {
  const png = await sharp({ create: { width: 800, height: 600, channels: 3, background: '#7a3' } }).png().toBuffer();
  const form = new FormData();
  form.append('image', new Blob([png], { type: 'image/png' }), 'test.png');
  const up = await server.api('POST', '/images/upload', form);
  assert.equal(up.status, 201, JSON.stringify(up.body));
  const image = up.body.data;
  assert.ok(image.url.startsWith(`${server.url}/uploads/`));
  assert.ok(image.thumbnailUrl);
  assert.equal((await fetch(image.url)).status, 200);
  assert.equal((await fetch(image.thumbnailUrl)).status, 200);
  const files = fs.readdirSync(server.uploadsDir);
  assert.ok(files.length >= 2);
  assert.ok((await server.api('GET', '/images')).body.data.images.some((i) => i.id === image.id));
  assert.equal((await server.api('DELETE', `/images/${image.id}`)).status, 200);
  assert.ok(!(await server.api('GET', '/images')).body.data.images.some((i) => i.id === image.id));
  assert.equal(fs.readdirSync(server.uploadsDir).length, 0);
});
