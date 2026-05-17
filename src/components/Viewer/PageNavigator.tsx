import { useEffect, useState } from 'react'
import { usePdfStore } from '../../stores/pdfStore'

const THUMB_SCALE = 0.22

type DropPosition = 'before' | 'after'

export default function PageNavigator() {
  const doc = usePdfStore((s) => s.doc)
  const numPages = usePdfStore((s) => s.numPages)
  const open = usePdfStore((s) => s.pageNavOpen)
  const setOpen = usePdfStore((s) => s.setPageNavOpen)
  const deletePage = usePdfStore((s) => s.deletePage)
  const movePage = usePdfStore((s) => s.movePage)

  const [thumbs, setThumbs] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dropTarget, setDropTarget] = useState<{ index: number; pos: DropPosition } | null>(null)

  // Rebuild thumbnails whenever the doc identity or page count changes (a
  // delete/reorder swaps the underlying PDFDocumentProxy).
  useEffect(() => {
    if (!doc) {
      setThumbs([])
      return
    }
    // Drop stale thumbs so a delete/reorder doesn't briefly render old
    // images in their previous slots before the new doc finishes rendering.
    setThumbs([])
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
    if (window.matchMedia('(max-width: 767px)').matches) {
      setOpen(false)
    }
  }

  async function handleDelete(i: number) {
    if (busy || numPages <= 1) return
    const ok = window.confirm(
      `Delete page ${i + 1}? Any annotations on this page will also be removed.`
    )
    if (!ok) return
    setBusy(true)
    try {
      await deletePage(i)
    } catch (err) {
      console.error(err)
      alert('Failed to delete page')
    } finally {
      setBusy(false)
    }
  }

  async function handleMove(from: number, to: number) {
    if (busy || from === to) return
    setBusy(true)
    try {
      await movePage(from, to)
    } catch (err) {
      console.error(err)
      alert('Failed to reorder page')
    } finally {
      setBusy(false)
    }
  }

  function onDragStart(e: React.DragEvent, i: number) {
    if (busy) {
      e.preventDefault()
      return
    }
    setDragIndex(i)
    e.dataTransfer.effectAllowed = 'move'
    // Required for Firefox to allow drag.
    e.dataTransfer.setData('text/plain', String(i))
  }

  function onDragOver(e: React.DragEvent, i: number) {
    if (dragIndex === null) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const pos: DropPosition = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
    setDropTarget((prev) => (prev?.index === i && prev.pos === pos ? prev : { index: i, pos }))
  }

  function onDrop(e: React.DragEvent) {
    if (dragIndex === null || !dropTarget) {
      setDragIndex(null)
      setDropTarget(null)
      return
    }
    e.preventDefault()
    const from = dragIndex
    let to = dropTarget.pos === 'after' ? dropTarget.index + 1 : dropTarget.index
    // Account for the source slot disappearing when we splice it out: anything
    // landing past the original index needs to slide back by one.
    if (from < to) to -= 1
    setDragIndex(null)
    setDropTarget(null)
    if (from !== to) handleMove(from, to)
  }

  function onDragEnd() {
    setDragIndex(null)
    setDropTarget(null)
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
          md:right-auto md:left-0 md:top-[104px] md:bottom-0 md:w-56 md:max-h-none
          md:rounded-none md:border-t-0 md:border-r md:border-slate-200"
      >
        <div className="sticky top-0 bg-white border-b border-slate-100 px-3 py-2 flex items-center justify-between z-10">
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
        <div
          className="p-2 flex flex-col gap-2"
          onDragLeave={(e) => {
            // Only clear when leaving the whole strip, not when crossing children.
            const next = e.relatedTarget as Node | null
            if (next && (e.currentTarget as Node).contains(next)) return
            setDropTarget(null)
          }}
        >
          {Array.from({ length: numPages }, (_, i) => (
            <PageThumb
              key={i}
              index={i}
              total={numPages}
              thumb={thumbs[i]}
              busy={busy}
              dragging={dragIndex === i}
              dropIndicator={
                dropTarget && dropTarget.index === i ? dropTarget.pos : null
              }
              onClick={() => scrollToPage(i)}
              onDelete={() => handleDelete(i)}
              onMoveUp={() => handleMove(i, i - 1)}
              onMoveDown={() => handleMove(i, i + 1)}
              onDragStart={(e) => onDragStart(e, i)}
              onDragOver={(e) => onDragOver(e, i)}
              onDrop={onDrop}
              onDragEnd={onDragEnd}
            />
          ))}
        </div>
      </aside>
    </>
  )
}

