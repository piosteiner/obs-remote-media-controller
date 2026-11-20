// The Adenai map's media library (adenai-admin.piogino.ch): the campaign's images — characters, places, creatures —
// to show in a slot straight from there, without copying them into this library. Read-only and public: the CMS serves
// its data files with CORS open (/api/data/<file>). Shown in a slot at its large size; picked from its small one.
import api from './api'

const ADENAI = import.meta.env.VITE_ADENAI_URL || 'https://adenai-admin.piogino.ch'
// The pictures themselves through this app's server (backend/src/routes/adenaiMedia.js): the Adenai CMS gives most of
// them only to its group, and an OBS browser source has no password. A picture placed in a slot is served because it
// is in use; the thumbnails while picking carry a token (12 h) the controller gets with its key.
const API_BASE = import.meta.env.PROD ? (import.meta.env.VITE_API_BASE_URL || '') : ''
const PROXY = `${API_BASE}/api/adenai-media/`
export const viaProxy = (url, token) => {
  const m = /^https:\/\/adenai-admin\.piogino\.ch\/media\/([^/?#]+)$/.exec(url || '')
  return m ? `${PROXY}${m[1]}${token ? `?t=${encodeURIComponent(token)}` : ''}` : url
}
let token = null // { value, until }
async function pickToken() {
  if (token && token.until > Date.now() + 60_000) return token.value
  try { const r = await api.get('/adenai-media/token'); token = { value: r.token, until: Date.now() + r.expiresIn }; return r.token } catch { return null }
}
const FRESH_MS = 5 * 60 * 1000

let cache = null // { at, images }

const sizeUrl = (m, ...sizes) => {
  for (const s of sizes) if (m.sizes?.[s]?.url) return m.sizes[s].url
  return Object.values(m.sizes || {})[0]?.url || null
}

// [{ adenaiId, title, caption, category, tags, url, thumbnailUrl, originalName, width, height, uploadDate }], newest first
export async function fetchAdenaiImages({ fresh = false } = {}) {
  if (!fresh && cache && Date.now() - cache.at < FRESH_MS) return cache.images
  const res = await fetch(`${ADENAI}/api/data/media-library.json`, { cache: 'no-cache' })
  if (!res.ok) throw new Error(`The Adenai library answered ${res.status}`)
  const library = await res.json()
  const t = await pickToken()
  const images = Object.entries(library.images || {}).map(([id, m]) => {
    const large = m.sizes?.large || m.sizes?.original || m.sizes?.medium || {}
    return {
      adenaiId: id,
      title: m.title || '',
      caption: m.caption || '',
      category: m.category || 'general',
      tags: m.tags || [],
      url: viaProxy(sizeUrl(m, 'large', 'original', 'medium', 'small')), // stored in the slot: served because it is in use
      thumbnailUrl: viaProxy(sizeUrl(m, 'small', 'medium', 'thumbnail'), t), // while picking: with the token
      originalName: m.title || m.caption || id,
      width: large.width || null,
      height: large.height || null,
      uploadDate: m.uploadDate || '',
    }
  }).filter((i) => i.url).sort((a, b) => b.uploadDate.localeCompare(a.uploadDate))
  cache = { at: Date.now(), images }
  return images
}

// every word of the search in the title, caption, category or a tag
export function matchesSearch(image, query) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  const hay = [image.title, image.caption, image.category, ...image.tags].join(' ').toLowerCase()
  return words.every((w) => hay.includes(w))
}
