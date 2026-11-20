// The image picker's sources: this library and the campaigns' pictures in the Grimoire (components/common/AdenaiBrowser.jsx)
import { test, expect } from '@playwright/test'
import { loggedIn, slotOf, setSlot } from './helpers'

// the campaigns' pictures, as the server passes on the Grimoire's library (backend/src/routes/adenaiMedia.js)
const LIBRARY_URL = '**/api/adenai-media/library'
const picture = (id, sets, central = {}) => ({
  id: `g${id}`, title: central.title || '', caption: '', credits: 'x', open: false, category: central.category || 'general', tags: [],
  createdAt: `2026-10-${10 + id}T10:00:00Z`,
  sizes: {
    small: { url: `http://localhost:3113/uploads/fixture-1.png`, width: 300, height: 300 },
    large: { url: `http://localhost:3113/uploads/fixture-${id}.png`, width: 1200, height: 1200 },
  },
  uses: sets.map(([project, title, category, tags]) => ({ project, title, category, tags, caption: '' })),
})
const LIBRARY = { success: true, projects: ['adenai', 'eldoria'], images: [
  picture(2, [['adenai', 'Lady Rivea', 'characters', ['female', 'elf']], ['eldoria', 'The Widow of Kesh', 'npcs', ['widow']]]),
  picture(3, [['adenai', 'Petrel', 'characters', ['male', 'human']]]),
  picture(4, [['adenai', 'Zo’ob', 'characters', ['male', 'tiefling']]]),
  picture(5, [['adenai', 'Valaris', 'locations', ['city']]]),
  picture(6, [['eldoria', 'Harbour of Kesh', 'places', ['harbour']]]),
] }

test.beforeEach(async ({ page }) => {
  await loggedIn(page)
  await page.addInitScript(() => { if (!sessionStorage.getItem('set-cleared')) { localStorage.removeItem('obs-campaign-set'); sessionStorage.setItem('set-cleared', '1') } })
  await page.route(LIBRARY_URL, (route) => route.fulfill({ json: LIBRARY }))
  await page.route('**/api/adenai-media/token', (route) => route.fulfill({ json: { success: true, token: 't', expiresIn: 3600000 } }))
})

test('Adenai images: by category and tags, the chosen one shown in the slot at its large size', async ({ page, request }) => {
  await setSlot(request, 1, { imageUrl: null })
  await page.goto('/control')
  await page.getByTitle('Choose from library').first().click()
  await page.getByRole('tab', { name: 'Campaigns' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText('4 of 4 images')).toBeVisible()
  await dialog.getByLabel('Category').selectOption('characters')
  await expect(dialog.getByText('3 of 4 images')).toBeVisible()
  await dialog.getByLabel('Tags').getByRole('button', { name: /^male/ }).click()
  await expect(dialog.getByText('2 of 4 images')).toBeVisible()
  await dialog.getByLabel('Tags').getByRole('button', { name: /^tiefling/ }).click()
  await expect(dialog.getByText('1 of 4 images')).toBeVisible()
  await dialog.getByRole('button', { name: /Zo’ob/ }).click()
  await dialog.getByRole('button', { name: 'Select Image' }).click()
  await expect.poll(async () => (await slotOf(request, 1)).imageUrl).toBe('http://localhost:3113/uploads/fixture-4.png')
})

test('the picker remembers the source last used', async ({ page }) => {
  await page.goto('/control')
  await page.getByTitle('Choose from library').first().click()
  await page.getByRole('tab', { name: 'Campaigns' }).click()
  await page.keyboard.press('Escape')
  await page.reload()
  await page.getByTitle('Choose from library').first().click()
  await expect(page.getByRole('tab', { name: 'Campaigns' })).toHaveAttribute('aria-selected', 'true')
})

test('the campaigns: Adenai’s set with its titles, another campaign’s with its own, or all of them', async ({ page }) => {
  await page.goto('/control')
  await page.getByTitle('Choose from library').first().click()
  await page.getByRole('tab', { name: 'Campaigns' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByLabel('Campaign', { exact: true })).toHaveValue('adenai')
  await expect(dialog.getByRole('button', { name: /Lady Rivea/ })).toBeVisible()
  await dialog.getByLabel('Campaign', { exact: true }).selectOption('eldoria')
  await expect(dialog.getByText('2 of 2 images of Eldoria')).toBeVisible()
  await expect(dialog.getByRole('button', { name: /The Widow of Kesh/ })).toBeVisible() // the same picture, Eldoria's name
  await expect(dialog.getByRole('button', { name: /Lady Rivea/ })).toHaveCount(0)
  await dialog.getByLabel('Campaign', { exact: true }).selectOption('')
  await expect(dialog.getByText('5 of 5 images of all campaigns')).toBeVisible()
  // remembered
  await page.keyboard.press('Escape')
  await page.reload()
  await page.getByTitle('Choose from library').first().click()
  await expect(page.getByRole('dialog').getByLabel('Campaign', { exact: true })).toHaveValue('')
})
