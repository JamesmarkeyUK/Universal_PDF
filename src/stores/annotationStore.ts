import { create } from 'zustand'
import type { Annotation, Tool } from '../types/annotations'

interface AnnotationState {
  tool: Tool
  color: string
  strokeWidth: number
  fontSize: number
  annotations: Annotation[]
  selectedId: string | null
  uploadedImageSrc: string | null
  setTool: (t: Tool) => void
  setColor: (c: string) => void
  setStrokeWidth: (w: number) => void
  setFontSize: (s: number) => void
  setSelected: (id: string | null) => void
  setUploadedImageSrc: (src: string | null) => void
  add: (a: Annotation) => void
  update: (id: string, patch: Partial<Annotation>) => void
  remove: (id: string) => void
  clearPage: (pageIndex: number) => void
  clearAll: () => void
  undo: () => void
}

export const useAnnotationStore = create<AnnotationState>((set) => ({
  tool: 'select',
  color: '#000000',
  strokeWidth: 2.5,
  fontSize: 18,
  annotations: [],
  selectedId: null,
  uploadedImageSrc: null,
  setTool: (tool) => set({ tool }),
  setUploadedImageSrc: (uploadedImageSrc) => set({ uploadedImageSrc }),
  setColor: (color) =>
    set((s) => {
      const sel = s.annotations.find((a) => a.id === s.selectedId)
      if (sel && sel.type !== 'image') {
        return {
          color,
          annotations: s.annotations.map((a) =>
            a.id === sel.id ? ({ ...a, color } as Annotation) : a
          )
        }
      }
      return { color }
    }),
  setStrokeWidth: (strokeWidth) =>
    set((s) => {
      const sel = s.annotations.find((a) => a.id === s.selectedId)
      if (sel && sel.type === 'draw') {
        return {
          strokeWidth,
          annotations: s.annotations.map((a) =>
            a.id === sel.id ? ({ ...a, strokeWidth } as Annotation) : a
          )
        }
      }
      return { strokeWidth }
    }),
  setFontSize: (fontSize) =>
    set((s) => {
      const sel = s.annotations.find((a) => a.id === s.selectedId)
      if (sel && sel.type === 'text') {
        return {
          fontSize,
          annotations: s.annotations.map((a) =>
            a.id === sel.id ? ({ ...a, fontSize } as Annotation) : a
          )
        }
      }
      return { fontSize }
    }),
  setSelected: (selectedId) => set({ selectedId }),
  add: (a) => set((s) => ({ annotations: [...s.annotations, a], selectedId: a.id })),
  update: (id, patch) =>
    set((s) => ({
      annotations: s.annotations.map((a) =>
        a.id === id ? ({ ...a, ...patch } as Annotation) : a
      )
    })),
  remove: (id) =>
    set((s) => ({
      annotations: s.annotations.filter((a) => a.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId
    })),
  clearPage: (pageIndex) =>
    set((s) => ({ annotations: s.annotations.filter((a) => a.pageIndex !== pageIndex) })),
  clearAll: () => set({ annotations: [], selectedId: null }),
  undo: () =>
    set((s) => ({
      annotations: s.annotations.slice(0, -1),
      selectedId: null
    }))
}))
