import { useEffect, useState } from 'react'
import { usePdfStore } from '../../stores/pdfStore'

const THUMB_SCALE = 0.22

export default function PageNavigator() {
  const doc = usePdfStore((s) => s.doc)
  const numPages = usePdfStore((s) => s.numPages)
  const open = usePdfStore((s) => s.pageNavOpen)
  const setOpen = usePdfStore((s) => s.setPageNavOpen)

  const [thumbs, setThumbs] = useState<string[]>([])

  useEffect(() => {
    if (!doc) {
      setThumbs([])
      return
    }
    let cancelled = false
    const acc: string[] = []
    async function go() {
      for (let i = 1; i <= numPages; i++) {
        if (cancelled || !doc) return
        try {
          const page = await doc.getPage(i)
          const viewport = page.getViewport({ scale: THUMB_SCALE })
          const canvas = document.createElement('canvas')
          canvas.width = viewport.width
          canvas.height = viewport.height
          const ctx = canvas.getContext('2d')
          if (!ctx) continue
          await page.render({ canvasContext: ctx, viewport }).promise
          if (cancelled) return
          acc.push(canvas.toDataURL('image/jpeg', 0.6))
          setThumbs([...acc])
        } catch {
          // ignore individual page failures
        }
      }
    }
    go()
    return () => {
      cancelled = true
    }
  }, [doc, numPages])

  if (!doc || !open) return null

  function scrollToPage(i: number) {
    const el = document.querySelector(`[data-page-index="${i}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    // Close on mobile after navigation; keep open on desktop.
    if (window.matchMedia('(max-width: 767px)').matches) {
      setOpen(false)
    }
  }

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="md:hidden fixed inset-0 bg-black/30 z-30"
        onClick={() => setOpen(false)}
      />
      <aside
        className="fixed z-40 bg-white shadow-2xl overflow-y-auto
          left-0 right-0 bottom-16 max-h-[55vh] rounded-t-2xl border-t border-slate-200
          md:left-auto md:right-0 md:top-[104px] md:bottom-0 md:w-56 md:max-h-none
          md:rounded-none md:border-t-0 md:border-l md:border-slate-200"
      >
        <div className="sticky top-0 bg-white border-b border-slate-100 px-3 py-2 flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Pages
          </div>
          <button
            onClick={() => setOpen(false)}
            className="md:hidden text-slate-400 hover:text-slate-700 w-7 h-7"
            aria-label="Close pages"
          >
            ✕
          </button>
        </div>
        <div className="p-2 flex flex-col gap-2">
          {Array.from({ length: numPages }, (_, i) => (
            <button
              key={i}
              onClick={() => scrollToPage(i)}
              className="flex flex-col items-center gap-1 rounded-md p-1.5 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors"
            >
              {thumbs[i] ? (
                <img
                  src={thumbs[i]}
                  alt={`Page ${i + 1}`}
                  className="block w-full max-w-[180px] shadow-sm border border-slate-200"
                />
              ) : (
                <div className="w-full max-w-[180px] aspect-[1/1.41] bg-slate-100 animate-pulse rounded" />
              )}
              <span className="text-xs text-slate-500">Page {i + 1}</span>
            </button>
          ))}
        </div>
      </aside>
    </>
  )
}
