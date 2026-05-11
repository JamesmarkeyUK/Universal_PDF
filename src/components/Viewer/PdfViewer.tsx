import { useState } from 'react'
import { usePdfStore } from '../../stores/pdfStore'
import PdfPage from './PdfPage'

export default function PdfViewer() {
  const doc = usePdfStore((s) => s.doc)
  const numPages = usePdfStore((s) => s.numPages)
  const [scale, setScale] = useState(1.4)

  if (!doc) return null

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 border-b border-slate-200 text-sm text-slate-600">
        <span>{numPages} page{numPages !== 1 ? 's' : ''}</span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}
            className="w-7 h-7 rounded bg-white border border-slate-300 hover:bg-slate-50"
          >
            −
          </button>
          <span className="w-12 text-center tabular-nums">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale((s) => Math.min(3, s + 0.2))}
            className="w-7 h-7 rounded bg-white border border-slate-300 hover:bg-slate-50"
          >
            +
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-slate-200">
        <div className="flex flex-col items-center gap-6 py-6 px-4">
          {Array.from({ length: numPages }, (_, i) => (
            <PdfPage key={i} doc={doc} pageIndex={i} scale={scale} />
          ))}
        </div>
      </div>
    </div>
  )
}
