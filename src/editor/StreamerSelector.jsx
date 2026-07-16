import { useMemo, useState } from 'react'
import { Search, Star } from 'lucide-react'
import { useEditor } from './EditorContext'
import { STREAMERS, STREAMERS_BY_POP, streamerInitials } from './streamers'
import { cn } from '@/lib/utils'

const FAV_KEY = 'kicksnap:favs'

function loadFavs() {
  try {
    return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || '[]'))
  } catch {
    return new Set()
  }
}

// Stable placeholder colour derived from the slug, so a face we don't have yet
// still reads as an intentional avatar rather than a blank box.
function colorFor(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return `hsl(${h % 360} 45% 32%)`
}

/**
 * Streamer avatar. Renders public/faces/<slug>.png when it exists; falls back to
 * the coloured initials until a face image is dropped in. Drop a square PNG at
 * public/faces/<slug>.png (see that folder's README) and it appears here + in
 * the recents/favourites rows automatically — no code change.
 */
function Face({ s, size = 'md' }) {
  const [err, setErr] = useState(false)
  return (
    <div
      className={cn(
        'flex items-center justify-center overflow-hidden font-extrabold text-white',
        size === 'sm' ? 'size-9 text-xs' : 'size-full text-sm',
      )}
      style={{ backgroundColor: colorFor(s.slug) }}
    >
      {err ? (
        streamerInitials(s.name)
      ) : (
        <img
          src={`/faces/${s.slug}.png`}
          alt={s.name}
          loading="lazy"
          onError={() => setErr(true)}
          className="h-full w-full object-cover"
        />
      )}
    </div>
  )
}

export default function StreamerSelector() {
  const { state, dispatch } = useEditor()
  const [query, setQuery] = useState('')
  const [favs, setFavs] = useState(loadFavs)

  const bySlug = useMemo(() => Object.fromEntries(STREAMERS.map((s) => [s.slug, s])), [])
  const recents = state.recentStreamers.map((slug) => bySlug[slug]).filter(Boolean)

  function toggleFav(slug, e) {
    e.stopPropagation()
    setFavs((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      localStorage.setItem(FAV_KEY, JSON.stringify([...next]))
      return next
    })
  }

  function pick(s) {
    dispatch({ type: 'SELECT_STREAMER', slug: s.slug, name: s.name, overlay: s.overlay, rate: s.rate })
  }

  const q = query.trim().toLowerCase()
  const filtered = STREAMERS_BY_POP.filter((s) => s.name.toLowerCase().includes(q))
  const favList = filtered.filter((s) => favs.has(s.slug))
  const rest = filtered.filter((s) => !favs.has(s.slug))

  return (
    <div className="flex flex-col gap-4">
      {/* search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search streamers"
          className="w-full border-2 border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-kick focus:outline-none"
        />
      </div>

      {/* recently used */}
      {recents.length > 0 && !q && (
        <div>
          <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Recently used
          </p>
          <div className="flex gap-2">
            {recents.map((s) => (
              <button
                key={s.slug}
                onClick={() => pick(s)}
                title={s.name}
                className="overflow-hidden border-2 border-border transition-colors hover:border-kick"
              >
                <Face s={s} size="sm" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* favourites */}
      {favList.length > 0 && (
        <Section title="Favourites" list={favList} favs={favs} onPick={pick} onFav={toggleFav} selected={state.overlay.streamer} />
      )}

      {/* all, popularity sorted */}
      {rest.length > 0 ? (
        <Section title={q ? 'Results' : 'All streamers'} list={rest} favs={favs} onPick={pick} onFav={toggleFav} selected={state.overlay.streamer} />
      ) : favList.length === 0 ? (
        <p className="font-mono text-[11px] leading-relaxed uppercase tracking-wide text-muted-foreground">
          Not on the list? Import your own overlay below.
        </p>
      ) : null}
    </div>
  )
}

function Section({ title, list, favs, onPick, onFav, selected }) {
  return (
    <div>
      <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {title}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {list.map((s) => {
          const isSel = selected.trim().toLowerCase() === s.name.toLowerCase()
          return (
            <button
              key={s.slug}
              onClick={() => onPick(s)}
              className={cn(
                'group relative flex flex-col border-2 transition-colors',
                isSel ? 'border-kick' : 'border-border hover:border-kick/50',
              )}
            >
              <div className="relative aspect-square w-full overflow-hidden">
                <Face s={s} />
                {s.fire && <span className="absolute left-0.5 top-0.5 text-xs">🔥</span>}
                <span
                  onClick={(e) => onFav(s.slug, e)}
                  className={cn(
                    'absolute right-0.5 top-0.5 cursor-pointer',
                    favs.has(s.slug) ? 'text-kick' : 'text-white/50 hover:text-white',
                  )}
                >
                  <Star className="size-3.5" fill={favs.has(s.slug) ? 'currentColor' : 'none'} strokeWidth={2} />
                </span>
              </div>
              <div className="px-1 py-1">
                <div className="truncate text-[11px] font-bold leading-tight text-foreground">
                  {s.name}
                </div>
                <div className="font-mono text-[9px] text-kick">${s.rate}/100K</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
