// At the table: keys for the quick images and the rotation, images dropped onto a quick slot, a display that
// has the next images ready (components/control/QuickSlots.jsx, pages/Display.jsx)
import { test, expect } from '@playwright/test'
import { loggedIn, slotOf, setSlot, fixture, quickGrid, cell } from './helpers'

test('keys 1–0 show the quick images of the slot last used; not while typing; Space starts and stops the rotation', async ({ page, request }) => {
  await loggedIn(page)
  await setSlot(request, 1, { quick: [fixture(1), fixture(2), fixture(3)], imageUrl: null,
    rotation: { active: false, items: [fixture(1), fixture(3)], intervalSec: 12 } })
  await setSlot(request, 2, { quick: [fixture(4), fixture(5)], imageUrl: null, rotation: null })
  await page.goto('/control')
  await expect(quickGrid(page, 1).getByTestId('keys-hint')).toBeVisible() // slot 1 at first
  await expect(quickGrid(page, 2).getByTestId('keys-hint')).toHaveCount(0)

  await page.keyboard.press('2')
  await expect.poll(async () => (await slotOf(request, 1)).imageUrl).toBe(fixture(2).url)

  // typing in a field: no key works
  await page.getByTestId('slot-1').getByRole('button', { name: /URL/ }).click()
  await page.getByPlaceholder('https://example.com/image.png').type('3')
  await page.waitForTimeout(400)
  expect((await slotOf(request, 1)).imageUrl).toBe(fixture(2).url)
  await page.getByTestId('slot-1').getByRole('button', { name: 'Cancel' }).click()

  // Space: the rotation set up last starts again, with its seconds; again: stops
  await page.keyboard.press(' ')
  await expect.poll(async () => (await slotOf(request, 1)).rotation?.active).toBe(true)
  expect((await slotOf(request, 1)).rotation.intervalSec).toBe(12)
  await page.keyboard.press(' ')
  await expect.poll(async () => (await slotOf(request, 1)).rotation?.active).toBe(false)

  // used slot 2: the keys work there now
  await quickGrid(page, 2).getByRole('heading', { name: /Quick images/ }).click()
  await expect(quickGrid(page, 2).getByTestId('keys-hint')).toBeVisible()
  await page.keyboard.press('1')
  await expect.poll(async () => (await slotOf(request, 2)).imageUrl).toBe(fixture(4).url)
  expect((await slotOf(request, 1)).imageUrl).not.toBe(fixture(4).url)
})

test('an image file dropped onto a quick slot is uploaded to the library and put there', async ({ page, request }) => {
  await loggedIn(page)
  await setSlot(request, 3, { quick: [], imageUrl: null, rotation: null })
  await page.goto('/control')
  await page.evaluate(async () => {
    const blob = await (await fetch('http://localhost:3113/uploads/fixture-6.png')).blob()
    const data = new DataTransfer()
    data.items.add(new File([blob], 'dropped-portrait.png', { type: 'image/png' }))
    const target = document.querySelector('[data-testid="quick-slots-3"] [data-cell="4"]')
    target.dispatchEvent(new DragEvent('dragover', { dataTransfer: data, bubbles: true, cancelable: true }))
    target.dispatchEvent(new DragEvent('drop', { dataTransfer: data, bubbles: true, cancelable: true }))
  })
  await expect(cell(page, 3, 4).locator('img')).toHaveAttribute('src', /\/uploads\/thumb_/)
  await expect(cell(page, 3, 4).getByTestId('quick-name')).toHaveText('dropped-portrait.png')
  const q = (await slotOf(request, 3)).quick[4]
  expect(q.url).toMatch(/^http:\/\/localhost:3113\/uploads\//)
  expect((await (await request.get('http://localhost:3113/api/images')).json()).data.images.some((im) => im.url === q.url)).toBe(true)
})

test('the display has the quick images ready before they are shown', async ({ page, request }) => {
  await setSlot(request, 4, { quick: [fixture(1), fixture(2), fixture(3)], imageUrl: fixture(1).url, rotation: null })
  const fetched = new Set()
  page.on('requestfinished', (r) => fetched.add(r.url()))
  await page.goto('/display?slot=4')
  await expect.poll(() => [fixture(2).url, fixture(3).url].every((u) => fetched.has(u)), { timeout: 5000 }).toBe(true)
  await expect(page.locator('img[data-layer="front"]')).toHaveAttribute('data-url', fixture(1).url)
})
