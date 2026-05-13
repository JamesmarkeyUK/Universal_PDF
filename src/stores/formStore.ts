import { create } from 'zustand'

export interface FormFieldValue {
  pageIndex: number
  fieldName: string
  value: string
}

interface FormState {
  values: FormFieldValue[]
  setValue: (pageIndex: number, fieldName: string, value: string) => void
  getValue: (pageIndex: number, fieldName: string) => string
  clearAll: () => void
}

export const useFormStore = create<FormState>((set, get) => ({
  values: [],
  setValue: (pageIndex, fieldName, value) =>
    set((s) => {
      const existing = s.values.findIndex(
        (v) => v.pageIndex === pageIndex && v.fieldName === fieldName
      )
      if (existing >= 0) {
        const next = [...s.values]
        next[existing] = { pageIndex, fieldName, value }
        return { values: next }
      }
      return { values: [...s.values, { pageIndex, fieldName, value }] }
    }),
  getValue: (pageIndex, fieldName) => {
    const found = get().values.find(
      (v) => v.pageIndex === pageIndex && v.fieldName === fieldName
    )
    return found?.value ?? ''
  },
  clearAll: () => set({ values: [] })
}))
