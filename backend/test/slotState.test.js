// services/slotState.js: how a change is applied to a slot — quick images, rotation, the image shown
const test = require('node:test');
const assert = require('node:assert/strict');
const { applySlotUpdate, clearSlot, rotationIndex, QUICK_SLOTS } = require('../src/services/slotState');

const img = (n) => ({ url: `https://x/${n}.webp`, imageId: n, thumbnailUrl: `https://x/${n}-t.webp`, name: `Image ${n}` });
const NOW = Date.parse('2026-10-28T20:00:00Z');

test('only what the body names changes: the quick images stay when an image is shown', () => {
  const withQuick = applySlotUpdate({}, { quick: [img(1), null, img(3)] }, NOW);
  assert.equal(withQuick.quick.length, QUICK_SLOTS);
  assert.deepEqual(withQuick.quick.slice(0, 3), [img(1), null, img(3)]);
  const shown = applySlotUpdate(withQuick, { imageUrl: img(3).url, imageId: 3 }, NOW + 1000);
  assert.equal(shown.imageUrl, img(3).url);
  assert.deepEqual(shown.quick, withQuick.quick);
});

test('quick images: unusable entries become empty, never more than ten', () => {
  const s = applySlotUpdate({}, { quick: [{ url: '' }, { nope: 1 }, img(1), ...Array(20).fill(img(2))] }, NOW);
  assert.equal(s.quick.length, QUICK_SLOTS);
  assert.deepEqual(s.quick.slice(0, 3), [null, null, img(1)]);
  assert.throws(() => applySlotUpdate({}, { quick: 'x' }), /list/);
});

test('a rotation starts now, shows its first image, needs two images; showing one image stops it', () => {
  const s = applySlotUpdate({}, { rotation: { active: true, items: [img(1), img(2), img(3)], intervalSec: 5 } }, NOW);
  assert.deepEqual(s.rotation, { active: true, items: [img(1), img(2), img(3)], intervalSec: 5, startedAt: NOW });
  assert.equal(s.imageUrl, img(1).url);
  assert.throws(() => applySlotUpdate({}, { rotation: { active: true, items: [img(1)] } }), /two images/);
  const stopped = applySlotUpdate(s, { imageUrl: img(9).url }, NOW + 1);
  assert.equal(stopped.rotation.active, false);
  assert.deepEqual(stopped.rotation.items, s.rotation.items); // kept, to start again
});

test('the interval is kept between 2 seconds and an hour', () => {
  const r = (intervalSec) => applySlotUpdate({}, { rotation: { active: true, items: [img(1), img(2)], intervalSec } }, NOW).rotation.intervalSec;
  assert.equal(r(0.5), 2);
  assert.equal(r(99999), 3600);
  assert.equal(r('abc'), 10);
});

test('which image is on: the same for every device, from the start and the interval', () => {
  const rotation = { active: true, items: [img(1), img(2), img(3)], intervalSec: 10, startedAt: NOW };
  assert.equal(rotationIndex(rotation, NOW), 0);
  assert.equal(rotationIndex(rotation, NOW + 9999), 0);
  assert.equal(rotationIndex(rotation, NOW + 10000), 1);
  assert.equal(rotationIndex(rotation, NOW + 35000), 0); // round again
  assert.equal(rotationIndex({ ...rotation, active: false }, NOW + 15000), 0);
});

test('clearing a slot keeps its quick images', () => {
  const s = applySlotUpdate({}, { quick: [img(1)], rotation: { active: true, items: [img(1), img(2)] } }, NOW);
  const cleared = clearSlot(s);
  assert.equal(cleared.imageUrl, null);
  assert.equal(cleared.rotation, null);
  assert.deepEqual(cleared.quick, s.quick);
});
