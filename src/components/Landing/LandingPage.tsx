import { useRef, useState } from 'react'
import { usePdfStore } from '../../stores/pdfStore'
import { createBlankPdfFile, type PageSize } from '../../lib/blank'
import { createExamplePdfFile } from '../../lib/examplePdf'
import { compressPdf, type CompressResult } from '../../lib/export'
import CompressResultModal from '../Compress/CompressResultModal'
import RecentFilesList from '../RecentFiles/RecentFilesList'
import PdfIllustration from './PdfIllustration'

const SIZES: PageSize[] = ['A3', 'A4', 'A5']

const SIZE_INFO: Record<PageSize, string> = {
  A3: '297 × 420 mm',
  A4: '210 × 297 mm',
  A5: '148 × 210 mm'
}

export default function LandingPage() {
  const inputRef = useRef<HTMLInputElement>(null)
  const compressInputRef = useRef<HTMLInputElement>(null)
  const loadFile = usePdfStore((s) => s.loadFile)
  const [size, setSize] = useState<PageSize>('A4')
  const [creating, setCreating] = useState(false)
  const [opening, setOpening] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const [compressResult, setCompressResult] = useState<CompressResult | null>(null)
  const [dragOverCompress, setDragOverCompress] = useState(false)

  async function runCompress(file: File) {
    if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) {
      alert('Please choose a PDF file.')
      return
    }
    setCompressing(true)
    try {
      const buf = await file.arrayBuffer()
      const result = await compressPdf(buf, file.name)
      setCompressResult(result)
    } catch (err) {
      console.error(err)
      alert('Compression failed: ' + (err as Error).message)
    } finally {
      setCompressing(false)
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      try {
        await loadFile(file)
      } catch (err) {
        console.error(err)
        alert('Failed to load PDF')
      }
    }
    e.target.value = ''
  }

  async function createBlank() {
    if (creating) return
    setCreating(true)
    try {
      const file = await createBlankPdfFile(size)
      await loadFile(file)
    } catch (err) {
      console.error(err)
      alert('Failed to create PDF')
    } finally {
      setCreating(false)
    }
  }

  async function openExample() {
    if (opening) return
    setOpening(true)
    try {
      const file = await createExamplePdfFile()
      await loadFile(file)
    } catch (err) {
      console.error(err)
      alert('Failed to open example')
    } finally {
      setOpening(false)
    }
  }

  async function onCompressFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) await runCompress(file)
  }

  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-14">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left: animated PDF illustration */}
          <div className="flex flex-col items-center lg:items-start gap-4 order-2 lg:order-1">
            <PdfIllustration />
            <button
              type="button"
              onClick={openExample}
              disabled={opening}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white text-slate-900 border border-slate-200 shadow-sm hover:border-orange-400 hover:text-orange-700 hover:shadow transition-all disabled:opacity-60 disabled:cursor-wait"
            >
              <span aria-hidden="true">👁</span>
              <span className="font-medium text-sm">
                {opening ? 'Opening example…' : 'View PDF example'}
              </span>
              <span className="text-xs text-slate-400">
                form · image · signature · annotations
              </span>
            </button>
          </div>

          {/* Right: open / create card */}
          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-medium ring-1 ring-orange-200 mb-4">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-500" />
              Free · No upload · Works offline
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-slate-900">
              PDFs that <span className="text-orange-600">just work</span>.
            </h1>
            <p className="mt-3 text-slate-600 max-w-md">
              View, annotate, sign and export — everything stays on your device. Open a file or start a fresh page.
            </p>

            <div className="mt-7 bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6">
              {/* Open existing */}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="group w-full flex items-center gap-4 p-4 border-2 border-dashed border-slate-300 rounded-xl text-left hover:border-orange-500 hover:bg-orange-50/50 transition-colors"
              >
                <div className="shrink-0 w-12 h-12 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                  📄
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900">Open a PDF</div>
                  <div className="text-sm text-slate-500">Click to choose, or drop a file anywhere</div>
                </div>
                <span className="ml-auto text-slate-400 group-hover:text-orange-600 transition-colors" aria-hidden="true">
                  →
                </span>
              </button>
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf"
                hidden
                onChange={onFile}
              />

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs uppercase tracking-wide text-slate-400 font-medium">or</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Create new */}
              <div>
                <div className="flex items-baseline justify-between mb-2">
                  <div className="font-semibold text-slate-900">Create new</div>
                  <div className="text-xs text-slate-500">{SIZE_INFO[size]}</div>
                </div>
                <div role="radiogroup" aria-label="Page size" className="grid grid-cols-3 gap-2 mb-3">
                  {SIZES.map((s) => {
                    const selected = s === size
                    return (
                      <button
                        key={s}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setSize(s)}
                        className={[
                          'relative px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors',
                          selected
                            ? 'bg-orange-600 text-white border-orange-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-orange-300 hover:bg-orange-50'
                        ].join(' ')}
                      >
                        {s}
                        {s === 'A4' && (
                          <span
                            className={[
                              'absolute -top-1.5 -right-1.5 text-[10px] leading-none px-1.5 py-0.5 rounded-full ring-1',
                              selected
                                ? 'bg-white text-orange-700 ring-white'
                                : 'bg-orange-100 text-orange-700 ring-orange-200'
                            ].join(' ')}
                          >
                            default
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
                <button
                  type="button"
                  onClick={createBlank}
                  disabled={creating}
                  className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-60 disabled:cursor-wait text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  {creating ? (
                    <>Creating…</>
                  ) : (
                    <>
                      <span aria-hidden="true">＋</span>
                      Create blank {size}
                    </>
                  )}
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs uppercase tracking-wide text-slate-400 font-medium">or</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Compress */}
              <button
                type="button"
                onClick={() => compressInputRef.current?.click()}
                disabled={compressing}
                onDragEnter={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setDragOverCompress(true)
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (!dragOverCompress) setDragOverCompress(true)
                }}
                onDragLeave={(e) => {
                  e.stopPropagation()
                  setDragOverCompress(false)
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setDragOverCompress(false)
                  const file = e.dataTransfer.files?.[0]
                  if (file) runCompress(file)
                }}
                className={[
                  'group w-full flex items-center gap-4 p-4 border rounded-xl text-left transition-colors disabled:opacity-60 disabled:cursor-wait',
                  dragOverCompress
                    ? 'border-amber-500 bg-amber-50 border-dashed border-2'
                    : 'border-slate-200 hover:border-amber-400 hover:bg-amber-50/50'
                ].join(' ')}
              >
                <div className="shrink-0 w-12 h-12 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-2xl">
                  ⬇
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900">
                    {compressing ? 'Compressing…' : dragOverCompress ? 'Drop to compress' : 'Compress a PDF'}
                  </div>
                  <div className="text-sm text-slate-500">
                    Drop a file or click — see original vs compressed
                  </div>
                </div>
                <span className="ml-auto text-slate-400 group-hover:text-amber-700 transition-colors" aria-hidden="true">
                  →
                </span>
              </button>
              <input
                ref={compressInputRef}
                type="file"
                accept="application/pdf"
                hidden
                onChange={onCompressFile}
              />
            </div>

            <RecentFilesList />
          </div>
        </div>
      </div>

      {compressResult && (
        <CompressResultModal
          result={compressResult}
          onClose={() => setCompressResult(null)}
          discardLabel="Discard"
        />
      )}
    </div>
  )
}
