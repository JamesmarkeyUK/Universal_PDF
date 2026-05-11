import { useState } from 'react'
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
  const setTool = useAnnotationStore((s) => s.setTool)
  const setColor = useAnnotationStore((s) => s.setColor)
  const setStrokeWidth = useAnnotationStore((s) => s.setStrokeWidth)
  const undo = useAnnotationStore((s) => s.undo)
  const clearAll = useAnnotationStore((s) => s.clearAll)

  const sourceBytes = usePdfStore((s) => s.sourceBytes)
  const fileName = usePdfStore((s) => s.fileName)
  const [exporting, setExporting] = useState(false)

  async function onExport() {
    if (!sourceBytes || !fileName) return
    setExporting(true)
    try {
      // sourceBytes is reused across exports; clone so pdf-lib doesn't consume it
      const copy = sourceBytes.slice(0)
      await exportPdfWithAnnotations(copy, annotations, 1.4, fileName)
    } catch (e) {
      console.error(e)
      alert('Export failed: ' + (e as Error).message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1 px-3 py-2 bg-slate-800 text-white border-b border-slate-700">
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

      <div className="ml-auto flex items-center gap-2">
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
}
