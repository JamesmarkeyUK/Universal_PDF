import { useEffect, useRef, useState } from 'react'
import { useAnnotationStore } from '../../stores/annotationStore'
import { usePdfStore } from '../../stores/pdfStore'
import { exportPdfWithAnnotations } from '../../lib/export'
import SignatureMenu from '../Signature/SignatureMenu'
import type { Tool } from '../../types/annotations'

const COLORS = [
  { hex: '#000000', name: 'Black' },
  { hex: '#ffffff', name: 'White' },
  { hex: '#dc2626', name: 'Red' },
  { hex: '#2563eb', name: 'Blue' },
  { hex: '#16a34a', name: 'Green' },
  { hex: '#eab308', name: 'Yellow' },
  { hex: '#9333ea', name: 'Purple' },
]

const DRAW_SHAPES: { id: Tool; icon: string; label: string }[] = [
  { id: 'tick', icon: '✓', label: 'Tick' },
  { id: 'cross', icon: '✗', label: 'Cross' },
  { id: 'rect', icon: '▭', label: 'Box' },
]

type Panel = 'text' | 'draw' | 'color' | null

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
  const setPreviewOpen = usePdfStore((s) => s.setPreviewOpen)
  const [exporting, setExporting] = useState(false)

  function onPreview() {
    if (!sourceBytes) return
    setPreviewOpen(true)
  }

  const selectedAnnotation = annotations.find((a) => a.id === selectedId)
  const textSelected = selectedAnnotation?.type === 'text'

  const [openPanel, setOpenPanel] = useState<Panel>(null)

  // Desktop group refs (wrap button + panel together for click-outside)
  const textGroupRef = useRef<HTMLDivElement>(null)
  const drawGroupRef = useRef<HTMLDivElement>(null)
  const colorGroupRef = useRef<HTMLDivElement>(null)
  // Mobile panel ref (the floating popover above the toolbar)
  const mobilePanelRef = useRef<HTMLDivElement>(null)

  function togglePanel(p: Panel) {
    setOpenPanel((prev) => (prev === p ? null : p))
  }

  useEffect(() => {
    if (!openPanel) return
    function onDoc(e: MouseEvent) {
      const refs = [textGroupRef, drawGroupRef, colorGroupRef, mobilePanelRef]
      const inside = refs.some((r) => r.current?.contains(e.target as Node))
      if (!inside) setOpenPanel(null)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [openPanel])

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

  const isDrawShape = (t: Tool) => t === 'tick' || t === 'cross' || t === 'rect'

  // Small "+" toggle button used on desktop
  function PlusBox({ panel }: { panel: Panel }) {
    return (
      <button
        onClick={() => togglePanel(panel)}
        className={`w-[14px] h-[14px] text-[9px] font-bold rounded-[3px] flex items-center justify-center transition-colors border self-start mt-[3px] -ml-[2px] leading-none ${
          openPanel === panel
            ? 'bg-orange-500 border-orange-400 text-white'
            : 'bg-slate-600 border-slate-500 text-slate-300 hover:bg-slate-500 hover:text-white'
        }`}
        title={`${openPanel === panel ? 'Close' : 'Open'} options`}
      >
        +
      </button>
    )
  }

  // Shared tool button style
  function toolBtn(id: Tool, icon: string, label: string, onClick?: () => void) {
    return (
      <button
        key={id}
        onClick={onClick ?? (() => setTool(id))}
        title={label}
        className={`w-10 h-10 rounded flex items-center justify-center text-lg font-semibold transition-colors ${
          tool === id ? 'bg-orange-600' : 'hover:bg-slate-700'
        }`}
      >
        {icon}
      </button>
    )
  }

  // Color swatch button
  function colorSwatch(hex: string, name: string, small = false) {
    const active = color === hex
    return (
      <button
        key={hex}
        onClick={() => setColor(hex)}
        title={name}
        className={`rounded-full border-2 transition-transform flex-shrink-0 ${
          small ? 'w-7 h-7' : 'w-8 h-8'
        } ${active ? 'border-white scale-110' : 'border-slate-600 hover:scale-105'}`}
        style={{ backgroundColor: hex }}
      />
    )
  }

  // Native colour picker trigger (rainbow circle)
  function ColorPickerTrigger() {
    const isCustom = !COLORS.some((c) => c.hex === color)
    return (
      <label
        title="Custom colour"
        className={`w-8 h-8 rounded-full cursor-pointer border-2 flex-shrink-0 overflow-hidden transition-transform ${
          isCustom ? 'border-white scale-110' : 'border-slate-600 hover:scale-105'
        }`}
        style={{
          background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)',
        }}
      >
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="sr-only"
        />
      </label>
    )
  }

  // --- DESKTOP TOOLBAR (top) -----------------------------------------------
  const desktop = (
    <div className="hidden md:flex flex-wrap items-center gap-1 px-3 py-2 bg-slate-800 text-white border-b border-slate-700">

      {/* Select */}
      {toolBtn('select', '↖', 'Select / move')}

      <div className="w-px h-6 bg-slate-700 mx-1" />

      {/* Text + font-size expander */}
      <div ref={textGroupRef} className="relative flex items-start">
        {toolBtn('text', 'T', 'Add text')}
        <PlusBox panel="text" />
        {openPanel === 'text' && (
          <div className="absolute top-full left-0 mt-1 z-50 bg-slate-800 border border-slate-600 rounded-lg shadow-xl px-3 py-2 flex items-center gap-3 whitespace-nowrap">
            <span className="text-xs text-slate-400">Size</span>
            <input
              type="range"
              min={10}
              max={48}
              step={1}
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
              className="w-28"
            />
            <span className="text-xs text-slate-300 w-9 tabular-nums text-right">{fontSize}px</span>
          </div>
        )}
      </div>

      <div className="w-px h-6 bg-slate-700 mx-1" />

      {/* Pencil + shapes + stroke expander */}
      <div ref={drawGroupRef} className="relative flex items-start">
        {toolBtn(
          'draw',
          '✎',
          'Free draw',
          () => { setTool('draw') }
        )}
        <PlusBox panel="draw" />
        {openPanel === 'draw' && (
          <div className="absolute top-full left-0 mt-1 z-50 bg-slate-800 border border-slate-600 rounded-lg shadow-xl px-3 py-2 flex items-center gap-2 whitespace-nowrap">
            {DRAW_SHAPES.map((s) => (
              <button
                key={s.id}
                onClick={() => setTool(s.id)}
                title={s.label}
                className={`w-9 h-9 rounded flex items-center justify-center text-lg font-semibold transition-colors ${
                  tool === s.id ? 'bg-orange-600' : 'hover:bg-slate-700'
                }`}
              >
                {s.icon}
              </button>
            ))}
            <div className="w-px h-6 bg-slate-600 mx-1" />
            <span className="text-xs text-slate-400">Stroke</span>
            <input
              type="range"
              min={1}
              max={10}
              step={0.5}
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(parseFloat(e.target.value))}
              className="w-20"
            />
          </div>
        )}
      </div>

      <div className="w-px h-6 bg-slate-700 mx-1" />

      {/* Colour: black + white shown inline, + opens full palette */}
      <div ref={colorGroupRef} className="relative flex items-start gap-1">
        <div className="flex items-center gap-1 self-center">
          {colorSwatch('#000000', 'Black', true)}
          {colorSwatch('#ffffff', 'White', true)}
        </div>
        <PlusBox panel="color" />
        {openPanel === 'color' && (
          <div className="absolute top-full left-0 mt-1 z-50 bg-slate-800 border border-slate-600 rounded-lg shadow-xl px-3 py-2 flex items-center gap-2 whitespace-nowrap">
            {COLORS.map((c) => colorSwatch(c.hex, c.name))}
            <div className="w-px h-6 bg-slate-600 mx-1" />
            <ColorPickerTrigger />
          </div>
        )}
      </div>

      {/* Right-side actions */}
      <div className="ml-auto flex items-center gap-2">
        {numPages > 1 && (
          <button
            onClick={togglePageNav}
            title="Show pages"
            className={`px-3 h-10 rounded text-sm font-medium ${
              pageNavOpen ? 'bg-orange-600' : 'bg-slate-700 hover:bg-slate-600'
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
          onClick={onPreview}
          disabled={!sourceBytes}
          className="px-3 h-10 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
          title="Preview the exported PDF"
        >
          Preview
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

  // Mobile expandable panel (floats above toolbar)
  const mobilePanelContent = (() => {
    if (openPanel === 'text') {
      return (
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">Size</span>
          <button
            onClick={() => setFontSize(Math.max(10, fontSize - 2))}
            className="w-8 h-8 rounded-full hover:bg-slate-100 text-lg font-semibold text-slate-700"
          >−</button>
          <span className="text-sm font-medium w-10 text-center tabular-nums text-slate-700">
            {fontSize}px
          </span>
          <button
            onClick={() => setFontSize(Math.min(48, fontSize + 2))}
            className="w-8 h-8 rounded-full hover:bg-slate-100 text-lg font-semibold text-slate-700"
          >+</button>
        </div>
      )
    }
    if (openPanel === 'draw') {
      return (
        <div className="flex items-center gap-2">
          {DRAW_SHAPES.map((s) => (
            <button
              key={s.id}
              onClick={() => { setTool(s.id) }}
              title={s.label}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl font-semibold transition-colors ${
                tool === s.id ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {s.icon}
            </button>
          ))}
          <div className="w-px h-7 bg-slate-200 mx-1" />
          <input
            type="range"
            min={1}
            max={10}
            step={0.5}
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(parseFloat(e.target.value))}
            className="w-24"
          />
        </div>
      )
    }
    if (openPanel === 'color') {
      return (
        <div className="flex items-center gap-3">
          {COLORS.map((c) => (
            <button
              key={c.hex}
              onClick={() => { setColor(c.hex); setOpenPanel(null) }}
              className={`w-9 h-9 rounded-full border-2 flex-shrink-0 transition-transform ${
                color === c.hex ? 'border-slate-900 scale-110' : 'border-slate-200 hover:scale-105'
              }`}
              style={{ backgroundColor: c.hex }}
              title={c.name}
            />
          ))}
          <div className="w-px h-7 bg-slate-200 mx-1" />
          <label
            title="Custom colour"
            className={`w-9 h-9 rounded-full cursor-pointer border-2 flex-shrink-0 overflow-hidden transition-transform ${
              !COLORS.some((c) => c.hex === color) ? 'border-slate-900 scale-110' : 'border-slate-200 hover:scale-105'
            }`}
            style={{ background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)' }}
          >
            <input
              type="color"
              value={color}
              onChange={(e) => { setColor(e.target.value) }}
              className="sr-only"
            />
          </label>
        </div>
      )
    }
    return null
  })()

  // Mobile toolbar button with optional "+" badge
  function mobileBtnWithPlus(
    id: Tool,
    icon: string,
    label: string,
    panel: Panel
  ) {
    const active = tool === id || (panel === 'draw' && isDrawShape(tool))
    return (
      <div className="flex flex-col items-center justify-center flex-1 h-full relative">
        <button
          onClick={() => setTool(id)}
          className={`flex flex-col items-center justify-center w-full h-full gap-0.5 rounded transition-colors ${
            active ? 'text-orange-400' : 'text-slate-200'
          }`}
        >
          <span className="text-xl leading-none">{icon}</span>
          <span className="text-[10px] font-medium">{label}</span>
        </button>
        <button
          onClick={() => togglePanel(panel)}
          className={`absolute top-1 right-1 w-[13px] h-[13px] text-[8px] font-bold rounded-[2px] flex items-center justify-center leading-none border ${
            openPanel === panel
              ? 'bg-orange-500 border-orange-400 text-white'
              : 'bg-slate-700 border-slate-600 text-slate-400'
          }`}
        >
          +
        </button>
      </div>
    )
  }

  const mobile = (
    <div className="md:hidden">
      {/* Selection action bar */}
      {selectedId && openPanel === null && (
        <div className="fixed bottom-[68px] left-0 right-0 z-30 flex items-center justify-center gap-2 px-3 pb-2 pointer-events-none">
          {textSelected && (
            <div className="pointer-events-auto inline-flex items-center gap-1 bg-white rounded-full shadow-lg px-1 py-1">
              <button
                onClick={() => setFontSize(Math.max(10, fontSize - 2))}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-lg font-semibold text-slate-700"
                aria-label="Decrease text size"
              >−</button>
              <span className="text-xs font-medium w-10 text-center tabular-nums text-slate-700">
                {fontSize}px
              </span>
              <button
                onClick={() => setFontSize(Math.min(48, fontSize + 2))}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-lg font-semibold text-slate-700"
                aria-label="Increase text size"
              >+</button>
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

      {/* Expandable panel above toolbar */}
      {openPanel !== null && mobilePanelContent && (
        <div
          ref={mobilePanelRef}
          className="fixed bottom-[68px] left-1/2 -translate-x-1/2 z-40 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-2 whitespace-nowrap"
        >
          {mobilePanelContent}
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
              pageNavOpen ? 'text-orange-400' : 'text-slate-200'
            }`}
          >
            <span className="text-xl leading-none">☰</span>
            <span className="text-[10px] font-medium">Pages</span>
          </button>
        ) : null}

        {/* Select */}
        <button
          onClick={() => setTool('select')}
          className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 rounded transition-colors ${
            tool === 'select' ? 'text-orange-400' : 'text-slate-200'
          }`}
        >
          <span className="text-xl leading-none">↖</span>
          <span className="text-[10px] font-medium">Select</span>
        </button>

        {/* Draw with + */}
        {mobileBtnWithPlus('draw', '✎', 'Draw', 'draw')}

        {/* Text with + */}
        {mobileBtnWithPlus('text', 'T', 'Text', 'text')}

        <div className="flex-1 h-full flex items-stretch">
          <SignatureMenu openUpward compact />
        </div>

        {/* Colour with + */}
        <div className="flex flex-col items-center justify-center flex-1 h-full relative">
          <button
            onClick={() => togglePanel('color')}
            className="flex flex-col items-center justify-center w-full h-full gap-0.5 text-slate-200"
          >
            <span
              className="w-6 h-6 rounded-full border-2 border-white/40"
              style={{ backgroundColor: color }}
            />
            <span className="text-[10px] font-medium">Color</span>
          </button>
          <button
            onClick={() => togglePanel('color')}
            className={`absolute top-1 right-1 w-[13px] h-[13px] text-[8px] font-bold rounded-[2px] flex items-center justify-center leading-none border ${
              openPanel === 'color'
                ? 'bg-orange-500 border-orange-400 text-white'
                : 'bg-slate-700 border-slate-600 text-slate-400'
            }`}
          >
            +
          </button>
        </div>

        <button
          onClick={undo}
          disabled={annotations.length === 0}
          className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-slate-200 disabled:opacity-40"
        >
          <span className="text-xl leading-none">↶</span>
          <span className="text-[10px] font-medium">Undo</span>
        </button>

        <button
          onClick={onPreview}
          disabled={!sourceBytes}
          className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-slate-200 disabled:opacity-40"
        >
          <span className="text-xl leading-none">◎</span>
          <span className="text-[10px] font-medium">Preview</span>
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
