// The demo's server, in the browser (demo/mode.js): it answers the controller's requests as backend/src/routes do,
// with the same rules (shared/slotState.mjs, shared/player.mjs), and keeps everything in IndexedDB (demo/db.js).
// Live updates go to this page and, over a BroadcastChannel, to the other tabs of this browser (a display page with
// &demo=1). Pictures added to the library are kept as files there; in the state they are tokens
// ("obs-demo-file:<id>"), which every page turns into its own blob: address (toClient) and back (fromClient).
import { applySlotUpdate, clearSlot } from '../../../shared/slotState.mjs'
import { REPEAT_MODES, defaultState, newId, parseVideoId, currentPosition, startVideo, advance } from '../../../shared/player.mjs'
import * as db from './db'
import { isDemo } from './mode'

const ACCEPTED = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
const MAX_BYTES = 10 * 1024 * 1024 // as the server
const THUMB = 400
const END_GRACE_MS = 750
const TOKEN = 'obs-demo-file:'
// the library's choices — the Grimoire's music section has these (server/src/kinds.js there); the demo keeps its own
// library in this browser
const LIBRARY_OPTIONS = {
  sounds: ['Ambience', 'Music', 'Music with vocals'],
  settings: ['Town & city', 'Village', 'Tavern & inn', 'Market', 'Court & ballroom', 'Festival', 'Forest', 'Jungle', 'Desert', 'Arctic & winter', 'Mountains', 'Sea & coast', 'Underwater', 'Swamp', 'Volcano', 'Cave & underground', 'Dungeon & sewers', 'Ruins & temples', 'Wilderness & travel', 'Camp & rest', 'Sky', 'Rain & storm', 'Elven', 'Dwarven', 'Far east'],
  moods: ['Calm', 'Cheerful', 'Romantic', 'Mysterious', 'Tense', 'Dark & eerie', 'Sad', 'Epic', 'Combat'],
}
const track = (x) => ({ id: x.id, name: x.name, videoId: x.videoId, title: x.title || x.name, sound: x.sound || null, settings: x.settings || [], moods: x.moods || [], length: null, channel: null, addedAt: x.addedAt || null })
const details = (body = {}) => ({
  ...('sound' in body ? { sound: LIBRARY_OPTIONS.sounds.includes(body.sound) ? body.sound : null } : {}),
  ...('settings' in body ? { settings: LIBRARY_OPTIONS.settings.filter((o) => (body.settings || []).includes(o)) } : {}),
  ...('moods' in body ? { moods: LIBRARY_OPTIONS.moods.filter((o) => (body.moods || []).includes(o)) } : {}),
})

// ---- live updates ------------------------------------------------------------------------------------------------
const listeners = new Map() // event → Set(fn)
const channel = isDemo() && typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('obs-demo') : null // only in the demo
export function on(event, fn) { (listeners.get(event) || listeners.set(event, new Set()).get(event)).add(fn) }
async function deliver(event, data) {
  const out = await toClient(data)
  for (const fn of listeners.get(event) || []) fn(out)
}
function emit(event, data) {
  deliver(event, data)
  channel?.postMessage({ event, data })
}
channel?.addEventListener('message', (e) => {
  deliver(e.data.event, e.data.data)
  if (e.data.event === 'player:state') scheduleEnd(e.data.data) // another tab changed the player: its end here too
})

// ---- pictures: tokens ↔ this page's blob: addresses -------------------------------------------------------------
const urls = new Map() // file id → blob: address
const ids = new Map() // blob: address → file id
async function urlOf(id) {
  if (urls.has(id)) return urls.get(id)
  const blob = await db.getFile(id)
  if (!blob) return null
  const url = URL.createObjectURL(blob)
  urls.set(id, url); ids.set(url, id)
  return url
}
const tokensIn = (value, out = new Set()) => {
  if (typeof value === 'string' && value.startsWith(TOKEN)) out.add(value.slice(TOKEN.length))
  else if (Array.isArray(value)) value.forEach((v) => tokensIn(v, out))
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => tokensIn(v, out))
  return out
}
const mapStrings = (value, fn) => {
  if (typeof value === 'string') return fn(value)
  if (Array.isArray(value)) return value.map((v) => mapStrings(v, fn))
  if (value && typeof value === 'object' && !(value instanceof Blob)) return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, mapStrings(v, fn)]))
  return value
}
async function toClient(value) {
  for (const id of tokensIn(value)) await urlOf(id)
  return mapStrings(value, (s) => (s.startsWith(TOKEN) ? urls.get(s.slice(TOKEN.length)) || '' : s))
}
const fromClient = (value) => mapStrings(value, (s) => (ids.has(s) ? TOKEN + ids.get(s) : s))

