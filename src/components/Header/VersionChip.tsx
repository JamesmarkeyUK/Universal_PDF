import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useChangelog, type ProductCode } from '@unisim/sdk'

const CHANGELOG_REPO_URL = 'https://github.com/universal-simulation-ltd/universal-suite-changelog'

const PRODUCT_CHIP: Record<ProductCode | 'suite', { label: string; classes: string }> = {
  pdf:          { label: 'PDF',          classes: 'bg-orange-100 text-orange-700 ring-orange-200' },
  webinar:      { label: 'Webinar',      classes: 'bg-sky-100 text-sky-700 ring-sky-200' },
  exports:      { label: 'Exports',      classes: 'bg-emerald-100 text-emerald-700 ring-emerald-200' },
  cyber_assess: { label: 'Cyber Assess', classes: 'bg-rose-100 text-rose-700 ring-rose-200' },
  ergo_assess:  { label: 'Ergo Assess',  classes: 'bg-violet-100 text-violet-700 ring-violet-200' },
  suite:        { label: 'Suite',        classes: 'bg-slate-200 text-slate-700 ring-slate-300' },
}

const TYPE_BADGE: Record<string, string> = {
  added:      'bg-emerald-50 text-emerald-700 ring-emerald-200',
  changed:    'bg-sky-50 text-sky-700 ring-sky-200',
  fixed:      'bg-amber-50 text-amber-700 ring-amber-200',
  removed:    'bg-rose-50 text-rose-700 ring-rose-200',
  deprecated: 'bg-slate-50 text-slate-600 ring-slate-200',
  security:   'bg-violet-50 text-violet-700 ring-violet-200',
}

export default function VersionChip() {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  const { releases, currentVersion, loading } = useChangelog({ limit: 10 })

  const versionLabel = currentVersion ?? '…'

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) {
      setCoords(null)
      return
    }
    function place() {
      const rect = buttonRef.current!.getBoundingClientRect()
      setCoords({
        top: rect.bottom + 8,
        left: rect.left,
      })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      const target = e.target as Node
      if (
        buttonRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return
      }
      setOpen(false)
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
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={`Universal Suite v${versionLabel} — what's new`}
        className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide font-medium ring-1 leading-none transition-colors bg-orange-500/20 hover:bg-orange-500/30 text-orange-200 ring-orange-400/30"
        aria-haspopup="true"
        aria-expanded={open}
      >
        v{versionLabel}
      </button>

      {open && coords && createPortal(
        <div
          ref={popoverRef}
          style={{ position: 'fixed', top: coords.top, left: coords.left, zIndex: 9999 }}
          className="w-96 max-w-[calc(100vw-2rem)] bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 overflow-hidden"
        >
          <div className="px-4 py-3 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
            <div className="text-xs uppercase tracking-wide opacity-70">What's new in the Universal Suite</div>
            <div className="text-sm font-semibold mt-0.5">Suite v{versionLabel}</div>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {loading && (
              <div className="px-4 py-6 text-center text-xs text-slate-500">Loading…</div>
            )}
            {!loading && releases.length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-slate-500">No releases yet.</div>
            )}
            {releases.map((release) => (
              <div key={release.version} className="px-4 py-3 border-b border-slate-100 last:border-0">
                <div className="flex items-baseline justify-between mb-2">
                  <div className="text-sm font-semibold text-slate-900">v{release.version}</div>
                  <div className="text-[11px] text-slate-400">{release.date}</div>
                </div>
                <ul className="space-y-2">
                  {release.entries.map((entry, i) => {
                    const productChip = PRODUCT_CHIP[entry.product] ?? PRODUCT_CHIP.suite
                    return (
                      <li key={i} className="text-xs text-slate-700 leading-snug">
                        <span className="inline-flex items-center gap-1 mr-1.5 align-middle">
                          <span
                            className={`inline-flex items-center px-1.5 py-px rounded text-[9px] uppercase tracking-wide font-semibold ring-1 ${productChip.classes}`}
                          >
                            {productChip.label}
                          </span>
                          <span
                            className={`inline-flex items-center px-1 py-px rounded text-[9px] uppercase tracking-wide font-medium ring-1 ${
                              TYPE_BADGE[entry.type] ?? 'bg-slate-50 text-slate-600 ring-slate-200'
                            }`}
                          >
                            {entry.type}
                          </span>
                        </span>
                        {entry.summary}
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
          <div className="px-4 py-2.5 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Suite changelog</span>
            <a
              href={CHANGELOG_REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="text-orange-600 hover:underline font-medium"
            >
              view source ↗
            </a>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
