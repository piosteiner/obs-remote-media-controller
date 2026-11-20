// Dark mode: the room the player overlay leaves below a page's content takes the page's colour (index.css body.with-player)
import { test, expect } from '@playwright/test'
test('below the content with the player open: the page colour in dark and light', async ({ page }) => {
  await page.goto('/control'); await page.getByRole('button', { name: 'Try the demo' }).click()
  await page.addInitScript(() => localStorage.setItem('obs-theme', 'dark'))
  await page.goto('/player')
  await page.getByPlaceholder('https://www.youtube.com/watch?v=...').fill('https://youtu.be/abcdefghijk')
  await page.getByRole('button', { name: 'Play now' }).click()
  await expect.poll(() => page.evaluate(() => document.body.classList.contains('with-player'))).toBe(true)
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(17, 24, 39)')
  await page.getByRole('button', { name: /Switch to light mode/ }).click()
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(249, 250, 251)')
})