// ---- state ----------------------------------------------------------------------------------------------------------
// read-modify-write, one at a time across the tabs (Web Locks), so two tabs never overwrite each other
const locked = (fn) => (navigator.locks ? navigator.locks.request('obs-demo', fn) : fn())
async function change(key, fallback, fn) {
  return locked(async () => {
    const value = (await db.getState(key)) ?? fallback()
    const result = await fn(value)
    await db.setState(key, value)
    return { value, result }
  })
}
const read = async (key, fallback) => (await db.getState(key)) ?? fallback()

// ---- the player's end: the next video when one ends (every tab keeps a timer; the session id lets only one act) ---
let endTimer = null
function scheduleEnd(state) {
  clearTimeout(endTimer)
  if (!state?.playing || !state.current?.duration) return
  const sessionId = state.current.sessionId
  endTimer = setTimeout(() => {
    updatePlayer((s) => { if (s.current?.sessionId === sessionId && s.playing) advance(s) })
  }, Math.max(0, (state.current.duration - currentPosition(state)) * 1000) + END_GRACE_MS)
}
async function updatePlayer(fn) {
  const { value, result } = await change('player', defaultState, fn)
  const state = { ...JSON.parse(JSON.stringify(value)), serverTime: Date.now() }
  scheduleEnd(state)
  emit('player:state', state)
  return { state, result }
}
export const playerState = async () => ({ ...(await read('player', defaultState)), serverTime: Date.now() })
if (isDemo()) read('player', defaultState).then(scheduleEnd).catch(() => {})

// the duration, as the YouTube player tells it (demo/socket.js: 'player:duration')
export function reportDuration({ sessionId, duration } = {}) {
  if (!(duration > 0 && duration < 24 * 3600)) return
  updatePlayer((s) => { if (s.current?.sessionId === sessionId && !s.current.duration) s.current.duration = duration })
}

