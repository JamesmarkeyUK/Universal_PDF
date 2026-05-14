import { useEffect, useRef, useState } from 'react'

interface Props {
  onUndo: () => void
  onClear: () => void
  canUndo: boolean
  canClear: boolean
}

export default function FileMenu({ onUndo, onClear, canUndo, canClear }: Props) {
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
        onClick={() => setOpen((o) => !o)}
        className="h-10 px-3 rounded bg-slate-700 hover:bg-slate-600 text-sm font-medium flex items-center gap-1.5"
        aria-haspopup="true"
        aria-expanded={open}
      >
        File
        <svg viewBox="0 0 12 12" className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true">
          <path d="M2 4 L6 8 L10 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-56 bg-white text-slate-900 rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden">
          <button
            onClick={() => { if (canUndo) { onUndo(); setOpen(false) } }}
            disabled={!canUndo}
            className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span aria-hidden="true">↶</span>
            <span className="flex-1 text-left">Undo</span>
            <span className="text-[11px] text-slate-400 tracking-wide">Ctrl+Z</span>
          </button>
          <button
            onClick={() => { if (canClear) { onClear(); setOpen(false) } }}
            disabled={!canClear}
            className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-red-50 hover:text-red-700 text-sm disabled:opacity-40 disabled:cursor-not-allowed border-t border-slate-100"
          >
            <span aria-hidden="true">🗑</span>
            <span className="flex-1 text-left">Clear all</span>
          </button>
        </div>
      )}
    </div>
  )
}
