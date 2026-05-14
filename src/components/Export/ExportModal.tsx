import { useEffect, useRef, useState } from 'react'
import { usePdfStore } from '../../stores/pdfStore'
import { useAnnotationStore } from '../../stores/annotationStore'
import { useFormStore } from '../../stores/formStore'
import { buildAnnotatedPdfBytes, compressPdf, downloadPdfBytes } from '../../lib/export'

const EXPORT_SCALE = 1.4

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

function printBytes(bytes: Uint8Array) {
  const blob = new Blob([bytes.slice() as BlobPart], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  iframe.src = url
  iframe.onload = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
      } catch (err) {
        console.error(err)
        window.open(url, '_blank')
      }
    }, 50)
  }
  document.body.appendChild(iframe)
  setTimeout(() => {
    URL.revokeObjectURL(url)
    iframe.remove()
  }, 60_000)
}

interface Props {
  open: boolean
  onClose: () => void
}

export default function ExportModal({ open, onClose }: Props) {
  const sourceBytes = usePdfStore((s) => s.sourceBytes)
  const fileName = usePdfStore((s) => s.fileName)
  const setPreviewOpen = usePdfStore((s) => s.setPreviewOpen)
  const annotations = useAnnotationStore((s) => s.annotations)
  const formValues = useFormStore((s) => s.values)

  const [annotated, setAnnotated] = useState<Uint8Array | null>(null)
  const [compressed, setCompressed] = useState<Uint8Array | null>(null)
  const [building, setBuilding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const buildIdRef = useRef(0)

  useEffect(() => {
    if (!open || !sourceBytes) return
    const myId = ++buildIdRef.current
    setAnnotated(null)
    setCompressed(null)
    setError(null)
    setBuilding(true)
    ;(async () => {
      try {
        const copy = sourceBytes.slice(0)
        const annot = await buildAnnotatedPdfBytes(copy, annotations, EXPORT_SCALE, formValues)
        if (myId !== buildIdRef.current) return
        setAnnotated(annot)
        const annotBuf = annot.slice().buffer
        const comp = await compressPdf(annotBuf, fileName ?? 'document.pdf')
        if (myId !== buildIdRef.current) return
        setCompressed(comp.bytes)
      } catch (e) {
        if (myId !== buildIdRef.current) return
        setError((e as Error).message || 'Export failed')
      } finally {
        if (myId === buildIdRef.current) setBuilding(false)
      }
    })()
  }, [open, sourceBytes, annotations, formValues, fileName])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const ready = !building && annotated && compressed
  const origSize = annotated?.byteLength ?? 0
  const compSize = compressed?.byteLength ?? 0
  const saved = origSize - compSize
  const pct = origSize > 0 ? (saved / origSize) * 100 : 0
  const didShrink = saved > 0

  const outNameBase = (fileName ?? 'document.pdf').replace(/\.pdf$/i, '')
  const originalName = `${outNameBase}-annotated.pdf`
  const compressedName = `${outNameBase}-annotated-compressed.pdf`

  function download(which: 'original' | 'compressed') {
    if (!annotated || !compressed) return
    if (which === 'original') {
      downloadPdfBytes(annotated.slice(), originalName)
    } else {
      downloadPdfBytes(compressed.slice(), compressedName)
    }
    onClose()
  }

  function openPrintPreview() {
    setPreviewOpen(true)
    onClose()
  }

  function doPrint() {
    if (!annotated) return
    printBytes(annotated)
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl p-5 w-full max-w-lg">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-900">Export PDF</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-700 text-2xl leading-none w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        {error ? (
          <div className="text-sm text-red-600">Export failed: {error}</div>
        ) : (
          <>
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <div className="grid grid-cols-2 divide-x divide-slate-200">
                <div className="p-4">
                  <div className="text-xs uppercase tracking-wide text-slate-500 font-medium">Original</div>
                  <div className="mt-1 text-xl font-semibold text-slate-900 tabular-nums">
                    {building || !annotated ? '…' : formatSize(origSize)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">annotations baked in</div>
                </div>
                <div className="p-4">
                  <div className="text-xs uppercase tracking-wide text-slate-500 font-medium">Compressed</div>
                  <div className="mt-1 text-xl font-semibold text-slate-900 tabular-nums">
                    {building || !compressed ? '…' : formatSize(compSize)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">object-stream re-save</div>
                </div>
              </div>
              <div
                className={[
                  'px-4 py-2 text-sm font-medium border-t border-slate-200',
                  ready && didShrink
                    ? 'bg-emerald-50 text-emerald-700'
                    : ready
                      ? 'bg-slate-50 text-slate-600'
                      : 'bg-slate-50 text-slate-400'
                ].join(' ')}
              >
                {!ready
                  ? 'Building export…'
                  : didShrink
                    ? `Saved ${formatSize(saved)} (${pct.toFixed(1)}%)`
                    : 'Already optimised — no further savings possible.'}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                onClick={openPrintPreview}
                disabled={!ready}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm font-medium text-slate-700 flex items-center gap-1.5"
              >
                <span aria-hidden="true">◎</span>
                Print Preview…
              </button>
              <button
                onClick={doPrint}
                disabled={!ready}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm font-medium text-slate-700 flex items-center gap-1.5"
              >
                <span aria-hidden="true">🖨</span>
                Print
              </button>
            </div>

            <div className="mt-5 border-t border-slate-200 pt-4">
              <div className="text-xs uppercase tracking-wide text-slate-500 font-medium mb-2">Download</div>
              <div className="grid sm:grid-cols-2 gap-2">
                <button
                  onClick={() => download('original')}
                  disabled={!ready}
                  className="px-4 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium text-left"
                >
                  <div>⬇ Original</div>
                  <div className="text-[11px] opacity-70 tabular-nums">
                    {ready ? formatSize(origSize) : '…'}
                  </div>
                </button>
                <button
                  onClick={() => download('compressed')}
                  disabled={!ready || !didShrink}
                  title={ready && !didShrink ? 'Already optimised — same size as Original' : undefined}
                  className="px-4 py-3 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium text-left"
                >
                  <div>⬇ Compressed</div>
                  <div className="text-[11px] opacity-90 tabular-nums">
                    {!ready
                      ? '…'
                      : didShrink
                        ? `${formatSize(compSize)} · −${pct.toFixed(0)}%`
                        : 'No further savings'}
                  </div>
                </button>
              </div>
            </div>
          </>
        )}

        <div className="mt-5 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded text-sm font-medium text-slate-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
