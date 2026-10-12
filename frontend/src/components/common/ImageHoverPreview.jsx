import { useState, useRef, useEffect, useCallback } from 'react'

const PANEL_WIDTH = 320
const MAX_IMAGE_HEIGHT = 400 // Thumbnails are 400px max, so no upscaling
const CAPTION_HEIGHT = 52
const GAP = 12
const MARGIN = 8
const SHOW_DELAY = 300

/**
 * Hover preview for image grids: shows the whole (uncropped) image next to the
 * hovered tile. Spread bind(image) onto each tile and render <ImageHoverPreview>.
 */
export function useImageHoverPreview() {
  const [preview, setPreview] = useState(null)
  const timer = useRef(null)
  // Image id that is pending or shown, so mouse moves within a tile don't restart the delay
  const armedId = useRef(null)

  const hide = useCallback(() => {
    clearTimeout(timer.current)
    armedId.current = null
    setPreview(null)
  }, [])

  // The tile position goes stale when anything scrolls
  useEffect(() => {
    window.addEventListener('scroll', hide, true)
    return () => {
      window.removeEventListener('scroll', hide, true)
      clearTimeout(timer.current)
    }
  }, [hide])

  // Armed on enter and on move, so the preview also appears after scrolling
  // stops with the cursor resting on a tile
  const arm = (image, e) => {
    // Touch devices fire mouseenter on tap; the preview would get stuck
    if (armedId.current === image.id || !window.matchMedia('(hover: hover)').matches) return
    const tile = e.currentTarget
    armedId.current = image.id
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setPreview({ image, rect: tile.getBoundingClientRect() })
    }, SHOW_DELAY)
  }

  const bind = (image) => ({
    onMouseEnter: (e) => arm(image, e),
    onMouseMove: (e) => arm(image, e),
    onMouseLeave: hide,
    onMouseDown: hide,
  })

  return { bind, preview }
}

export function ImageHoverPreview({ preview }) {
  if (!preview) return null
  const { image, rect } = preview

  const ratio = image.width && image.height ? image.height / image.width : 1
  const imageHeight = Math.round(Math.min(MAX_IMAGE_HEIGHT, PANEL_WIDTH * ratio))
  const panelHeight = imageHeight + CAPTION_HEIGHT

  // Right of the tile if it fits, otherwise left; vertically centered on the tile
  const fitsRight = rect.right + GAP + PANEL_WIDTH <= window.innerWidth - MARGIN
  const left = fitsRight ? rect.right + GAP : Math.max(MARGIN, rect.left - GAP - PANEL_WIDTH)
  const top = Math.min(
    Math.max(MARGIN, rect.top + rect.height / 2 - panelHeight / 2),
    window.innerHeight - panelHeight - MARGIN
  )

  return (
    <div
      className="fixed z-[60] pointer-events-none bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden"
      style={{ left, top, width: PANEL_WIDTH }}
    >
      <div className="bg-gray-100 flex items-center justify-center" style={{ height: imageHeight }}>
        <img
          src={image.thumbnailUrl || image.url}
          alt=""
          className="max-w-full max-h-full object-contain"
        />
      </div>
      <div className="px-3 py-2">
        <p className="text-sm font-medium text-gray-900 truncate">
          {image.originalName || image.filename}
        </p>
        {image.width && image.height && (
          <p className="text-xs text-gray-500">{image.width} × {image.height}</p>
        )}
      </div>
    </div>
  )
}
