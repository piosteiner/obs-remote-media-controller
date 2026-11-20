import { useEffect, useMemo, useState } from 'react'
import { Play, ListPlus, Edit2, Trash2, Search, ExternalLink, RotateCw } from 'lucide-react'
import Modal from '../common/Modal'
import useToastStore from '../../store/toast'
import { playerAPI } from '../../services/api'
import { playerAction, thumbnailFor } from '../../services/player'
import { isDemo } from '../../demo/mode'

const SORTS = [['name', 'Name A–Z'], ['new', 'Newest first'], ['sound', 'Sound']]
const SORT_KEY = 'obs-library-sort'
const chip = (on) => `px-2.5 py-0.5 rounded-full text-xs border transition-colors ${on
  ? 'bg-primary-600 border-primary-600 text-white'
  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-primary-400'}`

/**
 * MusicLibrary Component
 * The player's library — the Grimoire's music section (grimoire.piogino.ch/music; in the demo, this browser's): search,
 * sort, filters by sound, setting and mood (all chosen ones must fit), and per track play now, queue, edit, delete.
 * Reads it again when any device changes it ('library:changed'). editRequest: a track to open in the editor (a link
 * just saved from the form above).
 */
function MusicLibrary({ editRequest }) {
  const [lib, setLib] = useState(null)
  const [error, setError] = useState(null)
  const [q, setQ] = useState('')
  const [sort, setSort] = useState(() => { try { return localStorage.getItem(SORT_KEY) || 'name' } catch { return 'name' } })
  const [f, setF] = useState({ sound: '', settings: [], moods: [] })
  const [editing, setEditing] = useState(null)

  const load = (fresh) => playerAPI.library(fresh).then((r) => { setLib(r.data); setError(null) }).catch((e) => setError(e?.error?.message || e?.message || 'The library could not be loaded'))
  useEffect(() => {
    load()
    const again = () => load(true)
    window.addEventListener('library:changed', again)
    return () => window.removeEventListener('library:changed', again)
  }, [])
  useEffect(() => { if (editRequest) setEditing(editRequest) }, [editRequest])

  const chooseSort = (v) => { setSort(v); try { localStorage.setItem(SORT_KEY, v) } catch { /* private window */ } }
  const toggle = (key, v) => setF((x) => ({ ...x, [key]: x[key].includes(v) ? x[key].filter((y) => y !== v) : [...x[key], v] }))

  const tracks = lib?.tracks || []
  // only the settings and moods some track has, in the section's order, with their numbers
  const used = (key) => (lib?.options?.[key] || []).map((o) => [o, tracks.filter((t) => t[key].includes(o)).length]).filter(([, n]) => n)
  const shown = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean)
    const sounds = lib?.options?.sounds || []
    return tracks
      .filter((t) => (!f.sound || t.sound === f.sound) && f.settings.every((s) => t.settings.includes(s)) && f.moods.every((m) => t.moods.includes(m)))
      .filter((t) => { const hay = [t.name, t.channel, t.sound, ...t.settings, ...t.moods].join(' ').toLowerCase(); return words.every((w) => hay.includes(w)) })
      .sort((a, b) => (sort === 'new' ? (b.addedAt || '').localeCompare(a.addedAt || '')
        : sort === 'sound' ? (sounds.indexOf(a.sound) - sounds.indexOf(b.sound)) || a.name.localeCompare(b.name)
          : a.name.localeCompare(b.name)))
  }, [tracks, q, f, sort, lib])
  const filtering = q || f.sound || f.settings.length || f.moods.length

  const remove = async (t) => {
    if (!window.confirm(`Delete “${t.name}” from the library${isDemo() ? '' : ' (the Grimoire’s music section)'}?`)) return
    const r = await playerAction((api) => api.removeSaved(t.id))
    if (r?.success) useToastStore.getState().success('Deleted')
  }

  return (
    <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex-1">
          Library <span className="font-normal text-gray-500 dark:text-gray-400">({filtering ? `${shown.length} of ${tracks.length}` : tracks.length})</span>
        </h2>
        {!isDemo() && <a href="https://grimoire.piogino.ch/music" target="_blank" rel="noreferrer" className="text-xs text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 inline-flex items-center gap-1">in the Grimoire <ExternalLink className="w-3 h-3" /></a>}
        <button type="button" onClick={() => load(true)} title="Load the library again" className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"><RotateCw className="w-4 h-4" /></button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search names, channels, settings, moods…" aria-label="Search the library"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <select value={sort} onChange={(e) => chooseSort(e.target.value)} aria-label="Sort" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg">
          {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {lib && (
        <div className="space-y-1.5 mb-3 text-xs">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Sound">
            {(lib.options.sounds || []).map((s) => <button key={s} type="button" className={chip(f.sound === s)} aria-pressed={f.sound === s} onClick={() => setF((x) => ({ ...x, sound: x.sound === s ? '' : s }))}>{s}</button>)}
          </div>
          {[['settings', 'Setting'], ['moods', 'Mood']].map(([key, label]) => (
            <div key={key} className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
              {used(key).map(([o, n]) => <button key={o} type="button" className={chip(f[key].includes(o))} aria-pressed={f[key].includes(o)} onClick={() => toggle(key, o)}>{o} <span className="opacity-60">{n}</span></button>)}
            </div>
          ))}
          {filtering && <button type="button" onClick={() => { setQ(''); setF({ sound: '', settings: [], moods: [] }) }} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white underline">Clear filters</button>}
        </div>
      )}

      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        : !lib ? <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
          : !tracks.length ? <p className="text-sm text-gray-500 dark:text-gray-400">No links yet. Use “Save” on a link to keep it here.</p>
            : !shown.length ? <p className="text-sm text-gray-500 dark:text-gray-400">Nothing matches.</p>
              : (
                <ul className="grid grid-cols-1 xl:grid-cols-2 gap-2 max-h-[70vh] overflow-y-auto pr-1">
                  {shown.map((t) => (
                    <li key={t.id} className="flex items-center gap-3 p-2 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <img src={thumbnailFor(t.videoId)} alt="" loading="lazy" className="w-20 aspect-video object-cover rounded" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" title={t.name}>{t.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={[t.sound, ...t.settings, ...t.moods, t.length, t.channel].filter(Boolean).join(' · ')}>
                          {[t.sound, [...t.settings, ...t.moods].join(', '), t.length].filter(Boolean).join(' · ') || 'no details yet'}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <IconButton title="Play now" onClick={() => playerAction((api) => api.load(t.videoId, t.title))}><Play className="w-4 h-4" /></IconButton>
                        <IconButton title="Add to queue" onClick={() => playerAction((api) => api.queueAdd(t.videoId, t.title))}><ListPlus className="w-4 h-4" /></IconButton>
                        <IconButton title="Edit name, sound, setting and mood" onClick={() => setEditing(t)}><Edit2 className="w-4 h-4" /></IconButton>
                        <IconButton title="Delete from the library" danger onClick={() => remove(t)}><Trash2 className="w-4 h-4" /></IconButton>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

      {editing && lib && <TrackEditor track={editing} options={lib.options} onClose={() => setEditing(null)} />}
    </section>
  )
}

// name, sound, settings and moods of a track — saved to the library (the Grimoire's section)
function TrackEditor({ track, options, onClose }) {
  const [v, setV] = useState({ name: track.name, sound: track.sound || '', settings: track.settings || [], moods: track.moods || [] })
  const [busy, setBusy] = useState(false)
  const toggle = (key, o) => setV((x) => ({ ...x, [key]: x[key].includes(o) ? x[key].filter((y) => y !== o) : [...x[key], o] }))
  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    const r = await playerAction((api) => api.updateSaved(track.id, { ...v, name: v.name.trim(), sound: v.sound || null }))
    setBusy(false)
    if (r?.success) { useToastStore.getState().success('Saved'); onClose() }
  }
  const group = (key, label, list) => (
    <div>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</p>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
        {list.map((o) => <button key={o} type="button" className={chip(key === 'sound' ? v.sound === o : v[key].includes(o))} aria-pressed={key === 'sound' ? v.sound === o : v[key].includes(o)}
          onClick={() => (key === 'sound' ? setV((x) => ({ ...x, sound: x.sound === o ? '' : o })) : toggle(key, o))}>{o}</button>)}
      </div>
    </div>
  )
  return (
    <Modal isOpen onClose={onClose} title="Edit link">
      <form onSubmit={save} className="space-y-4">
        <div className="flex gap-3 items-center">
          <img src={thumbnailFor(track.videoId)} alt="" className="w-24 aspect-video object-cover rounded" />
          <label className="flex-1 block">
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</span>
            <input type="text" value={v.name} onChange={(e) => setV((x) => ({ ...x, name: e.target.value }))} autoFocus
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </label>
        </div>
        {group('sound', 'Sound', options.sounds || [])}
        {group('settings', 'Setting', options.settings || [])}
        {group('moods', 'Mood', options.moods || [])}
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600">Cancel</button>
          <button type="submit" disabled={busy || !v.name.trim()} className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50">Save</button>
        </div>
      </form>
    </Modal>
  )
}

export function IconButton({ title, onClick, disabled, danger, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`p-2 rounded-lg text-gray-500 dark:text-gray-400 disabled:opacity-30 ${danger ? 'hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30' : 'hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'}`}
    >
      {children}
    </button>
  )
}

export default MusicLibrary
