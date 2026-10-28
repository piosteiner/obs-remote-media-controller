// Shared steps for the browser tests
import { expect } from '@playwright/test'

export const KEY = 'test-key'
export const API = 'http://localhost:3113/api'

// a page with the admin key stored, as after logging in
export async function loggedIn(page) {
  await page.addInitScript((key) => localStorage.setItem('obs-admin-key', key), KEY)
}

// the server's slot (straight from the test server)
export async function slotOf(request, slotId) {
  const res = await request.get(`${API}/slots`)
  return (await res.json()).data.slots[String(slotId)] || {}
}

export async function setSlot(request, slotId, body) {
  const res = await request.put(`${API}/slots/${slotId}`, { data: body, headers: { 'X-API-Key': KEY } })
  expect(res.ok()).toBeTruthy()
  return (await res.json()).data
}

// the fixture library of test-backend.cjs
export const fixture = (n) => ({
  url: `http://localhost:3113/uploads/fixture-${n}.png`, imageId: 999 + n,
  thumbnailUrl: `http://localhost:3113/uploads/fixture-${n}.png`, name: `Fixture ${n}`,
})

// a slot's quick grid on the control page
export const quickGrid = (page, slotId) => page.getByTestId(`quick-slots-${slotId}`)
export const cell = (page, slotId, i) => quickGrid(page, slotId).locator(`[data-cell="${i}"]`)
