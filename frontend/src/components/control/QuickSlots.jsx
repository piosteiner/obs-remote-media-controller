import { useEffect, useState } from 'react'
import { Plus, X, RefreshCw, Repeat, Square, Play, Keyboard } from 'lucide-react'
import { slotsAPI, imagesAPI } from '../../services/api'
import useStore from '../../store'
import useToastStore from '../../store/toast'
import LibraryPicker from '../common/LibraryPicker'
import websocketService from '../../services/websocket'
import { rotationIndex } from '../../hooks/useRotation'

const QUICK_SLOTS = 10
const DEFAULT_INTERVAL = 10
// the seconds last chosen: the default of the next rotation (this browser)
const SECONDS_KEY = 'obs-rotation-seconds'
const savedSeconds = () => { try { return Number(localStorage.getItem(SECONDS_KEY)) || DEFAULT_INTERVAL } catch { return DEFAULT_INTERVAL } }
const rememberSeconds = (s) => { try { localStorage.setItem(SECONDS_KEY, String(s)) } catch { /* private mode */ } }
const clampSeconds = (v) => Math.min(3600, Math.max(2, Math.round(Number(v)) || DEFAULT_INTERVAL))

// an image as the quick slots keep it (backend/src/services/slotState.js), from a library or Adenai pick
const itemOf = (image) => ({
  url: image.url,
  imageId: image.id ?? null,
  thumbnailUrl: image.thumbnailUrl || null,
  name: image.originalName || image.name || image.filename || null,
})

