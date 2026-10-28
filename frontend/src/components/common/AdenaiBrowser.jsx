import { useState, useEffect, useMemo } from 'react'
import { Search, CheckCircle2, RotateCw } from 'lucide-react'
import { fetchAdenaiImages, matchesSearch } from '../../services/adenai'

const TOP_TAGS = 24

/**
 * AdenaiBrowser Component
 * The Adenai map's media library to pick from (LibraryPicker's "Adenai" tab): search, category and the most used
 * tags of what is shown as filters (all chosen tags must be on an image).
 */
function AdenaiBrowser({ selectedKey, onPick, bindPreview }) {
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState([])

  const load = async (fresh = false) => {
    setLoading(true)
    setError(null)
    try {
      setImages(await fetchAdenaiImages({ fresh }))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const categories = useMemo(() => [...new Set(images.map((i) => i.category))].sort(), [images])
  const inCategory = useMemo(() => images.filter((i) => !category || i.category === category), [images, category])
  const shown = useMemo(
    () => inCategory.filter((i) => tags.every((t) => i.tags.includes(t)) && (!query.trim() || matchesSearch(i, query))),
    [inCategory, tags, query]
  )
  // the tags most used among what is shown — the chosen ones always stay
  const tagChoices = useMemo(() => {
    const counts = new Map()
    for (const i of shown) for (const t of i.tags) counts.set(t, (counts.get(t) || 0) + 1)
    const top = [...counts].filter(([t]) => !tags.includes(t)).sort((a, b) => b[1] - a[1]).slice(0, TOP_TAGS)
    return [...tags.map((t) => [t, counts.get(t) || 0]), ...top]
  }, [shown, tags])
  const toggleTag = (t) => setTags((list) => (list.includes(t) ? list.filter((x) => x !== t) : [...list, t]))

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, caption, tags…"
            aria-label="Search Adenai images"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setTags([]) }}
          aria-label="Category"
          className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
        >
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button
          type="button"
          onClick={() => load(true)}
          title="Load the Adenai library again"
          className="px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      {tagChoices.length > 0 && (
        <div className="flex flex-wrap gap-1.5" aria-label="Tags">
          {tagChoices.map(([t, n]) => (
            <button
              key={t}
              type="button"
              onClick={() => toggleTag(t)}
              aria-pressed={tags.includes(t)}
              className={`px-2.5 py-0.5 rounded-full text-xs border transition-colors ${
                tags.includes(t)
                  ? 'bg-primary-600 border-primary-600 text-white'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-primary-400'
              }`}
            >
              {t} <span className={tags.includes(t) ? 'text-primary-100' : 'text-gray-400'}>{n}</span>
            </button>
          ))}
        </div>
      )}

      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 text-sm">Couldn’t load the Adenai library: {error}</p>
          </div>
        ) : shown.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No Adenai images match</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {shown.map((image) => (
              <button
                key={image.adenaiId}
                {...bindPreview(image)}
                onClick={() => onPick(image)}
                title={[image.originalName, image.tags.join(', ')].filter(Boolean).join(' — ')}
                className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                  selectedKey === image.adenaiId
                    ? 'border-primary-500 ring-2 ring-primary-200'
                    : 'border-gray-200 hover:border-primary-300'
                }`}
              >
                <img
                  src={image.thumbnailUrl}
                  alt={image.originalName}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover object-top"
                />
                {selectedKey === image.adenaiId && (
                  <div className="absolute top-2 right-2 bg-primary-600 rounded-full p-1">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <p className="text-white text-xs font-medium truncate">{image.originalName}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400">
        {shown.length} of {images.length} images from the Adenai map — shown in the slot from there, not copied into this library.
      </p>
    </div>
  )
}

export default AdenaiBrowser
