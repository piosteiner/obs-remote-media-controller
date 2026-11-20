// The demo (src/demo): no key, no server — everything in the browser, the display tab following along
import { test, expect } from '@playwright/test'
import { cell } from './helpers'

test('the demo: no key, nothing sent to the server, kept in this browser, a display tab follows', async ({ page, context }) => {
  const toServer = []
  context.on('request', (r) => { if (r.url().startsWith('http://localhost:3113')) toServer.push(r.url()) })
  context.on('websocket', (ws) => toServer.push(ws.url()))
  await page.goto('/control')
  await page.getByRole('button', { name: 'Try the demo' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Demo' })).toBeVisible()
  await expect(cell(page, 1, 0)).toBeVisible()

  // a picture dropped onto slot 1's first quick image: into the library in this browser
  await page.evaluate(async () => {
    const c = document.createElement('canvas'); c.width = 640; c.height = 360
    const g = c.getContext('2d'); g.fillStyle = '#c0392b'; g.fillRect(0, 0, 640, 360)
    const blob = await new Promise((r) => c.toBlob(r, 'image/png'))
    const data = new DataTransfer()
    data.items.add(new File([blob], 'demo-portrait.png', { type: 'image/png' }))
    const target = document.querySelector('[data-testid="quick-slots-1"] [data-cell="0"]')
    target.dispatchEvent(new DragEvent('dragover', { dataTransfer: data, bubbles: true, cancelable: true }))
    target.dispatchEvent(new DragEvent('drop', { dataTransfer: data, bubbles: true, cancelable: true }))
  })
  await expect(cell(page, 1, 0).locator('img')).toHaveAttribute('src', /^blob:/)
  await expect(cell(page, 1, 0).getByTestId('quick-name')).toHaveText('demo-portrait.png')

  // a display page in another tab (as OBS would show it) follows the slot
  const display = await context.newPage()
  await display.goto('/display?slot=1&demo=1')
  await cell(page, 1, 0).click()
  await expect(display.locator('img[src^="blob:"]').first()).toBeVisible()
  expect(await display.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(false)

  // still there after a reload; the library has it
  await page.reload()
  await expect(cell(page, 1, 0).locator('img')).toHaveAttribute('src', /^blob:/)
  await page.goto('/library')
  await expect(page.getByText('demo-portrait.png')).toBeVisible()

  expect(toServer).toEqual([]) // nothing went to the server
  await page.getByRole('button', { name: 'Leave demo' }).click()
  await expect(page.getByLabel('Admin key')).toBeVisible()
})
