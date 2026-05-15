import { useEffect, useRef, useState } from 'react'
import { CHANGELOG } from '../../lib/changelog'

const REPO_URL = 'https://github.com/universal-simulation-ltd/Universal_PDF'

// Tailwind classes are static strings so the JIT can discover them — each
// palette entry is a complete chip skin. The version is hashed into this
// array so the colour changes every time the version bumps.
const CHIP_PALETTE: Array<{ bg: string; hover: string; text: string; ring: string; dot: string }> = [
  { bg: 'bg-orange-500/20',   hover: 'hover:bg-orange-500/30',   text: 'text-orange-200',   ring: 'ring-orange-400/30',   dot: 'bg-orange-500'   },
  { bg: 'bg-emerald-500/20',  hover: 'hover:bg-emerald-500/30',  text: 'text-emerald-200',  ring: 'ring-emerald-400/30',  dot: 'bg-emerald-500'  },
  { bg: 'bg-sky-500/20',      hover: 'hover:bg-sky-500/30',      text: 'text-sky-200',      ring: 'ring-sky-400/30',      dot: 'bg-sky-500'      },
  { bg: 'bg-violet-500/20',   hover: 'hover:bg-violet-500/30',   text: 'text-violet-200',   ring: 'ring-violet-400/30',   dot: 'bg-violet-500'   },
  { bg: 'bg-amber-500/20',    hover: 'hover:bg-amber-500/30',    text: 'text-amber-200',    ring: 'ring-amber-400/30',    dot: 'bg-amber-500'    },
  { bg: 'bg-rose-500/20',     hover: 'hover:bg-rose-500/30',     text: 'text-rose-200',     ring: 'ring-rose-400/30',     dot: 'bg-rose-500'     },
  { bg: 'bg-teal-500/20',     hover: 'hover:bg-teal-500/30',     text: 'text-teal-200',     ring: 'ring-teal-400/30',     dot: 'bg-teal-500'     },
  { bg: 'bg-fuchsia-500/20',  hover: 'hover:bg-fuchsia-500/30',  text: 'text-fuchsia-200',  ring: 'ring-fuchsia-400/30',  dot: 'bg-fuchsia-500'  }
]

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function paletteForVersion(version: string) {
  return CHIP_PALETTE[hashString(version) % CHIP_PALETTE.length]
}

export default function VersionChip() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const skin = paletteForVersion(__APP_VERSION__)

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={`Universal PDF v${__APP_VERSION__} — what's new`}
        className={`hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide font-medium ring-1 leading-none transition-colors ${skin.bg} ${skin.hover} ${skin.text} ${skin.ring}`}
        aria-haspopup="true"
        aria-expanded={open}
      >
        v{__APP_VERSION__}
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50">
          <div className="px-4 py-3 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
            <div className="text-xs uppercase tracking-wide opacity-70">What's new</div>
            <div className="text-sm font-semibold mt-0.5 flex items-center gap-2">
              <span className={`inline-block w-2 h-2 rounded-full ${skin.dot}`} aria-hidden="true" />
              Universal PDF v{__APP_VERSION__}
            </div>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {CHANGELOG.map((entry) => {
              const entrySkin = paletteForVersion(entry.version)
              return (
                <div key={entry.version} className="px-4 py-3 border-b border-slate-100 last:border-0">
                  <div className="flex items-baseline justify-between mb-1">
                    <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${entrySkin.dot}`} aria-hidden="true" />
                      v{entry.version}
                    </div>
                    {entry.date && (
                      <div className="text-[11px] text-slate-400">{entry.date}</div>
                    )}
                  </div>
                  <ul className="space-y-1">
                    {entry.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                        <span aria-hidden="true" className={`mt-1.5 w-1 h-1 rounded-full shrink-0 ${entrySkin.dot}`} />
                        <span className="leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
          <div className="px-4 py-2.5 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Full history on GitHub</span>
            <a
              href={`${REPO_URL}/releases`}
              target="_blank"
              rel="noreferrer"
              className="text-orange-600 hover:underline font-medium"
            >
              releases ↗
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