/**
 * QuickSlots Component
 * Ten prepared images below a slot (2 rows of 5): a click shows one in the slot. "Rotate" chooses several, in
 * the order clicked, to be shown in turn and faded into each other (on the display: pages/Display.jsx).
 * Keys, for the slot last used (store.activeSlot): 1–9 and 0 show quick image 1–10, Space starts the last
 * rotation again or stops it — not while typing in a field or with a dialog open.
 * An image file dropped on a quick slot (or pasted into a chosen one) is uploaded to the library and put there.
 */
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']
const typing = (el) => el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))
function QuickSlots({ slotId, slotData, current }) {
  const setSlot = useStore(state => state.setSlot)
  const active = useStore(state => state.activeSlot) === slotId
  const setActiveSlot = useStore(state => state.setActiveSlot)
  const [uploadingCell, setUploadingCell] = useState(null)
  const quick = Array.from({ length: QUICK_SLOTS }, (_, i) => slotData.quick?.[i] || null)
  const rotation = slotData.rotation
  const rotating = !!rotation?.active

  const [pickFor, setPickFor] = useState(null) // the cell the picker fills
  const [choosing, setChoosing] = useState(false) // choosing images for a rotation
  const [chosen, setChosen] = useState([]) // their cells, in the order clicked
  const [intervalSec, setIntervalSec] = useState(rotation?.intervalSec || savedSeconds)
  // the running rotation's seconds, as typed (saved when the field is left or Enter pressed)
  const [liveSec, setLiveSec] = useState(rotation?.intervalSec || '')
  useEffect(() => { setLiveSec(rotation?.intervalSec || '') }, [rotation?.intervalSec])

  // the server answers with the whole slot; it is set here too (the broadcast may come later)
  const save = async (body, done) => {
    try {
      const result = await slotsAPI.update(slotId, body)
      if (result?.data) {
        const { slot, ...fields } = result.data
        setSlot(slotId, { ...useStore.getState().slots[slotId], ...fields })
      }
      if (done) useToastStore.getState().success(done)
    } catch (error) {
      console.error('Failed to update slot:', error)
      useToastStore.getState().error(error?.response?.data?.error || 'Failed to update slot. Please try again.')
    }
  }

  const setCell = (i, item) => save({ quick: quick.map((q, j) => (j === i ? item : q)) })
  const show = (item) => save({ imageUrl: item.url, imageId: item.imageId })
  // the image shown now, with its name and thumbnail from this library when it is in it
  const addCurrent = async () => {
    const free = quick.findIndex((q) => !q)
    if (free === -1) return useToastStore.getState().warning('All quick slots are taken')
    let known = null
    try {
      const images = (await imagesAPI.getAll())?.data?.images || []
      known = images.find((im) => (slotData.imageId && im.id === slotData.imageId) || im.url === slotData.imageUrl)
    } catch { /* without a name then */ }
    setCell(free, known ? { ...itemOf(known), url: slotData.imageUrl }
      : { url: slotData.imageUrl, imageId: slotData.imageId ?? null, thumbnailUrl: null, name: null })
  }

  const toggleChosen = (i) => setChosen((list) => (list.includes(i) ? list.filter((x) => x !== i) : [...list, i]))
  const startChoosing = () => {
    // a rotation already set up: its images chosen again, to change it
    const again = (rotation?.items || []).map((it) => quick.findIndex((q) => q?.url === it.url)).filter((i) => i >= 0)
    setChosen(again)
    setIntervalSec(rotation?.intervalSec || savedSeconds())
    setChoosing(true)
  }
  const startRotation = async () => {
    const seconds = clampSeconds(intervalSec)
    rememberSeconds(seconds)
    await save({ rotation: { active: true, items: chosen.map((i) => quick[i]), intervalSec: seconds } },
      `Slot ${slotId}: ${chosen.length} images in turn, every ${seconds} s`)
    setChoosing(false)
  }
  // a running rotation's seconds changed: the image on now stays (for the new time), the order goes on from it
  const changeSeconds = () => {
    const seconds = clampSeconds(liveSec)
    setLiveSec(seconds)
    if (!rotating || seconds === rotation.intervalSec) return
    rememberSeconds(seconds)
    const at = rotationIndex(rotation, websocketService.serverNow())
    const items = [...rotation.items.slice(at), ...rotation.items.slice(0, at)]
    save({ rotation: { active: true, items, intervalSec: seconds } })
  }
  const stopRotation = () => save({ rotation: { ...rotation, active: false } })

  // Space: the rotation set up last starts again (its images and seconds), or the running one stops
  const toggleRotation = () => {
    if (rotating) return stopRotation()
    if ((rotation?.items?.length || 0) < 2) return useToastStore.getState().info('Choose images with “Rotate…” first')
    save({ rotation: { active: true, items: rotation.items, intervalSec: rotation.intervalSec } })
  }

  useEffect(() => {
    if (!active) return undefined
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || typing(e.target) || choosing || pickFor !== null) return
      if (document.querySelector('[role="dialog"]')) return
      const i = KEYS.indexOf(e.key)
      if (i >= 0 && quick[i]) { e.preventDefault(); show(quick[i]) }
      if (e.key === ' ') { e.preventDefault(); toggleRotation() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // an image file onto quick slot i: uploaded to the library, then put there
  const uploadInto = async (i, file) => {
    if (!file?.type?.startsWith('image/')) return useToastStore.getState().warning('That is not an image file')
    setUploadingCell(i)
    try {
      const result = await imagesAPI.upload(file)
      if (result?.success) await setCell(i, itemOf(result.data))
    } catch (error) {
      console.error('Failed to upload image:', error)
      useToastStore.getState().error('Failed to upload the image')
    } finally {
      setUploadingCell(null)
    }
  }
  const imageFileOf = (list) => [...(list || [])].map((it) => (it.getAsFile ? (it.kind === 'file' ? it.getAsFile() : null) : it)).find((f) => f?.type?.startsWith('image/'))

  const isCurrent = (q) => q && current && q.url === current
  const inRotation = (q) => rotating && q && rotation.items.some((it) => it.url === q.url)
  const hasCurrentImage = !!slotData.imageUrl && !quick.some((q) => q?.url === slotData.imageUrl)

  return (
    <div className="mt-4" data-testid={`quick-slots-${slotId}`} onPointerDown={() => setActiveSlot(slotId)} onFocusCapture={() => setActiveSlot(slotId)}>
      <div className="flex items-center justify-between mb-2 gap-2">
        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          Quick images
          {active && (
            <span className="flex items-center gap-1 text-[11px] font-normal text-gray-400" data-testid="keys-hint" title="Keyboard: 1–9 and 0 show quick image 1–10, Space starts or stops the rotation">
              <Keyboard className="w-3.5 h-3.5" /> keys 1–0 · Space
            </span>
          )}
        </h4>
        <div className="flex gap-2">
          {!choosing && hasCurrentImage && (
            <button
              type="button"
              onClick={addCurrent}
              className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-md border border-gray-300 text-gray-700 hover:border-primary-400"
              title="Put the image shown now into the first free quick slot"
            >
              <Plus className="w-3.5 h-3.5" /> Current
            </button>
          )}
          {rotating && !choosing && (
            <label className="flex items-center gap-1 text-xs text-gray-600">
              every
              <input
                type="number"
                min="2"
                max="3600"
                value={liveSec}
                onChange={(e) => setLiveSec(e.target.value)}
                onBlur={changeSeconds}
                onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
                aria-label="Seconds per image"
                className="w-14 px-1.5 py-0.5 border border-gray-300 rounded-md"
              />
              s
            </label>
          )}
          {rotating && !choosing && (
            <button
              type="button"
              onClick={stopRotation}
              className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-md bg-red-50 border border-red-200 text-red-700 hover:bg-red-100"
            >
              <Square className="w-3.5 h-3.5" /> Stop rotation
            </button>
          )}
          {!choosing && (
            <button
              type="button"
              onClick={startChoosing}
              disabled={quick.filter(Boolean).length < 2}
              className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-md border border-gray-300 text-gray-700 hover:border-primary-400 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Show several quick images in turn, fading into each other"
            >
              <Repeat className="w-3.5 h-3.5" /> {rotating ? 'Change rotation' : 'Rotate…'}
            </button>
          )}
        </div>
      </div>

      {choosing && (
        <p className="text-xs text-primary-700 mb-2">Click the images to rotate, in the order they should come.</p>
      )}

      <div className="grid grid-cols-5 gap-2">
        {quick.map((q, i) => {
          const order = chosen.indexOf(i)
          return (
            <div
              key={i}
              data-cell={i}
              onDragOver={(e) => { if (!choosing && [...(e.dataTransfer?.types || [])].includes('Files')) e.preventDefault() }}
              onDrop={(e) => { const f = imageFileOf(e.dataTransfer?.files); if (f && !choosing) { e.preventDefault(); uploadInto(i, f) } }}
              onPaste={(e) => { const f = imageFileOf(e.clipboardData?.items); if (f && !choosing) { e.preventDefault(); uploadInto(i, f) } }}
              className={`group relative aspect-video rounded-md overflow-hidden border-2 ${
                choosing && order >= 0 ? 'border-primary-500'
                  : isCurrent(q) ? 'border-green-500'
                  : inRotation(q) ? 'border-primary-300'
                  : q ? 'border-gray-200' : 'border-dashed border-gray-300'
              } ${q ? 'bg-gray-900' : 'bg-gray-50'}`}
            >
              {q ? (
                <button
                  type="button"
                  onClick={() => (choosing ? toggleChosen(i) : show(q))}
                  className="w-full h-full"
                  title={choosing ? 'Choose for the rotation' : `Show${q.name ? ` “${q.name}”` : ''} in Slot ${slotId}`}
                >
                  <img src={q.thumbnailUrl || q.url} alt={q.name || `Quick image ${i + 1}`} loading="lazy" className="w-full h-full object-cover object-top" />
                  {/* its name, as in the library picker */}
                  {q.name && (
                    <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 pb-1 pt-3 text-left">
                      <span className="block text-white text-[11px] font-medium truncate" data-testid="quick-name">{q.name}</span>
                    </span>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => !choosing && setPickFor(i)}
                  disabled={choosing}
                  className="w-full h-full flex items-center justify-center text-gray-400 hover:text-primary-600 disabled:cursor-default"
                  title="Choose an image for this quick slot"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}

              {uploadingCell === i && (
                <span className="absolute inset-0 flex items-center justify-center bg-white/70" data-testid="cell-uploading">
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600" />
                </span>
              )}
              {/* its key (for the slot whose keys are on) */}
              {active && q && !choosing && (
                <span className="absolute top-1 right-1 px-1 rounded bg-black/50 text-white text-[10px] font-mono group-hover:opacity-0 transition-opacity" aria-hidden="true">{KEYS[i]}</span>
              )}
              {choosing && order >= 0 && (
                <span className="absolute top-1 left-1 min-w-[1.25rem] h-5 px-1 rounded-full bg-primary-600 text-white text-xs font-semibold flex items-center justify-center">
                  {order + 1}
                </span>
              )}
              {isCurrent(q) && !choosing && (
                <span className="absolute top-1 left-1 px-1.5 rounded bg-green-600 text-white text-[10px] font-semibold">on</span>
              )}
              {q && !choosing && (
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                  <button type="button" onClick={() => setPickFor(i)} className="p-1 rounded bg-white/90 text-gray-700 hover:bg-white" title="Replace">
                    <RefreshCw className="w-3 h-3" />
                  </button>
                  <button type="button" onClick={() => setCell(i, null)} className="p-1 rounded bg-white/90 text-red-600 hover:bg-white" title="Empty this quick slot">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {choosing && (
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            every
            <input
              type="number"
              min="2"
              max="3600"
              value={intervalSec}
              onChange={(e) => setIntervalSec(e.target.value)}
              className="w-20 px-2 py-1 border border-gray-300 rounded-md"
              aria-label="Seconds per image"
            />
            seconds
          </label>
          <div className="flex-1" />
          <button type="button" onClick={() => setChoosing(false)} className="px-3 py-1.5 text-sm rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200">
            Cancel
          </button>
          <button
            type="button"
            onClick={startRotation}
            disabled={chosen.length < 2}
            className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Play className="w-3.5 h-3.5" /> Rotate {chosen.length || ''} images
          </button>
        </div>
      )}

      <LibraryPicker
        isOpen={pickFor !== null}
        onClose={() => setPickFor(null)}
        onSelect={(image) => setCell(pickFor, itemOf(image))}
      />
    </div>
  )
}

export default QuickSlots
