import { useEffect, useRef, useState } from 'react'
import Toolbar from './components/Toolbar/Toolbar'
import PdfViewer from './components/Viewer/PdfViewer'
import PageNavigator from './components/Viewer/PageNavigator'
import SignaturePad from './components/Signature/SignaturePad'
import StampPicker from './components/Signature/StampPicker'
import EmailVerifyModal from './components/Signature/EmailVerifyModal'
import AIToolsPanel from './components/AI/AIToolsPanel'
import RecentFilesList from './components/RecentFiles/RecentFilesList'
import LivePreview from './components/Preview/LivePreview'
import { usePdfStore } from './stores/pdfStore'
import { useSignatureStore } from './stores/signatureStore'

function isPdfFile(file: File) {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
}

export default function App() {
  const inputRef = useRef<HTMLInputElement>(null)
  const loadFile = usePdfStore((s) => s.loadFile)
  const fileName = usePdfStore((s) => s.fileName)
  const doc = usePdfStore((s) => s.doc)
  const loading = usePdfStore((s) => s.loading)
  const refreshRecents = usePdfStore((s) => s.refreshRecents)

  const stampPickerOpen = useSignatureStore((s) => s.stampPickerOpen)
  const emailVerifyOpen = useSignatureStore((s) => s.emailVerifyOpen)

  const [aiOpen, setAiOpen] = useState(false)

  useEffect(() => {
    refreshRecents()
  }, [refreshRecents])

  const [dragOver, setDragOver] = useState(false)
  const dragCounter = useRef(0)

  useEffect(() => {
    function onEnter(e: DragEvent) {
      if (!e.dataTransfer?.types.includes('Files')) return
      e.preventDefault()
      dragCounter.current++
      setDragOver(true)
    }
    function onOver(e: DragEvent) {
      if (!e.dataTransfer?.types.includes('Files')) return
      e.preventDefault()
    }
    function onLeave(e: DragEvent) {
      e.preventDefault()
      dragCounter.current = Math.max(0, dragCounter.current - 1)
      if (dragCounter.current === 0) setDragOver(false)
    }
    async function onDrop(e: DragEvent) {
      e.preventDefault()
      dragCounter.current = 0
      setDragOver(false)
      const file = e.dataTransfer?.files?.[0]
      if (!file) return
      if (!isPdfFile(file)) {
        alert('Please drop a PDF file.')
        return
      }
      try {
        await loadFile(file)
      } catch (err) {
        console.error(err)
        alert('Failed to load PDF')
      }
    }
    window.addEventListener('dragenter', onEnter)
    window.addEventListener('dragover', onOver)
    window.addEventListener('dragleave', onLeave)
    window.addEventListener('drop', onDrop)
    return () => {
      window.removeEventListener('dragenter', onEnter)
      window.removeEventListener('dragover', onOver)
      window.removeEventListener('dragleave', onLeave)
      window.removeEventListener('drop', onDrop)
    }
  }, [loadFile])

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
      <header className="bg-slate-900 text-white">
        <div className="relative mx-auto w-full max-w-7xl flex items-center gap-3 px-4 py-2 overflow-hidden">
          <img
            src="/UNISIM_Icon.png"
            alt=""
            aria-hidden="true"
            draggable={false}
            className="pointer-events-none select-none absolute right-36 top-1/2 -translate-y-1/2 h-28 w-28 -rotate-12 opacity-30 mix-blend-screen drop-shadow-[0_1px_0_rgba(255,255,255,0.15)]"
          />
          <div className="relative font-semibold tracking-tight">Universal PDF</div>
          <span className="relative hidden md:inline text-xs text-slate-400">
            Open source — self-host free or PRO hosted by{' '}
            <a
              href="https://www.unisim.co.uk"
              target="_blank"
              rel="noreferrer"
              className="underline-offset-2 hover:text-white hover:underline"
            >
              UNI SIM
            </a>
          </span>
          {fileName && (
            <span className="relative text-sm text-slate-300 truncate max-w-xs">{fileName}</span>
          )}
          <div className="relative ml-auto flex items-center gap-2">
            <button
              onClick={() => inputRef.current?.click()}
              className="bg-orange-600 hover:bg-orange-500 px-3 py-1.5 rounded text-sm font-medium"
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
        </div>
      </header>

      {doc && <Toolbar onAIOpen={() => setAiOpen(true)} />}

      <main className="flex-1 min-h-0 pb-16 md:pb-0">
        {loading ? (
          <div className="h-full flex items-center justify-center text-slate-500">
            Loading PDF…
          </div>
        ) : doc ? (
          <PdfViewer />
        ) : (
          <div className="h-full flex flex-col items-center justify-center px-4 py-6 overflow-auto">
            <button
              onClick={() => inputRef.current?.click()}
              className="px-8 py-6 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-orange-500 hover:text-orange-600 transition-colors"
            >
              <div className="text-3xl mb-2">📄</div>
              <div className="font-medium">Click to open a PDF</div>
              <div className="text-xs mt-1 opacity-70">or drop one anywhere</div>
            </button>
            <RecentFilesList />
          </div>
        )}
      </main>

      {dragOver && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center bg-orange-600/20">
          <div className="absolute inset-4 border-4 border-dashed border-orange-500 rounded-2xl" />
          <div className="bg-white shadow-xl rounded-xl px-6 py-5 flex items-center gap-3">
            <div className="text-3xl">📄</div>
            <div>
              <div className="font-semibold text-slate-900">Drop to open</div>
              <div className="text-xs text-slate-500">PDF files only</div>
            </div>
          </div>
        </div>
      )}

      <PageNavigator />
      <SignaturePad />
      {stampPickerOpen && <StampPicker />}
      {emailVerifyOpen && <EmailVerifyModal />}
      <AIToolsPanel open={aiOpen} onClose={() => setAiOpen(false)} />
      <LivePreview />
    </div>
  )
}
