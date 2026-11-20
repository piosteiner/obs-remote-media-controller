// The player's library (components/player/MusicLibrary.jsx): search, sort and filters on the Grimoire's music section
// (here served by the test), and saving, editing and deleting — in the demo, where it is all in the browser
import { test, expect } from '@playwright/test'
import { loggedIn } from './helpers'

const track = (id, name, sound, settings, moods, addedAt) => ({ id, name, videoId: `${id}`.padEnd(11, 'x'), title: name, sound, settings, moods, length: '1 hour', channel: 'Bardify', addedAt })
const LIBRARY = { success: true, data: {
  options: { sounds: ['Ambience', 'Music', 'Music with vocals'], settings: ['Town & city', 'Tavern & inn', 'Forest', 'Desert'], moods: ['Calm', 'Cheerful', 'Combat'] },
  tracks: [
    track('tavern', 'Tavern', 'Ambience', ['Tavern & inn'], ['Cheerful'], '2026-11-01T10:00:00Z'),
    track('woods', 'Peaceful Woods', 'Music', ['Forest'], ['Calm'], '2026-11-03T10:00:00Z'),
    track('dunes', 'Desert Excursion', 'Music', ['Desert'], [], '2026-11-02T10:00:00Z'),
    track('brawl', 'Tavern Brawl', 'Music', ['Tavern & inn'], ['Combat'], '2026-11-04T10:00:00Z'),
  ],
} }

test('the library: search, filters by sound, setting and mood, and sorting', async ({ page }) => {
  await loggedIn(page)
  await page.route('**/api/player/library*', (route) => route.fulfill({ json: LIBRARY }))
  await page.goto('/player')
  const lib = page.locator('section').filter({ has: page.getByRole('heading', { name: /^Library/ }) })
  const names = () => lib.locator('li p.font-medium').allTextContents()
  await expect(lib.getByRole('heading')).toContainText('(4)')
  expect(await names()).toEqual(['Desert Excursion', 'Peaceful Woods', 'Tavern', 'Tavern Brawl'])
  await lib.getByLabel('Sort').selectOption('new')
  expect(await names()).toEqual(['Tavern Brawl', 'Peaceful Woods', 'Desert Excursion', 'Tavern'])
  await lib.getByRole('group', { name: 'Setting' }).getByRole('button', { name: /Tavern & inn/ }).click()
  expect(await names()).toEqual(['Tavern Brawl', 'Tavern'])
  await lib.getByRole('group', { name: 'Sound' }).getByRole('button', { name: 'Ambience' }).click()
  expect(await names()).toEqual(['Tavern'])
  await lib.getByRole('button', { name: 'Clear filters' }).click()
  await lib.getByLabel('Search the library').fill('calm')
  expect(await names()).toEqual(['Peaceful Woods'])
  await expect(lib.getByRole('heading')).toContainText('(1 of 4)')
})

test('in the demo: a link saved, its sound, setting and mood chosen, found by them, deleted', async ({ page }) => {
  await page.goto('/control')
  await page.getByRole('button', { name: 'Try the demo' }).click()
  await page.goto('/player')
  await page.getByPlaceholder('https://www.youtube.com/watch?v=...').fill('https://youtu.be/abcdefghijk')
  await page.getByPlaceholder('Name (optional)').fill('Rainy Harbour')
  await page.getByRole('button', { name: 'Save' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByLabel('Name')).toHaveValue('Rainy Harbour') // the editor opens for the new link
  await dialog.getByRole('group', { name: 'Sound' }).getByRole('button', { name: 'Ambience' }).click()
  await dialog.getByRole('group', { name: 'Setting' }).getByRole('button', { name: 'Sea & coast' }).click()
  await dialog.getByRole('group', { name: 'Setting' }).getByRole('button', { name: 'Rain & storm' }).click()
  await dialog.getByRole('button', { name: 'Save' }).click()
  const lib = page.locator('section').filter({ has: page.getByRole('heading', { name: /^Library/ }) })
  await expect(lib.locator('li').first()).toContainText('Ambience · Sea & coast, Rain & storm')
  await lib.getByRole('group', { name: 'Setting' }).getByRole('button', { name: /Rain & storm/ }).click()
  await expect(lib.locator('li')).toHaveCount(1)
  page.once('dialog', (d) => d.accept())
  await lib.getByRole('button', { name: 'Delete from the library' }).click()
  await expect(lib.getByText('No links yet')).toBeVisible()
})
