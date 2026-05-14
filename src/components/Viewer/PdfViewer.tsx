import { useEffect, useRef, useState } from 'react'
import { usePdfStore } from '../../stores/pdfStore'
import { useAnnotationStore } from '../../stores/annotationStore'
import PdfPage from './PdfPage'

const MIN_SCALE = 0.5
const MAX_SCALE = 3

export default function PdfViewer() {
  const doc = usePdfStore((s) => s.doc)
  const numPages = usePdfStore((s) => s.numPages)
  const pageNavOpen = usePdfStore((s) => s.pageNavOpen)
  const togglePageNav = usePdfStore((s) => s.togglePageNav)
  const tool = useAnnotationStore((s) => s.tool)
  const [scale, setScale] = useState(1.4)

  // Keep a ref to the current scale so the long-lived touch handlers below
  // can read it without re-binding on every change.
  const scaleRef = useRef(scale)
  scaleRef.current = scale

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    interface Pinch {
      initialDist: number
      initialScale: number
      relX: number
      relY: number
      initialScrollLeft: number
      initialScrollTop: number
    }
    let pinch: Pinch | null = null

    function dist(t1: Touch, t2: Touch) {
      return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY)
    }

    function onStart(e: TouchEvent) {
      if (e.touches.length !== 2 || !el) return
      const [t1, t2] = [e.touches[0], e.touches[1]]
      const rect = el.getBoundingClientRect()
      pinch = {
        initialDist: dist(t1, t2),
        initialScale: scaleRef.current,
        relX: (t1.clientX + t2.clientX) / 2 - rect.left,
        relY: (t1.clientY + t2.clientY) / 2 - rect.top,
        initialScrollLeft: el.scrollLeft,
        initialScrollTop: el.scrollTop
      }
    }

    function onMove(e: TouchEvent) {
      if (!pinch || e.touches.length !== 2 || !el) return
      e.preventDefault()
      const [t1, t2] = [e.touches[0], e.touches[1]]
      const newScale = Math.max(
        MIN_SCALE,
        Math.min(MAX_SCALE, pinch.initialScale * (dist(t1, t2) / pinch.initialDist))
      )
      const ratio = newScale / pinch.initialScale
      const rect = el.getBoundingClientRect()
      const currentRelX = (t1.clientX + t2.clientX) / 2 - rect.left
      const currentRelY = (t1.clientY + t2.clientY) / 2 - rect.top

      const newScrollLeft = (pinch.initialScrollLeft + pinch.relX) * ratio - currentRelX
      const newScrollTop = (pinch.initialScrollTop + pinch.relY) * ratio - currentRelY

      setScale(newScale)
      requestAnimationFrame(() => {
        if (!el) return
        el.scrollLeft = newScrollLeft
        el.scrollTop = newScrollTop
      })
    }

    function onEnd() {
      pinch = null
    }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd)
    el.addEventListener('touchcancel', onEnd)
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
      el.removeEventListener('touchcancel', onEnd)
    }
  }, [])

  // Hand-tool drag-to-pan
  useEffect(() => {
    if (tool !== 'hand') return
    const el = scrollRef.current
    if (!el) return

    let dragging = false
    let startX = 0
    let startY = 0
    let startScrollLeft = 0
    let startScrollTop = 0

    function onDown(e: PointerEvent) {
      if (!el) return
      if (e.button !== 0 && e.pointerType === 'mouse') return
      dragging = true
      startX = e.clientX
      startY = e.clientY
      startScrollLeft = el.scrollLeft
      startScrollTop = el.scrollTop
      el.setPointerCapture(e.pointerId)
    }
    function onMove(e: PointerEvent) {
      if (!dragging || !el) return
      el.scrollLeft = startScrollLeft - (e.clientX - startX)
      el.scrollTop = startScrollTop - (e.clientY - startY)
    }
    function onUp(e: PointerEvent) {
      if (!el) return
      dragging = false
      try { el.releasePointerCapture(e.pointerId) } catch { /* noop */ }
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
    }
  }, [tool])

  if (!doc) return null

  const handCursor = tool === 'hand' ? 'grab' : undefined

  return (
    <div className="flex flex-col h-full">
      <div className="bg-slate-100 border-b border-slate-200">
        <div className="mx-auto w-full max-w-7xl flex items-center gap-2 px-4 py-1.5 text-sm text-slate-600">
          {numPages > 1 ? (
            <button
              onClick={togglePageNav}
              title="Show pages"
              className={`flex items-center gap-1.5 px-2.5 h-8 rounded text-sm font-medium transition-colors ${
                pageNavOpen
                  ? 'bg-orange-600 text-white hover:bg-orange-500'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span aria-hidden="true">☰</span>
              <span>Pages</span>
              <span className="opacity-70 tabular-nums">{numPages}</span>
            </button>
          ) : (
            <span className="px-1">{numPages} page</span>
          )}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setScale((s) => Math.max(MIN_SCALE, s - 0.2))}
              className="w-7 h-7 rounded bg-white border border-slate-300 hover:bg-slate-50"
              aria-label="Zoom out"
            >
              −
            </button>
            <span className="w-12 text-center tabular-nums">{Math.round(scale * 100)}%</span>
            <button
              onClick={() => setScale((s) => Math.min(MAX_SCALE, s + 0.2))}
              className="w-7 h-7 rounded bg-white border border-slate-300 hover:bg-slate-50"
              aria-label="Zoom in"
            >
              +
            </button>
          </div>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto bg-slate-200"
        style={{ cursor: handCursor }}
      >
        <div className="flex flex-col items-center gap-6 py-6 px-4">
          {Array.from({ length: numPages }, (_, i) => (
            <PdfPage key={i} doc={doc} pageIndex={i} scale={scale} />
          ))}
        </div>
      </div>
    </div>
  )
}
