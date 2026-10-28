import { useEffect, useRef, useState } from 'react'

/**
 * CrossfadeImage Component
 * An image that changes calmly — the OBS display (pages/Display.jsx) and the slot's preview on the controller
 * (components/control/SlotControl.jsx), so both show the same transition. Once a new image is loaded, it fades in
 * while the old one fades out, at the same time; their curves complement each other — the new one comes up
 * quickly at first (FADE_IN), the old one gives way mostly towards the end (FADE_OUT) — so the two never become
 * see-through together. The first image fades in, a cleared one (url null) fades out.
 */
export const CHANGE_FADE_MS = 2000
// in a rotation up to 2.5 s, but never more than a third of the time an image stays
export const rotationFadeMs = (intervalSec) => Math.min(2500, (intervalSec * 1000) / 3)

const FADE_IN = 'cubic-bezier(0.25, 0.6, 0.45, 1)'
const FADE_OUT = 'cubic-bezier(0.55, 0, 0.75, 0.4)'
const EMPTY = { url: null, opacity: 0, ms: 0, ease: 'ease-in-out' }
const BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

function CrossfadeImage({ url, fadeMs = CHANGE_FADE_MS, className = '', imgClassName = 'object-contain', alt = '', imgStyle = {} }) {
  // Two layers, both always there (a layer that appears would show at once, without a fade). top: the layer that
  // shows, or is fading in, the newest image; the other lies under it.
  const [layers, setLayers] = useState([EMPTY, EMPTY])
  const [top, setTop] = useState(0)
  const state = useRef({ layers, top })
  state.current = { layers, top }

  useEffect(() => {
    const { layers: now, top: shown } = state.current
    const set = (i, layer) => setLayers((ls) => ls.map((l, j) => (j === i ? { ...l, ...layer } : l)))

    // cleared: what shows fades out
    if (!url) {
      setLayers((ls) => ls.map((l) => ({ ...l, opacity: 0, ms: fadeMs, ease: 'ease-in-out' })))
      return undefined
    }
    if (now[shown].url === url && now[shown].opacity > 0) return undefined

    // loaded first (no half-drawn picture); then the new one fades in on top while the old one fades out
    let cancelled = false
    const img = new Image()
    img.onload = img.onerror = () => {
      if (cancelled) return
      const outgoing = state.current.top
      const incoming = 1 - outgoing
      set(incoming, { url, opacity: 0, ms: 0, ease: FADE_IN }) // invisible, on top …
      setTop(incoming)
      // … then both at once (two frames later, so the browser has drawn it at 0 and the transitions run)
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (cancelled) return
        set(incoming, { opacity: 1, ms: fadeMs, ease: FADE_IN })
        set(outgoing, { opacity: 0, ms: fadeMs, ease: FADE_OUT })
      }))
    }
    img.src = url
    return () => { cancelled = true }
  }, [url])

  return (
    <div className={className}>
      {layers.map((layer, i) => (
        <img
          key={i}
          src={layer.url || BLANK}
          alt={layer.url && i === top ? alt : ''}
          data-layer={i === top ? 'front' : 'back'}
          data-url={layer.url || ''}
          className={`absolute inset-0 w-full h-full ${imgClassName}`}
          style={{
            opacity: layer.url ? layer.opacity : 0,
            transition: `opacity ${layer.ms}ms ${layer.ease}`,
            zIndex: i === top ? 2 : 1,
            ...imgStyle,
          }}
          onError={() => layer.url && console.error('Image failed to load:', layer.url)}
        />
      ))}
    </div>
  )
}

export default CrossfadeImage
