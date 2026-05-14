import { useEffect, useRef, useState } from 'react'
import { useAnnotationStore } from '../../stores/annotationStore'
import { usePdfStore } from '../../stores/pdfStore'

interface Props {
  variant?: 'header' | 'toolbar'
}

export default function FileMenu({ variant = 'toolbar' }: Props) {
  const annotations = useAnnotationStore((s) => s.annotations)
  const undo = useAnnotationStore((s) => s.undo)
  const clearAll = useAnnotationStore((s) => s.clearAll)

  const doc = usePdfStore((s) => s.doc)
  const numPages = usePdfStore((s) => s.numPages)
  const pageNavOpen = usePdfStore((s) => s.pageNavOpen)
  const togglePageNav = usePdfStore((s) => s.togglePageNav)
  const loadFile = usePdfStore((s) => s.loadFile)

  const canUndo = annotations.length > 0
  const canClear = annotations.length > 0
  const canShowPages = !!doc && numPages > 1

  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) {
      try {
        await loadFile(f)
      } catch (err) {
        console.error(err)
        alert('Failed to load PDF')
      }
    }
    e.target.value = ''
  }

  const triggerClass =
    variant === 'header'
      ? 'h-8 px-3 rounded-md bg-white/10 hover:bg-white/15 text-white text-sm font-medium ring-1 ring-white/15 flex items-center gap-1.5'
      : 'h-10 px-3 rounded bg-slate-700 hover:bg-slate-600 text-sm font-medium flex items-center gap-1.5 text-white'

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
        className={triggerClass}
        aria-haspopup="true"
        aria-expanded={open}
      >
        File
        <svg viewBox="0 0 12 12" className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true">
          <path d="M2 4 L6 8 L10 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        hidden
        onChange={onPick}
      />
      {open && (
        <div className={`absolute right-0 ${variant === 'header' ? 'mt-2' : 'mt-1'} w-60 bg-white text-slate-900 rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden`}>
          <button
            onClick={() => { fileInputRef.current?.click(); setOpen(false) }}
            className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-orange-50 hover:text-orange-700 text-sm"
          >
            <span aria-hidden="true">📄</span>
            <span className="flex-1 text-left font-medium">{doc ? 'Open another PDF…' : 'Open PDF…'}</span>
          </button>

          {canShowPages && (
            <button
              onClick={() => { togglePageNav(); setOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 text-sm border-t border-slate-100"
            >
              <span aria-hidden="true">☰</span>
              <span className="flex-1 text-left">{pageNavOpen ? 'Hide pages panel' : 'Show pages panel'}</span>
              <span className="text-[11px] text-slate-400 tabular-nums">{numPages}</span>
            </button>
          )}

          <button
            onClick={() => { if (canUndo) { undo(); setOpen(false) } }}
            disabled={!canUndo}
            className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 text-sm disabled:opacity-40 disabled:cursor-not-allowed border-t border-slate-100"
          >
            <span aria-hidden="true">↶</span>
            <span className="flex-1 text-left">Undo</span>
            <span className="text-[11px] text-slate-400 tracking-wide">Ctrl+Z</span>
          </button>
          <button
            onClick={() => { if (canClear) { clearAll(); setOpen(false) } }}
            disabled={!canClear}
            className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-red-50 hover:text-red-700 text-sm disabled:opacity-40 disabled:cursor-not-allowed border-t border-slate-100"
          >
            <span aria-hidden="true">🗑</span>
            <span className="flex-1 text-left">Clear all annotations</span>
          </button>
        </div>
      )}
    </div>
  )
}
