// Admin key for the backend, kept per browser. Display pages (OBS) never need it.
const STORAGE_KEY = 'obs-admin-key'

export function getApiKey() {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function setApiKey(key) {
  try {
    localStorage.setItem(STORAGE_KEY, key)
  } catch {
    // Private mode etc.: the key only lasts for this page load
  }
}

export function clearApiKey() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event('auth:required'))
}