interface ThumbProps {
  index: number
  total: number
  thumb?: string
  busy: boolean
  dragging: boolean
  dropIndicator: DropPosition | null
  onClick: () => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onDragStart: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onDragEnd: () => void
}

function PageThumb({
  index,
  total,
  thumb,
  busy,
  dragging,
  dropIndicator,
  onClick,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd
}: ThumbProps) {
  const canDelete = total > 1 && !busy
  const canMoveUp = index > 0 && !busy
  const canMoveDown = index < total - 1 && !busy

  // Stop click-through on action buttons so they don't also scroll the document.
  function actionHandler(fn: () => void) {
    return (e: React.MouseEvent) => {
      e.stopPropagation()
      fn()
    }
  }

  return (
    <div
      className={`relative group ${dragging ? 'opacity-40' : ''}`}
      draggable={!busy}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      style={{ cursor: busy ? 'wait' : 'grab' }}
      title="Drag to reorder"
    >
      {dropIndicator === 'before' && (
        <div className="absolute left-1 right-1 -top-1 h-0.5 bg-orange-500 rounded pointer-events-none z-10" />
      )}
      {dropIndicator === 'after' && (
        <div className="absolute left-1 right-1 -bottom-1 h-0.5 bg-orange-500 rounded pointer-events-none z-10" />
      )}
      <button
        type="button"
        onClick={onClick}
        className="w-full flex flex-col items-center gap-1 rounded-md p-1.5 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors"
      >
        {thumb ? (
          <img
            src={thumb}
            alt={`Page ${index + 1}`}
            className="block w-full max-w-[180px] shadow-sm border border-slate-200"
            draggable={false}
          />
        ) : (
          <div className="w-full max-w-[180px] aspect-[1/1.41] bg-slate-100 animate-pulse rounded" />
        )}
        <span className="text-xs text-slate-500">Page {index + 1}</span>
      </button>

      {/* Action overlay — always visible so the controls are discoverable. */}
      <div className="absolute top-2 right-2 flex flex-col gap-1 z-20">
        <button
          type="button"
          onClick={actionHandler(onDelete)}
          disabled={!canDelete}
          title="Delete page"
          aria-label={`Delete page ${index + 1}`}
          className="w-6 h-6 rounded-full bg-white text-red-600 hover:bg-red-600 hover:text-white border border-slate-300 shadow text-xs leading-none flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ✕
        </button>
      </div>
      <div className="absolute top-2 left-2 flex flex-col gap-1 z-20">
        <button
          type="button"
          onClick={actionHandler(onMoveUp)}
          disabled={!canMoveUp}
          title="Move page up"
          aria-label={`Move page ${index + 1} up`}
          className="w-6 h-6 rounded-full bg-white text-slate-700 hover:bg-slate-700 hover:text-white border border-slate-300 shadow text-xs leading-none flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={actionHandler(onMoveDown)}
          disabled={!canMoveDown}
          title="Move page down"
          aria-label={`Move page ${index + 1} down`}
          className="w-6 h-6 rounded-full bg-white text-slate-700 hover:bg-slate-700 hover:text-white border border-slate-300 shadow text-xs leading-none flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ↓
        </button>
      </div>
    </div>
  )
}
