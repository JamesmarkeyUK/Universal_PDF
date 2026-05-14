import { useEffect, useRef, useState } from 'react'
import { usePdfStore } from '../../stores/pdfStore'

export default function FileNameEditor() {
  const fileName = usePdfStore((s) => s.fileName)
  const renameFile = usePdfStore((s) => s.renameFile)

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      const ext = /\.pdf$/i.test(draft) ? draft.length - 4 : draft.length
      inputRef.current.setSelectionRange(0, ext)
    }
  }, [editing, draft])

  if (!fileName) return null

  function start() {
    setDraft(fileName ?? '')
    setEditing(true)
  }
  function commit() {
    const next = draft.trim()
    if (!next || next === fileName) {
      setEditing(false)
      return
    }
    renameFile(next)
    setEditing(false)
  }
  function cancel() {
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commit()
          } else if (e.key === 'Escape') {
            e.preventDefault()
            cancel()
          }
        }}
        className="relative px-2 py-1 rounded bg-white/10 text-white text-sm w-56 max-w-[40vw] outline-none ring-1 ring-white/30 focus:ring-orange-500"
        aria-label="Rename file"
      />
    )
  }

  return (
    <button
      onClick={start}
      title="Click to rename"
      className="relative group flex items-center gap-1 max-w-xs px-1.5 py-0.5 rounded text-sm text-slate-300 hover:text-white hover:bg-white/10 transition-colors truncate"
    >
      <span className="truncate">{fileName}</span>
      <span aria-hidden="true" className="opacity-0 group-hover:opacity-60 text-xs">✎</span>
    </button>
  )
}
