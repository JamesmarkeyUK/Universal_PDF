import { downloadPdfBytes, type CompressResult } from '../../lib/export'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

interface Props {
  result: CompressResult
  onClose: () => void
  discardLabel?: string
}

export default function CompressResultModal({ result, onClose, discardLabel = 'Discard' }: Props) {
  const saved = result.originalSize - result.compressedSize
  const pct = result.originalSize > 0 ? (saved / result.originalSize) * 100 : 0
  const didShrink = saved > 0

  function download() {
    downloadPdfBytes(result.bytes, result.fileName)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl p-5 w-full max-w-md">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-900">Compression result</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-700 text-2xl leading-none w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-2 divide-x divide-slate-200">
            <div className="p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500 font-medium">Original</div>
              <div className="mt-1 text-xl font-semibold text-slate-900 tabular-nums">
                {formatSize(result.originalSize)}
              </div>
            </div>
            <div className="p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500 font-medium">Compressed</div>
              <div className="mt-1 text-xl font-semibold text-slate-900 tabular-nums">
                {formatSize(result.compressedSize)}
              </div>
            </div>
          </div>
          <div
            className={[
              'px-4 py-2.5 text-sm font-medium border-t border-slate-200',
              didShrink ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-600'
            ].join(' ')}
          >
            {didShrink
              ? `Saved ${formatSize(saved)} (${pct.toFixed(1)}%)`
              : 'Already optimised — no further savings possible.'}
          </div>
        </div>

        <div className="mt-4 text-xs text-slate-500 truncate" title={result.fileName}>
          Output: <span className="font-mono">{result.fileName}</span>
        </div>

        <div className="mt-5 flex items-center gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded text-sm font-medium text-slate-700"
          >
            {discardLabel}
          </button>
          <button
            onClick={download}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded text-sm font-medium"
          >
            ⬇ Download
          </button>
        </div>
      </div>
    </div>
  )
}
