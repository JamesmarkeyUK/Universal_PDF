import { create } from 'zustand'
import { pdfjsLib, type PDFDocumentProxy } from '../lib/pdfjs'

interface PdfState {
  doc: PDFDocumentProxy | null
  numPages: number
  fileName: string | null
  sourceBytes: ArrayBuffer | null
  loading: boolean
  pageNavOpen: boolean
  loadFile: (file: File) => Promise<void>
  reset: () => void
  togglePageNav: () => void
  setPageNavOpen: (open: boolean) => void
}

export const usePdfStore = create<PdfState>((set, get) => ({
  doc: null,
  numPages: 0,
  fileName: null,
  sourceBytes: null,
  loading: false,
  pageNavOpen: false,
  togglePageNav: () => set((s) => ({ pageNavOpen: !s.pageNavOpen })),
  setPageNavOpen: (pageNavOpen) => set({ pageNavOpen }),
  loadFile: async (file) => {
    set({ loading: true })
    try {
      get().doc?.destroy()
      const buf = await file.arrayBuffer()
      // pdf.js may transfer the buffer to its worker, so clone for rendering
      // and keep the original for later export with pdf-lib.
      const renderCopy = buf.slice(0)
      const doc = await pdfjsLib.getDocument({ data: renderCopy }).promise
      set({
        doc,
        numPages: doc.numPages,
        fileName: file.name,
        sourceBytes: buf,
        loading: false
      })
    } catch (e) {
      set({ loading: false })
      throw e
    }
  },
  reset: () => {
    get().doc?.destroy()
    set({ doc: null, numPages: 0, fileName: null, sourceBytes: null })
  }
}))
