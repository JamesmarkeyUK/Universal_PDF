import { create } from 'zustand'
import type { Annotation, Tool } from '../types/annotations'

interface AnnotationState {
  tool: Tool
  color: string
  strokeWidth: number
  fontSize: number
  annotations: Annotation[]
  setTool: (t: Tool) => void
  setColor: (c: string) => void
  setStrokeWidth: (w: number) => void
  setFontSize: (s: number) => void
  add: (a: Annotation) => void
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
  setTool: (tool) => set({ tool }),
  setColor: (color) => set({ color }),
  setStrokeWidth: (strokeWidth) => set({ strokeWidth }),
  setFontSize: (fontSize) => set({ fontSize }),
  add: (a) => set((s) => ({ annotations: [...s.annotations, a] })),
  remove: (id) => set((s) => ({ annotations: s.annotations.filter((a) => a.id !== id) })),
  clearPage: (pageIndex) =>
    set((s) => ({ annotations: s.annotations.filter((a) => a.pageIndex !== pageIndex) })),
  clearAll: () => set({ annotations: [] }),
  undo: () => set((s) => ({ annotations: s.annotations.slice(0, -1) }))
}))
