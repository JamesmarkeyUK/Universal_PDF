import { useEffect, useRef, useState } from 'react'
import { usePdfStore } from '../../stores/pdfStore'
import PdfPage from './PdfPage'

const MIN_SCALE = 0.5
const MAX_SCALE = 3

export default function PdfViewer() {
  const doc = usePdfStore((s) => s.doc)
  const numPages = usePdfStore((s) => s.numPages)
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

      // Keep the PDF point originally under the pinch midpoint anchored to the
      // user's current fingers as they pinch and pan together.
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

  if (!doc) return null

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 border-b border-slate-200 text-sm text-slate-600">
        <span>{numPages} page{numPages !== 1 ? 's' : ''}</span>
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
      <div ref={scrollRef} className="flex-1 overflow-auto bg-slate-200">
        <div className="flex flex-col items-center gap-6 py-6 px-4">
          {Array.from({ length: numPages }, (_, i) => (
            <PdfPage key={i} doc={doc} pageIndex={i} scale={scale} />
          ))}
        </div>
      </div>
    </div>
  )
}
