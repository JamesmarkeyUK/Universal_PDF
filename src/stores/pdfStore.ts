import { create } from 'zustand'
import { pdfjsLib, type PDFDocumentProxy } from '../lib/pdfjs'
import { listRecents, saveRecent, getRecent, getRecentBySlug, deleteRecent, renameRecent, type RecentMeta } from '../lib/recents'

function setHashSlug(slug: string | null) {
  if (typeof window === 'undefined') return
  const target = slug ? `#${slug}` : ''
  if (window.location.hash === target) return
  // Use replaceState so the user's browser history doesn't fill up with
  // every PDF they open in this session.
  const url = window.location.pathname + window.location.search + target
  window.history.replaceState(null, '', url)
}

function readHashSlug(): string | null {
  if (typeof window === 'undefined') return null
  const h = window.location.hash.replace(/^#/, '').trim()
  return /^[a-z0-9]{4,16}$/i.test(h) ? h : null
}

interface PdfState {
  doc: PDFDocumentProxy | null
  numPages: number
  fileName: string | null
  sourceBytes: ArrayBuffer | null
  loading: boolean
  pageNavOpen: boolean
  previewOpen: boolean
  recents: RecentMeta[]
  loadFile: (file: File) => Promise<void>
  loadFromSlug: (slug: string) => Promise<boolean>
  loadFromCurrentUrl: () => Promise<boolean>
  reset: () => void
  togglePageNav: () => void
  setPageNavOpen: (open: boolean) => void
  setPreviewOpen: (open: boolean) => void
  refreshRecents: () => Promise<void>
  openRecent: (id: string) => Promise<void>
  removeRecent: (id: string) => Promise<void>
  renameFile: (newName: string) => Promise<void>
}

export const usePdfStore = create<PdfState>((set, get) => ({
  doc: null,
  numPages: 0,
  fileName: null,
  sourceBytes: null,
  loading: false,
  pageNavOpen: false,
  previewOpen: false,
  recents: [],
  togglePageNav: () => set((s) => ({ pageNavOpen: !s.pageNavOpen })),
  setPageNavOpen: (pageNavOpen) => set({ pageNavOpen }),
  setPreviewOpen: (previewOpen) => set({ previewOpen }),
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
      // The returned slug becomes the URL hash so a refresh reloads the
      // same PDF straight from IndexedDB.
      saveRecent(file.name, buf)
        .then((slug) => {
          if (slug) setHashSlug(slug)
          return get().refreshRecents()
        })
        .catch(() => {})
    } catch (e) {
      set({ loading: false })
      throw e
    }
  },
  loadFromSlug: async (slug) => {
    const hit = await getRecentBySlug(slug)
    if (!hit) return false
    const file = new File([hit.bytes], hit.meta.name, { type: 'application/pdf' })
    await get().loadFile(file)
    return true
  },
  loadFromCurrentUrl: async () => {
    const slug = readHashSlug()
    if (!slug) return false
    const ok = await get().loadFromSlug(slug)
    if (!ok) {
      // Stale slug — clear the hash so we fall back to the landing page.
      setHashSlug(null)
    }
    return ok
  },
  reset: () => {
    get().doc?.destroy()
    set({ doc: null, numPages: 0, fileName: null, sourceBytes: null, previewOpen: false })
    setHashSlug(null)
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
  },
  renameFile: async (newName) => {
    const next = newName.trim()
    if (!next) return
    const cleaned = /\.pdf$/i.test(next) ? next : `${next}.pdf`
    const current = get().fileName
    if (!current || current === cleaned) return
    set({ fileName: cleaned })
    await renameRecent(current, cleaned)
    await get().refreshRecents()
  }
}))
