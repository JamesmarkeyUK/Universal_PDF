import { useEffect, useRef, useState } from 'react'
import { useAnnotationStore } from '../../stores/annotationStore'
import { usePdfStore } from '../../stores/pdfStore'
import { exportPdfWithAnnotations } from '../../lib/export'
import SignatureMenu from '../Signature/SignatureMenu'
import type { Tool } from '../../types/annotations'

const TOOLS: { id: Tool; label: string; icon: string }[] = [
  { id: 'select', label: 'Select / move', icon: '↖' },
  { id: 'text', label: 'Add text', icon: 'T' },
  { id: 'draw', label: 'Free draw', icon: '✎' },
  { id: 'tick', label: 'Tick', icon: '✓' },
  { id: 'cross', label: 'Cross', icon: '✗' },
  { id: 'rect', label: 'Rectangle', icon: '▭' }
]

const COLORS = [
  { hex: '#000000', name: 'Black' },
  { hex: '#dc2626', name: 'Red' },
  { hex: '#2563eb', name: 'Blue' },
  { hex: '#16a34a', name: 'Green' },
  { hex: '#eab308', name: 'Yellow' },
  { hex: '#9333ea', name: 'Purple' }
]

export default function Toolbar() {
  const tool = useAnnotationStore((s) => s.tool)
  const color = useAnnotationStore((s) => s.color)
  const strokeWidth = useAnnotationStore((s) => s.strokeWidth)
  const annotations = useAnnotationStore((s) => s.annotations)
  const selectedId = useAnnotationStore((s) => s.selectedId)
  const setTool = useAnnotationStore((s) => s.setTool)
  const setColor = useAnnotationStore((s) => s.setColor)
  const setStrokeWidth = useAnnotationStore((s) => s.setStrokeWidth)
  const undo = useAnnotationStore((s) => s.undo)
  const clearAll = useAnnotationStore((s) => s.clearAll)
  const remove = useAnnotationStore((s) => s.remove)

  const fontSize = useAnnotationStore((s) => s.fontSize)
  const setFontSize = useAnnotationStore((s) => s.setFontSize)

  const sourceBytes = usePdfStore((s) => s.sourceBytes)
  const fileName = usePdfStore((s) => s.fileName)
  const numPages = usePdfStore((s) => s.numPages)
  const pageNavOpen = usePdfStore((s) => s.pageNavOpen)
  const togglePageNav = usePdfStore((s) => s.togglePageNav)
  const [exporting, setExporting] = useState(false)

  const selectedAnnotation = annotations.find((a) => a.id === selectedId)
  const textSelected = selectedAnnotation?.type === 'text'

  // Mobile color popover
  const [colorPickerOpen, setColorPickerOpen] = useState(false)
  const colorPickerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!colorPickerOpen) return
    function onDoc(e: MouseEvent) {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setColorPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [colorPickerOpen])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return
      const t = document.activeElement?.tagName
      if (t === 'INPUT' || t === 'TEXTAREA') return
      if (!selectedId) return
      e.preventDefault()
      remove(selectedId)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedId, remove])

  async function onExport() {
    if (!sourceBytes || !fileName) return
    setExporting(true)
    try {
      const copy = sourceBytes.slice(0)
      await exportPdfWithAnnotations(copy, annotations, 1.4, fileName)
    } catch (e) {
      console.error(e)
      alert('Export failed: ' + (e as Error).message)
    } finally {
      setExporting(false)
    }
  }

  // --- DESKTOP TOOLBAR (top) -----------------------------------------------
  const desktop = (
    <div className="hidden md:flex flex-wrap items-center gap-1 px-3 py-2 bg-slate-800 text-white border-b border-slate-700">
      {TOOLS.map((t) => (
        <button
          key={t.id}
          onClick={() => setTool(t.id)}
          title={t.label}
          className={`w-10 h-10 rounded flex items-center justify-center text-lg font-semibold transition-colors ${
            tool === t.id ? 'bg-blue-600' : 'hover:bg-slate-700'
          }`}
        >
          {t.icon}
        </button>
      ))}

      <div className="w-px h-6 bg-slate-700 mx-2" />

      {COLORS.map((c) => (
        <button
          key={c.hex}
          onClick={() => setColor(c.hex)}
          title={c.name}
          className={`w-7 h-7 rounded-full border-2 transition-transform ${
            color === c.hex ? 'border-white scale-110' : 'border-slate-700 hover:scale-105'
          }`}
          style={{ backgroundColor: c.hex }}
        />
      ))}

      <div className="w-px h-6 bg-slate-700 mx-2" />

      <label className="flex items-center gap-2 text-xs text-slate-300">
        Stroke
        <input
          type="range"
          min={1}
          max={10}
          step={0.5}
          value={strokeWidth}
          onChange={(e) => setStrokeWidth(parseFloat(e.target.value))}
          className="w-20"
        />
      </label>

      <label className="flex items-center gap-2 text-xs text-slate-300">
        Text
        <input
          type="range"
          min={10}
          max={48}
          step={1}
          value={fontSize}
          onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
          className="w-20"
        />
        <span className="w-8 tabular-nums">{fontSize}px</span>
      </label>

      <div className="ml-auto flex items-center gap-2">
        {numPages > 1 && (
          <button
            onClick={togglePageNav}
            title="Show pages"
            className={`px-3 h-10 rounded text-sm font-medium ${
              pageNavOpen ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'
            }`}
          >
            ☰ Pages
          </button>
        )}
        {selectedId && (
          <button
            onClick={() => remove(selectedId)}
            title="Delete selected (Del)"
            className="px-3 h-10 rounded bg-red-600 hover:bg-red-500 text-sm font-medium"
          >
            Delete
          </button>
        )}
        <SignatureMenu />
        <button
          onClick={undo}
          disabled={annotations.length === 0}
          className="px-3 h-10 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
        >
          Undo
        </button>
        <button
          onClick={clearAll}
          disabled={annotations.length === 0}
          className="px-3 h-10 rounded bg-slate-700 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
        >
          Clear
        </button>
        <button
          onClick={onExport}
          disabled={!sourceBytes || exporting}
          className="px-4 h-10 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium"
        >
          {exporting ? 'Exporting…' : 'Export'}
        </button>
      </div>
    </div>
  )

  // --- MOBILE TOOLBAR (bottom, fixed) --------------------------------------
  const mobileBtn = (id: Tool, icon: string, label: string) => {
    const active = tool === id
    return (
      <button
        key={id}
        onClick={() => setTool(id)}
        className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 rounded transition-colors ${
          active ? 'text-blue-400' : 'text-slate-200'
        }`}
      >
        <span className="text-xl leading-none">{icon}</span>
        <span className="text-[10px] font-medium">{label}</span>
      </button>
    )
  }

  const mobile = (
    <div className="md:hidden">
      {/* Selection action bar (above the toolbar when something is selected) */}
      {selectedId && (
        <div className="fixed bottom-[68px] left-0 right-0 z-30 flex items-center justify-center gap-2 px-3 pb-2 pointer-events-none">
          {textSelected && (
            <div className="pointer-events-auto inline-flex items-center gap-1 bg-white rounded-full shadow-lg px-1 py-1">
              <button
                onClick={() => setFontSize(Math.max(10, fontSize - 2))}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-lg font-semibold text-slate-700"
                aria-label="Decrease text size"
              >
                −
              </button>
              <span className="text-xs font-medium w-10 text-center tabular-nums text-slate-700">
                {fontSize}px
              </span>
              <button
                onClick={() => setFontSize(Math.min(48, fontSize + 2))}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-lg font-semibold text-slate-700"
                aria-label="Increase text size"
              >
                +
              </button>
            </div>
          )}
          <button
            onClick={() => remove(selectedId)}
            className="pointer-events-auto px-4 py-2 rounded-full bg-red-600 text-white text-sm font-medium shadow-lg"
          >
            Delete
          </button>
        </div>
      )}

      {/* Color picker popover */}
      {colorPickerOpen && (
        <div
          ref={colorPickerRef}
          className="fixed bottom-[72px] left-1/2 -translate-x-1/2 z-40 bg-white rounded-2xl shadow-xl px-3 py-2 flex items-center gap-3"
        >
          {COLORS.map((c) => (
            <button
              key={c.hex}
              onClick={() => { setColor(c.hex); setColorPickerOpen(false) }}
              className={`w-9 h-9 rounded-full border-2 ${
                color === c.hex ? 'border-slate-900 scale-110' : 'border-slate-200'
              }`}
              style={{ backgroundColor: c.hex }}
              title={c.name}
            />
          ))}
        </div>
      )}

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-slate-900 border-t border-slate-700 flex items-stretch px-1"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {numPages > 1 ? (
          <button
            onClick={togglePageNav}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 ${
              pageNavOpen ? 'text-blue-400' : 'text-slate-200'
            }`}
          >
            <span className="text-xl leading-none">☰</span>
            <span className="text-[10px] font-medium">Pages</span>
          </button>
        ) : null}
        {mobileBtn('select', '↖', 'Select')}
        {mobileBtn('draw', '✎', 'Draw')}
        {mobileBtn('text', 'T', 'Text')}
        <div className="flex-1 h-full flex items-stretch">
          <SignatureMenu openUpward compact />
        </div>

        {/* Color */}
        <button
          onClick={() => setColorPickerOpen((o) => !o)}
          className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-slate-200"
        >
          <span
            className="w-6 h-6 rounded-full border-2 border-white/40"
            style={{ backgroundColor: color }}
          />
          <span className="text-[10px] font-medium">Color</span>
        </button>

        <button
          onClick={undo}
          disabled={annotations.length === 0}
          className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-slate-200 disabled:opacity-40"
        >
          <span className="text-xl leading-none">↶</span>
          <span className="text-[10px] font-medium">Undo</span>
        </button>

        <button
          onClick={onExport}
          disabled={!sourceBytes || exporting}
          className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="text-xl leading-none">⤓</span>
          <span className="text-[10px] font-medium">
            {exporting ? '…' : 'Save'}
          </span>
        </button>
      </nav>
    </div>
  )

  return (
    <>
      {desktop}
      {mobile}
    </>
  )
}
