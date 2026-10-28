// Without the admin key the controller asks for it; a wrong key is refused (components/common/AuthGate.jsx)
import { test, expect } from '@playwright/test'
import { KEY } from './helpers'

test('the controller asks for the key, refuses a wrong one, opens with the right one', async ({ page }) => {
  await page.goto('/control')
  const field = page.locator('input[type="password"]')
  await expect(field).toBeVisible()
  await field.fill('wrong')
  await field.press('Enter')
  await expect(field).toBeVisible()
  await field.fill(KEY)
  await field.press('Enter')
  await expect(page.getByText('Quick images').first()).toBeVisible()
})

test('the display needs no key', async ({ page }) => {
  await page.goto('/display?slot=1')
  await expect(page.locator('input[type="password"]')).toHaveCount(0)
})
