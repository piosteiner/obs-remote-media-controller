// The demo (2026-11-20): the whole controller without the admin key and without the server — slots, quick images,
// rotations, scenes, the library and the player work as usual, but everything is kept in this browser (IndexedDB,
// demo/db.js) and nothing is sent anywhere (demo/server.js answers in place of the server). Other tabs of the same
// browser follow along — a display page opened with &demo=1 shows the slot like OBS would.
// On: remembered in localStorage once "Try the demo" is chosen; the display page only with ?demo=1 in its address,
// so a real OBS source never turns into a demo.
const KEY = 'obs-demo'

export function isDemo() {
  if (typeof window === 'undefined') return false
  if (window.location.pathname.startsWith('/display')) return new URLSearchParams(window.location.search).get('demo') === '1'
  try { return localStorage.getItem(KEY) === '1' } catch { return false }
}

export function enterDemo() {
  try { localStorage.setItem(KEY, '1') } catch { /* private window: the demo needs storage */ }
  window.location.assign('/control')
}

export function leaveDemo() {
  try { localStorage.removeItem(KEY) } catch { /* nothing kept */ }
  window.location.assign('/')
}