async function fetchTitle(videoId) {
  try {
    const r = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`, { signal: AbortSignal.timeout(4000) })
    return r.ok ? (await r.json()).title || videoId : videoId
  } catch { return videoId }
}
async function resolveVideo(body = {}) {
  const videoId = parseVideoId(body.url || body.videoId)
  if (!videoId) return null
  return { videoId, title: (body.title || '').trim() || await fetchTitle(videoId) }
}

// ---- pictures added to the library -------------------------------------------------------------------------------
async function thumbnailOf(file) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, THUMB / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.75))
  return { blob, width: bitmap.width, height: bitmap.height }
}

// ---- the routes ----------------------------------------------------------------------------------------------------
const ok = (data, status = 200) => ({ status, data: { success: true, ...data } })
const fail = (status, message) => ({ status, data: { success: false, error: { message } } })

async function route(method, path, body) {
  const p = path.replace(/^\/+/, '').split('?')[0].split('/')
  const [area, id, sub, subId] = p
  const M = method.toUpperCase()

  if (area === 'auth' || area === 'health' || area === 'status') return ok({ status: 'ok', demo: true })
  // the campaigns' pictures (the Grimoire) are not part of the demo
  if (area === 'adenai-media') return id === 'token' ? ok({ token: '', expiresIn: 0 }) : ok({ projects: [], images: [] })

  if (area === 'slots') {
    if (M === 'GET' && !id) return ok({ data: { slots: await read('slots', () => ({})) } })
    if (M === 'GET') return ok({ data: { slot: id, imageId: null, imageUrl: null, updatedAt: null, ...(await read('slots', () => ({})))[id] } })
    if (M === 'PUT' || M === 'DELETE') {
      let slot
      try {
        ({ result: slot } = await change('slots', () => ({}), (slots) => { slots[id] = M === 'PUT' ? applySlotUpdate(slots[id], body || {}) : clearSlot(slots[id]); return slots[id] }))
      } catch (err) { if (err.status === 400) return { status: 400, data: { success: false, error: err.message } }; throw err }
      emit('slot:updated', { slot: id, ...slot, timestamp: slot.updatedAt || new Date().toISOString() })
      return ok({ data: { slot: id, ...slot } })
    }
  }

  if (area === 'scenes') {
    const sceneId = Number(id)
    const scenes = () => read('scenes', () => [])
    if (M === 'GET' && !id) return ok({ data: { scenes: await scenes() } })
    if (M === 'GET') { const s = (await scenes()).find((x) => x.id === sceneId); return s ? ok({ data: s }) : fail(404, 'Scene not found') }
    if (M === 'POST' && !id) {
      if (!body?.name) return fail(400, 'Scene name is required')
      const at = new Date().toISOString()
      const scene = { id: Date.now(), name: body.name, description: body.description || '', slots: body.slots || {}, createdAt: at, updatedAt: at }
      await change('scenes', () => [], (list) => { list.push(scene) })
      return ok({ data: scene }, 201)
    }
    if (M === 'PUT' || (M === 'POST' && sub === 'capture')) {
      const current = sub === 'capture' ? await read('slots', () => ({})) : null
      const { result } = await change('scenes', () => [], (list) => {
        const s = list.find((x) => x.id === sceneId)
        if (!s) return null
        const updates = sub === 'capture' ? { slots: current } : { name: body?.name, description: body?.description, slots: body?.slots }
        for (const [k, v] of Object.entries(updates)) if (v !== undefined) s[k] = v
        s.updatedAt = new Date().toISOString()
        return s
      })
      if (!result) return fail(404, 'Scene not found')
      return sub === 'capture'
        ? ok({ message: 'Scene updated with current slots', data: { sceneId: result.id, sceneName: result.name, slotsCaptured: Object.keys(current).length, slots: current } })
        : ok({ data: result })
    }
    if (M === 'DELETE') {
      const { result } = await change('scenes', () => [], (list) => { const i = list.findIndex((x) => x.id === sceneId); return i >= 0 ? list.splice(i, 1) : null })
      return result ? ok({ message: 'Scene deleted successfully' }) : fail(404, 'Scene not found')
    }
    if (M === 'POST' && sub === 'load') {
      const scene = (await scenes()).find((x) => x.id === sceneId)
      if (!scene) return fail(404, 'Scene not found')
      const slots = { ...scene.slots }
      await locked(() => db.setState('slots', slots))
      emit('scene:loaded', { sceneId: scene.id, sceneName: scene.name, slots })
      return ok({ message: 'Scene loaded', data: { sceneId: scene.id, sceneName: scene.name, slotsUpdated: Object.keys(slots).length, allSlots: slots } })
    }
  }

  if (area === 'images') {
    const imageId = Number(id)
    if (M === 'GET' && !id) return ok({ data: { images: await read('images', () => []) } })
    if (M === 'GET') { const i = (await read('images', () => [])).find((x) => x.id === imageId); return i ? ok({ data: i }) : fail(404, 'Image not found') }
    if (M === 'POST' && id === 'upload') {
      const file = body instanceof FormData ? body.get('image') : null
      if (!file) return fail(400, 'No file uploaded')
      if (!ACCEPTED.includes(file.type)) return fail(400, 'Invalid file type. Only PNG, JPG, GIF, and WebP are allowed.')
      if (file.size > MAX_BYTES) return fail(400, 'File too large (10 MB at most)')
      let thumb
      try { thumb = await thumbnailOf(file) } catch { return fail(500, 'Failed to process uploaded image') }
      const fileId = `${Date.now().toString(36)}${newId()}`
      await db.putFile(fileId, file)
      if (thumb.blob) await db.putFile(`${fileId}-thumb`, thumb.blob)
      const image = {
        id: Date.now(), filename: file.name, originalName: file.name, url: TOKEN + fileId, ...(thumb.blob ? { thumbnailUrl: `${TOKEN}${fileId}-thumb` } : {}),
        width: thumb.width, height: thumb.height, type: 'uploaded', mimeType: file.type, size: file.size, originalSize: file.size,
        createdAt: new Date().toISOString(), format: file.type.split('/')[1], demoFile: fileId,
      }
      await change('images', () => [], (list) => { list.unshift(image) })
      return ok({ data: image }, 201)
    }
    if (M === 'POST' && id === 'url') {
      if (!body?.url) return fail(400, 'URL is required')
      const image = { id: Date.now(), url: body.url, originalName: body.name || 'External Image', type: 'url', createdAt: new Date().toISOString() }
      await change('images', () => [], (list) => { list.unshift(image) })
      return ok({ data: image }, 201)
    }
    if (M === 'PUT') {
      const name = body?.name || body?.originalName
      if (!name) return fail(400, 'originalName or name is required')
      const { result } = await change('images', () => [], (list) => { const i = list.find((x) => x.id === imageId); if (i) i.originalName = name; return i })
      return result ? ok({ data: result, message: 'Image updated successfully' }) : fail(404, 'Image not found')
    }
    if (M === 'DELETE') {
      const { result } = await change('images', () => [], (list) => { const i = list.findIndex((x) => x.id === imageId); return i >= 0 ? list.splice(i, 1)[0] : null })
      if (!result) return fail(404, 'Image not found')
      if (result.demoFile) { await db.deleteFile(result.demoFile); await db.deleteFile(`${result.demoFile}-thumb`) }
      return ok({ message: 'Image deleted successfully' })
    }
  }

  if (area === 'player') {
    const send = ({ state }) => ok({ data: state })
    const action = [id, sub, subId].filter(Boolean).join('/')
    if (M === 'GET' && !id) return ok({ data: await playerState() })
    if (M === 'GET' && id === 'library') return ok({ data: { tracks: ((await read('player', defaultState)).saved || []).map(track), options: LIBRARY_OPTIONS } })
    if (M === 'POST' && (action === 'load' || action === 'queue' || action === 'saved')) {
      const video = await resolveVideo(body)
      if (!video) return fail(400, 'Not a valid YouTube link')
      if (action === 'load') return send(await updatePlayer((s) => startVideo(s, video)))
      if (action === 'queue') return send(await updatePlayer((s) => { if (!s.current) startVideo(s, video); else s.queue.push({ id: newId(), ...video }) }))
      const name = (body.name || '').trim() || video.title
      const item = { id: newId(), name, ...video, ...details(body), addedAt: new Date().toISOString() }
      await updatePlayer((s) => { s.saved.push(item) })
      emit('library:changed', { at: Date.now() })
      return ok({ data: track(item) }, 201)
    }
    if (M === 'POST' && action === 'play') return send(await updatePlayer((s) => {
      if (!s.current) return
      s.position = currentPosition(s)
      if (s.current.duration && s.position >= s.current.duration - 0.5) s.position = 0
      s.playing = true; s.updatedAt = Date.now()
    }))
    if (M === 'POST' && action === 'pause') return send(await updatePlayer((s) => {
      if (!s.current) return
      s.position = currentPosition(s); s.playing = false; s.updatedAt = Date.now()
    }))
    if (M === 'POST' && action === 'seek') {
      const position = Number(body?.position)
      if (!Number.isFinite(position) || position < 0) return fail(400, 'Invalid position')
      return send(await updatePlayer((s) => { if (!s.current) return; s.position = s.current.duration ? Math.min(position, s.current.duration) : position; s.updatedAt = Date.now() }))
    }
    if (M === 'POST' && action === 'next') return send(await updatePlayer((s) => { const r = s.repeat; if (r === 'one') s.repeat = 'off'; advance(s); s.repeat = r }))
    if (M === 'POST' && action === 'stop') return send(await updatePlayer((s) => { s.current = null; s.playing = false; s.position = 0; s.updatedAt = Date.now() }))
    if (M === 'PUT' && action === 'repeat') {
      if (!REPEAT_MODES.includes(body?.mode)) return fail(400, 'Repeat must be off, one or all')
      return send(await updatePlayer((s) => { s.repeat = body.mode }))
    }
    if (id === 'queue' && M === 'DELETE' && !sub) return send(await updatePlayer((s) => { s.queue = [] }))
    if (id === 'queue' && M === 'DELETE') return send(await updatePlayer((s) => { s.queue = s.queue.filter((q) => q.id !== sub) }))
    if (id === 'queue' && subId === 'play') {
      const r = await updatePlayer((s) => { const i = s.queue.findIndex((q) => q.id === sub); if (i === -1) return false; startVideo(s, s.queue.splice(i, 1)[0]); return true })
      return r.result ? send(r) : fail(404, 'Queue item not found')
    }
    if (id === 'queue' && subId === 'move') {
      const offset = body?.direction === 'up' ? -1 : 1
      return send(await updatePlayer((s) => {
        const i = s.queue.findIndex((q) => q.id === sub); const t = i + offset
        if (i === -1 || t < 0 || t >= s.queue.length) return
        ;[s.queue[i], s.queue[t]] = [s.queue[t], s.queue[i]]
      }))
    }
    if (id === 'saved' && M === 'PUT') {
      const name = (body?.name ?? '').trim()
      if (body && 'name' in body && !name) return fail(400, 'Name is required')
      const r = await updatePlayer((s) => { const it = s.saved.find((x) => x.id === sub); if (it) Object.assign(it, name ? { name } : {}, details(body)); return it ? track(it) : null })
      if (!r.result) return fail(404, 'Saved link not found')
      emit('library:changed', { at: Date.now() })
      return ok({ data: r.result })
    }
    if (id === 'saved' && M === 'DELETE') {
      await updatePlayer((s) => { s.saved = s.saved.filter((x) => x.id !== sub) })
      emit('library:changed', { at: Date.now() })
      return ok({})
    }
  }

  return fail(404, 'Not found')
}

// an axios adapter (services/api.js uses it in the demo): the request answered here, never sent
export async function demoAdapter(config) {
  const raw = config.data
  let body = raw
  if (typeof raw === 'string') { try { body = JSON.parse(raw) } catch { body = raw } }
  const path = (config.url || '').replace(/^https?:\/\/[^/]+/, '').replace(/^\/?api\//, '/')
  const { status, data } = await route(config.method || 'get', path, body instanceof FormData ? body : fromClient(body))
  const response = { data: await toClient(data), status, statusText: String(status), headers: {}, config, request: {} }
  if (status >= 400) throw Object.assign(new Error(`Request failed with status code ${status}`), { response, config, isAxiosError: true })
  return response
}

export { db }
