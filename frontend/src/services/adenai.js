// The campaigns' pictures: the Grimoire's image library (grimoire.piogino.ch) — one library for every campaign, each
// campaign with its own set and its own titles for the pictures (Adenai's "Lady Rivea"). Listed through this app's
// server with the admin key (backend/src/routes/adenaiMedia.js, which asks the Grimoire with its media key); the
// pictures themselves through it too, since most are only for each campaign's group and an OBS browser source has no
// password: a picture placed in a slot is served because it is in use, the thumbnails while picking carry a token
// (12 h). Shown in a slot at its large size; picked from its small one.
import api from './api'

const FRESH_MS = 5 * 60 * 1000
const API_BASE = import.meta.env.PROD ? (import.meta.env.VITE_API_BASE_URL || '') : ''
const PROXY = `${API_BASE}/api/adenai-media/`
// a picture's address → through this app's server (older ones: the Adenai CMS's addresses, same file names)
export const viaProxy = (url, token) => {
  const m = /^https:\/\/(?:adenai-admin\.piogino\.ch\/media|grimoire\.piogino\.ch\/api\/media\/files)\/([^/?#]+)$/.exec(url || '')
  return m ? `${PROXY}${m[1]}${token ? `?t=${encodeURIComponent(token)}` : ''}` : url
}

let token = null // { value, until }
async function pickToken() {
  if (token && token.until > Date.now() + 60_000) return token.value
  try { const r = await api.get('/adenai-media/token'); token = { value: r.token, until: Date.now() + r.expiresIn }; return r.token } catch { return null }
}

const sizeUrl = (m, ...sizes) => {
  for (const s of sizes) if (m.sizes?.[s]?.url) return m.sizes[s].url
  return Object.values(m.sizes || {})[0]?.url || null
}

let cache = null // { at, projects, raw, token }
// { projects: ['adenai', …], images(set) } — set: a campaign's name (its pictures, with its titles and tags) or '' (all)
export async function fetchCampaignImages({ fresh = false } = {}) {
  if (fresh || !cache || Date.now() - cache.at > FRESH_MS) {
    const r = await api.get('/adenai-media/library')
    cache = { at: Date.now(), projects: r.projects || [], raw: r.images || [], token: await pickToken() }
  }
  const { projects, raw, token: t } = cache
  const images = (set) => raw
    .map((g) => {
      const use = set ? g.uses?.find((u) => u.project === set) : g.uses?.[0]
      if (set && !use) return null
      const large = g.sizes?.large || g.sizes?.original || g.sizes?.medium || {}
      const title = (set ? use?.title : g.title || use?.title) || g.caption || g.id
      return {
        adenaiId: g.id,
        title,
        caption: (set ? use?.caption : g.caption || use?.caption) || '',
        category: (set ? use?.category : g.category) || g.category || 'general',
        tags: [...new Set([...(g.tags || []), ...(set ? use?.tags || [] : (g.uses || []).flatMap((u) => u.tags || []))])],
        sets: (g.uses || []).map((u) => u.project),
        url: viaProxy(sizeUrl(g, 'large', 'original', 'medium', 'small')), // stored in the slot: served because it is in use
        thumbnailUrl: viaProxy(sizeUrl(g, 'small', 'medium', 'thumbnail'), t), // while picking: with the token
        originalName: title,
        width: large.width || null,
        height: large.height || null,
        uploadDate: g.createdAt || '',
      }
    })
    .filter((i) => i && i.url)
    .sort((a, b) => b.uploadDate.localeCompare(a.uploadDate))
  return { projects, images }
}

// every word of the search in the title, caption, category or a tag
export function matchesSearch(image, query) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  const hay = [image.title, image.caption, image.category, ...image.tags].join(' ').toLowerCase()
  return words.every((w) => hay.includes(w))
}
