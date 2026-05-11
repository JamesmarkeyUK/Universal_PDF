import { create } from 'zustand'
import { pdfjsLib, type PDFDocumentProxy } from '../lib/pdfjs'
import { listRecents, saveRecent, getRecent, deleteRecent, type RecentMeta } from '../lib/recents'

interface PdfState {
  doc: PDFDocumentProxy | null
  numPages: number
  fileName: string | null
  sourceBytes: ArrayBuffer | null
  loading: boolean
  pageNavOpen: boolean
  recents: RecentMeta[]
  loadFile: (file: File) => Promise<void>
  reset: () => void
  togglePageNav: () => void
  setPageNavOpen: (open: boolean) => void
  refreshRecents: () => Promise<void>
  openRecent: (id: string) => Promise<void>
  removeRecent: (id: string) => Promise<void>
}

export const usePdfStore = create<PdfState>((set, get) => ({
  doc: null,
  numPages: 0,
  fileName: null,
  sourceBytes: null,
  loading: false,
  pageNavOpen: false,
  recents: [],
  togglePageNav: () => set((s) => ({ pageNavOpen: !s.pageNavOpen })),
  setPageNavOpen: (pageNavOpen) => set({ pageNavOpen }),
  loadFile: async (file) => {
    set({ loading: true })
    try {
      get().doc?.destroy()
      const buf = await file.arrayBuffer()
      const renderCopy = buf.slice(0)
      const doc = await pdfjsLib.getDocument({ data: renderCopy }).promise
      set({
        doc,
        numPages: doc.numPages,
        fileName: file.name,
        sourceBytes: buf,
        loading: false
      })
      // Persist to recents in the background — never blocks loading.
      saveRecent(file.name, buf)
        .then(() => get().refreshRecents())
        .catch(() => {})
    } catch (e) {
      set({ loading: false })
      throw e
    }
  },
  reset: () => {
    get().doc?.destroy()
    set({ doc: null, numPages: 0, fileName: null, sourceBytes: null })
  },
  refreshRecents: async () => {
    const recents = await listRecents()
    set({ recents })
  },
  openRecent: async (id) => {
    const bytes = await getRecent(id)
    if (!bytes) return
    const meta = get().recents.find((r) => r.id === id)
    if (!meta) return
    const file = new File([bytes], meta.name, { type: 'application/pdf' })
    await get().loadFile(file)
  },
  removeRecent: async (id) => {
    // Optimistic update, then drop from IndexedDB.
    set((s) => ({ recents: s.recents.filter((r) => r.id !== id) }))
    await deleteRecent(id)
  }
}))
