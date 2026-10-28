// The display's changes are calm (pages/Display.jsx): the new image dissolves in over the old one, which stays
// fully there underneath; the first image fades in; a cleared slot fades out. Read from the browser's computed
// opacity during the fade.
import { test, expect } from '@playwright/test'
import { setSlot, fixture } from './helpers'

const opacityOf = (page, url) => page.evaluate((u) => {
  const img = [...document.querySelectorAll('img[data-layer]')].find((i) => i.dataset.url === u)
  return img ? Number(getComputedStyle(img).opacity) : null
}, url)

test('a change dissolves the new image in over the old one, which stays fully there until it is in', async ({ page, request }) => {
  await setSlot(request, 4, { imageUrl: fixture(1).url, rotation: null })
  await page.goto('/display?slot=4')
  await expect.poll(() => opacityOf(page, fixture(1).url), { timeout: 5000 }).toBe(1)

  await setSlot(request, 4, { imageUrl: fixture(2).url })
  // halfway: the new one partly there, the old one still entirely
  await expect.poll(() => opacityOf(page, fixture(2).url)).toBeGreaterThan(0.05)
  const during = await opacityOf(page, fixture(2).url)
  expect(during).toBeLessThan(0.95)
  expect(await opacityOf(page, fixture(1).url)).toBe(1)
  // in the end the new one is there and the old one gone
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
