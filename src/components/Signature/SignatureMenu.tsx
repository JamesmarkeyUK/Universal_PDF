import { useEffect, useRef, useState } from 'react'
import { useSignatureStore } from '../../stores/signatureStore'
import { useAnnotationStore } from '../../stores/annotationStore'

export default function SignatureMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const signatures = useSignatureStore((s) => s.signatures)
  const activeId = useSignatureStore((s) => s.activeId)
  const setActive = useSignatureStore((s) => s.setActive)
  const openPad = useSignatureStore((s) => s.openPad)
  const remove = useSignatureStore((s) => s.remove)

  const tool = useAnnotationStore((s) => s.tool)
  const setTool = useAnnotationStore((s) => s.setTool)

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  function pick(id: string) {
    setActive(id)
    setTool('signature')
    setOpen(false)
  }

  const active = signatures.find((s) => s.id === activeId)
  const armed = tool === 'signature' && !!active

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`h-10 px-3 rounded flex items-center gap-2 text-sm font-medium transition-colors ${
          armed ? 'bg-blue-600 hover:bg-blue-500' : 'bg-slate-700 hover:bg-slate-600'
        }`}
      >
        <span>✍</span>
        <span>Sign</span>
        {active && (
          <img
            src={active.dataUrl}
            alt=""
            className="h-6 max-w-12 bg-white rounded px-1"
          />
        )}
        <span className="opacity-60 text-xs">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-72 bg-white text-slate-900 rounded-lg shadow-xl border border-slate-200 z-40 overflow-hidden">
          <div className="px-3 py-2 text-xs font-medium text-slate-500 uppercase tracking-wide border-b border-slate-100">
            Saved signatures
          </div>
          <div className="max-h-72 overflow-auto">
            {signatures.length === 0 ? (
              <div className="px-3 py-6 text-sm text-slate-500 text-center">
                No signatures yet
              </div>
            ) : (
              signatures.map((s) => (
                <div
                  key={s.id}
                  className={`flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 ${
                    s.id === activeId ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => pick(s.id)}
                >
                  <img
                    src={s.dataUrl}
                    alt={s.name}
                    className="h-10 max-w-32 object-contain bg-white"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{s.name}</div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); remove(s.id) }}
                    className="text-slate-300 hover:text-red-600 text-sm"
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
          <button
            onClick={() => { openPad(); setOpen(false) }}
            className="w-full px-3 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 border-t border-slate-100"
          >
            + Draw new signature
          </button>
        </div>
      )}
    </div>
  )
}
