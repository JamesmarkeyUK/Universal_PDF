import { useRef } from 'react'
import Toolbar from './components/Toolbar/Toolbar'
import PdfViewer from './components/Viewer/PdfViewer'
import SignaturePad from './components/Signature/SignaturePad'
import { usePdfStore } from './stores/pdfStore'

export default function App() {
  const inputRef = useRef<HTMLInputElement>(null)
  const loadFile = usePdfStore((s) => s.loadFile)
  const fileName = usePdfStore((s) => s.fileName)
  const doc = usePdfStore((s) => s.doc)
  const loading = usePdfStore((s) => s.loading)

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

  return (
    <div className="flex flex-col h-full bg-slate-100">
      <header className="flex items-center gap-3 px-4 py-2 bg-slate-900 text-white">
        <div className="font-semibold tracking-tight">Universal PDF</div>
        {fileName && (
          <span className="text-sm text-slate-300 truncate max-w-xs">{fileName}</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => inputRef.current?.click()}
            className="bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded text-sm font-medium"
          >
            {doc ? 'Open another' : 'Open PDF'}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            hidden
            onChange={onFile}
          />
        </div>
      </header>

      {doc && <Toolbar />}

      <main className="flex-1 min-h-0">
        {loading ? (
          <div className="h-full flex items-center justify-center text-slate-500">
            Loading PDF…
          </div>
        ) : doc ? (
          <PdfViewer />
        ) : (
          <div className="h-full flex items-center justify-center">
            <button
              onClick={() => inputRef.current?.click()}
              className="px-8 py-6 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
              <div className="text-3xl mb-2">📄</div>
              <div className="font-medium">Click to open a PDF</div>
              <div className="text-xs mt-1 opacity-70">Or drag-and-drop coming soon</div>
            </button>
          </div>
        )}
      </main>

      <SignaturePad />
    </div>
  )
}
