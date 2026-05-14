import { useEffect, useRef, useState } from 'react'
import { CHANGELOG } from '../../lib/changelog'

const REPO_URL = 'https://github.com/JamesmarkeyUK/Universal_PDF'

export default function VersionChip() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

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
        className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide font-medium bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white ring-1 ring-white/10 leading-none"
        aria-haspopup="true"
        aria-expanded={open}
      >
        v{__APP_VERSION__}
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50">
          <div className="px-4 py-3 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
            <div className="text-xs uppercase tracking-wide opacity-70">What's new</div>
            <div className="text-sm font-semibold mt-0.5">
              Universal PDF v{__APP_VERSION__}
            </div>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {CHANGELOG.map((entry) => (
              <div key={entry.version} className="px-4 py-3 border-b border-slate-100 last:border-0">
                <div className="flex items-baseline justify-between mb-1">
                  <div className="text-sm font-semibold text-slate-900">v{entry.version}</div>
                  {entry.date && (
                    <div className="text-[11px] text-slate-400">{entry.date}</div>
                  )}
                </div>
                <ul className="space-y-1">
                  {entry.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                      <span aria-hidden="true" className="text-orange-500 mt-1.5 w-1 h-1 rounded-full bg-orange-500 shrink-0" />
                      <span className="leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
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
