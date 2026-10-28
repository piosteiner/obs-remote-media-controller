// The display's changes are calm (pages/Display.jsx): the new image fades in while the old one fades out, at
// the same time, without the two becoming see-through together; the first image fades in; a cleared slot fades
// out. Read from the browser's computed opacity during the fade.
import { test, expect } from '@playwright/test'
import { setSlot, fixture } from './helpers'

const opacityOf = (page, url) => page.evaluate((u) => {
  const img = [...document.querySelectorAll('img[data-layer]')].find((i) => i.dataset.url === u)
  return img ? Number(getComputedStyle(img).opacity) : null
}, url)

test('a change: the new image fades in while the old one fades out, at the same time, never see-through', async ({ page, request }) => {
  await setSlot(request, 4, { imageUrl: fixture(1).url, rotation: null })
  await page.goto('/display?slot=4')
  await expect.poll(() => opacityOf(page, fixture(1).url), { timeout: 5000 }).toBe(1)

  await setSlot(request, 4, { imageUrl: fixture(2).url })
  await expect.poll(() => opacityOf(page, fixture(2).url)).toBeGreaterThan(0.05)
  // during the fade: both moving at once — the old one already going — and together they cover the screen
  let bothMoving = false
  for (let i = 0; i < 8; i++) {
    const inc = await opacityOf(page, fixture(2).url)
    const out = await opacityOf(page, fixture(1).url)
    if (inc > 0.05 && inc < 0.95 && out < 0.99) bothMoving = true
    expect(inc + out * (1 - inc), `covered at ${inc.toFixed(2)} / ${out.toFixed(2)}`).toBeGreaterThan(0.85)
    await page.waitForTimeout(150)
  }
  expect(bothMoving).toBe(true)
  await expect.poll(() => opacityOf(page, fixture(2).url), { timeout: 5000 }).toBe(1)
  await expect.poll(() => opacityOf(page, fixture(1).url), { timeout: 5000 }).toBe(0)
})

test('the first image fades in; a cleared slot fades out', async ({ page, request }) => {
  await setSlot(request, 4, { imageUrl: null, rotation: null })
  await page.goto('/display?slot=4')
  await page.waitForTimeout(500)
  await setSlot(request, 4, { imageUrl: fixture(3).url })
  await expect.poll(() => opacityOf(page, fixture(3).url)).toBeGreaterThan(0.05)
  expect(await opacityOf(page, fixture(3).url)).toBeLessThan(0.95) // not at once
  await expect.poll(() => opacityOf(page, fixture(3).url), { timeout: 5000 }).toBe(1)

  await setSlot(request, 4, { imageUrl: null })
  await expect.poll(() => opacityOf(page, fixture(3).url)).toBeLessThan(0.95)
  expect(await opacityOf(page, fixture(3).url)).toBeGreaterThan(0.05) // not gone at once
  await expect.poll(() => opacityOf(page, fixture(3).url), { timeout: 5000 }).toBe(0)
})

test("the slot's preview on the controller changes with the same transition as the display", async ({ page, request }) => {
  await page.addInitScript(() => localStorage.setItem('obs-admin-key', 'test-key'))
  await setSlot(request, 2, { imageUrl: fixture(5).url, rotation: null })
  await page.goto('/control')
  const preview = (url) => page.evaluate((u) => {
    const img = [...document.querySelectorAll('[data-testid="slot-2"] img[data-layer]')].find((i) => i.dataset.url === u)
    return img ? Number(getComputedStyle(img).opacity) : null
  }, url)
  await expect.poll(() => preview(fixture(5).url), { timeout: 5000 }).toBe(1)
  await setSlot(request, 2, { imageUrl: fixture(6).url })
  await expect.poll(() => preview(fixture(6).url)).toBeGreaterThan(0.05)
  const inc = await preview(fixture(6).url)
  const out = await preview(fixture(5).url)
  expect(inc).toBeLessThan(0.95) // fading, not switched
  expect(out).toBeLessThan(1) // the old one going at the same time
  await expect.poll(() => preview(fixture(6).url), { timeout: 5000 }).toBe(1)
  await expect.poll(() => preview(fixture(5).url), { timeout: 5000 }).toBe(0)
})
