// The image picker's sources: this library and the Adenai map's media (components/common/AdenaiBrowser.jsx)
import { test, expect } from '@playwright/test'
import { loggedIn, slotOf, setSlot } from './helpers'

const ADENAI = 'https://adenai-admin.piogino.ch/api/data/media-library.json'
const adenaiImage = (id, title, category, tags) => ({
  title, category, tags, uploadDate: `2026-10-${10 + tags.length}T10:00:00Z`,
  sizes: {
    small: { url: `http://localhost:3113/uploads/fixture-1.png`, width: 300, height: 300 },
    large: { url: `http://localhost:3113/uploads/fixture-${id}.png`, width: 1200, height: 1200 },
  },
})
const LIBRARY = { images: {
  'characters-a': adenaiImage(2, 'Lady Rivea', 'characters', ['female', 'elf']),
  'characters-b': adenaiImage(3, 'Petrel', 'characters', ['male', 'human']),
  'characters-c': adenaiImage(4, 'Zo’ob', 'characters', ['male', 'tiefling']),
  'locations-d': adenaiImage(5, 'Valaris', 'locations', ['city']),
} }

test.beforeEach(async ({ page }) => {
  await loggedIn(page)
  await page.route(ADENAI, (route) => route.fulfill({ json: LIBRARY }))
})

test('Adenai images: by category and tags, the chosen one shown in the slot at its large size', async ({ page, request }) => {
  await setSlot(request, 1, { imageUrl: null })
  await page.goto('/control')
  await page.getByTitle('Choose from library').first().click()
  await page.getByRole('tab', { name: 'Adenai' }).click()
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
  await page.getByRole('tab', { name: 'Adenai' }).click()
  await page.keyboard.press('Escape')
  await page.reload()
  await page.getByTitle('Choose from library').first().click()
  await expect(page.getByRole('tab', { name: 'Adenai' })).toHaveAttribute('aria-selected', 'true')
})
