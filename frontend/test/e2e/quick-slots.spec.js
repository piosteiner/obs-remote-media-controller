// The quick images below a slot and the rotation (components/control/QuickSlots.jsx, pages/Display.jsx)
import { test, expect } from '@playwright/test'
import { loggedIn, slotOf, setSlot, fixture, quickGrid, cell } from './helpers'

test.beforeEach(async ({ page }) => { await loggedIn(page) })

test('a quick slot is filled from the library, and a click shows it in the slot', async ({ page, request }) => {
  await setSlot(request, 1, { quick: [], imageUrl: null })
  await page.goto('/control')
  await cell(page, 1, 3).getByRole('button').click()
  await page.getByRole('tab', { name: 'OBS library' }).click()
  await page.getByRole('button', { name: /Fixture 2/ }).click()
  await page.getByRole('button', { name: 'Select Image' }).click()
  await expect(cell(page, 1, 3).locator('img')).toHaveAttribute('src', fixture(2).url)
  await expect(cell(page, 1, 3).getByTestId('quick-name')).toHaveText('Fixture 2') // its name, as in the picker
  expect((await slotOf(request, 1)).quick[3]).toMatchObject({ url: fixture(2).url, imageId: 1001, name: 'Fixture 2' })

  await cell(page, 1, 3).getByTitle(/^Show/).click()
  await expect(cell(page, 1, 3).getByText('on', { exact: true })).toBeVisible()
  expect((await slotOf(request, 1)).imageUrl).toBe(fixture(2).url)
})

test('"+ Current" puts the shown image into the first free quick slot; emptying a quick slot', async ({ page, request }) => {
  await setSlot(request, 2, { quick: [fixture(1)], imageUrl: fixture(4).url })
  await page.goto('/control')
  await quickGrid(page, 2).getByRole('button', { name: /Current/ }).click()
  await expect(cell(page, 2, 1).locator('img')).toHaveAttribute('src', fixture(4).url)
  await expect(cell(page, 2, 1).getByTestId('quick-name')).toHaveText('Fixture 4') // the name from the library
  await cell(page, 2, 0).hover()
  await cell(page, 2, 0).getByTitle('Empty this quick slot').click()
  await expect(cell(page, 2, 0).locator('img')).toHaveCount(0)
  const quick = (await slotOf(request, 2)).quick
  expect(quick[0]).toBeNull()
  expect(quick[1].url).toBe(fixture(4).url)
})

test('clearing the slot keeps its quick images', async ({ page, request }) => {
  await setSlot(request, 3, { quick: [fixture(1), fixture(2)], imageUrl: fixture(1).url })
  await page.goto('/control')
  await page.getByTestId('slot-3').getByTitle('Clear slot').click()
  await expect.poll(async () => (await slotOf(request, 3)).imageUrl).toBeNull()
  await expect(quickGrid(page, 3).locator('[data-cell] img')).toHaveCount(2)
})

test('a rotation: chosen in order, shown in turn on the display with a fade, the same on the controller; stopped', async ({ page, context, request }) => {
  await setSlot(request, 1, { quick: [fixture(1), fixture(2), fixture(3)], rotation: null, imageUrl: null })
  await page.goto('/control')
  await quickGrid(page, 1).getByRole('button', { name: /Rotate…/ }).click()
  await cell(page, 1, 2).getByRole('button').click()
  await cell(page, 1, 0).getByRole('button').click()
  await expect(cell(page, 1, 2).getByText('1', { exact: true })).toBeVisible() // the order clicked
  await expect(cell(page, 1, 0).getByText('2', { exact: true })).toBeVisible()
  await page.getByLabel('Seconds per image').fill('2')
  await quickGrid(page, 1).getByRole('button', { name: /Rotate 2 images/ }).click()

  const rotation = (await slotOf(request, 1)).rotation
  expect(rotation).toMatchObject({ active: true, intervalSec: 2, items: [{ url: fixture(3).url }, { url: fixture(1).url }] })
  await expect(page.getByText(/Rotating \d\/2 · every 2 s/)).toBeVisible()

  // the display: the front layer changes between the two, with an opacity transition
  const display = await context.newPage()
  await display.goto('/display?slot=1')
  const front = display.locator('img[data-layer="front"]')
  await expect(front).toHaveAttribute('style', /transition: opacity/)
  const seen = new Set()
  for (let i = 0; i < 12 && seen.size < 2; i++) { seen.add(await front.getAttribute('src')); await display.waitForTimeout(400) }
  expect([...seen].sort()).toEqual([fixture(1).url, fixture(3).url].sort())

  // the controller marks the image that is on, as the display shows it
  const on = await front.getAttribute('src')
  const index = [fixture(1).url, fixture(2).url, fixture(3).url].indexOf(on)
  await expect.poll(async () => (await cell(page, 1, index).getByText('on', { exact: true }).count()) +
    (await display.locator('img[data-layer="front"]').getAttribute('src') !== on ? 1 : 0)).toBeGreaterThan(0)

  await quickGrid(page, 1).getByRole('button', { name: /Stop rotation/ }).click()
  await expect(page.getByText(/Rotating/)).toHaveCount(0)
  expect((await slotOf(request, 1)).rotation.active).toBe(false)
})

test('a reloaded display carries on with the rotation where it is', async ({ page, request }) => {
  await setSlot(request, 2, { quick: [fixture(1), fixture(2)], rotation: { active: true, items: [fixture(1), fixture(2)], intervalSec: 60 } })
  const { rotation } = await slotOf(request, 2)
  const expected = Math.floor((Date.now() - rotation.startedAt) / 60000) % 2 === 0 ? fixture(1).url : fixture(2).url
  await page.goto('/display?slot=2')
  await expect(page.locator('img[data-layer="front"]')).toHaveAttribute('src', expected)
  await page.reload()
  await expect(page.locator('img[data-layer="front"]')).toHaveAttribute('src', expected)
})

test('a change on one controller shows on another at once (the socket)', async ({ page, context, request }) => {
  await setSlot(request, 3, { quick: [], imageUrl: null })
  const other = await context.newPage()
  await page.goto('/control')
  await other.goto('/control')
  await setSlot(request, 3, { quick: [fixture(5)] })
  await expect(cell(other, 3, 0).locator('img')).toHaveAttribute('src', fixture(5).url)
  await cell(page, 3, 0).getByTitle(/^Show/).click()
  await expect(cell(other, 3, 0).getByText('on', { exact: true })).toBeVisible()
})
