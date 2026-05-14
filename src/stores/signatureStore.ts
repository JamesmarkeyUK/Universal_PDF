import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Signature {
  id: string
  name: string
  dataUrl: string
  width: number
  height: number
  createdAt: number
  verifiedEmail?: string
}

interface SignatureState {
  signatures: Signature[]
  activeId: string | null
  padOpen: boolean
  importOpen: boolean
  stampPickerOpen: boolean
  emailVerifyOpen: boolean
  pendingVerifyId: string | null
  add: (sig: Omit<Signature, 'id' | 'createdAt'>) => string
  remove: (id: string) => void
  setActive: (id: string | null) => void
  rename: (id: string, name: string) => void
  setVerifiedEmail: (id: string, email: string) => void
  openPad: () => void
  closePad: () => void
  openImport: () => void
  closeImport: () => void
  openStampPicker: () => void
  closeStampPicker: () => void
  openEmailVerify: (id: string) => void
  closeEmailVerify: () => void
}

export const useSignatureStore = create<SignatureState>()(
  persist(
    (set) => ({
      signatures: [],
      activeId: null,
      padOpen: false,
      importOpen: false,
      stampPickerOpen: false,
      emailVerifyOpen: false,
      pendingVerifyId: null,
      add: (sig) => {
        const id = crypto.randomUUID()
        set((s) => ({
          signatures: [...s.signatures, { ...sig, id, createdAt: Date.now() }],
          activeId: id
        }))
        return id
      },
      remove: (id) =>
        set((s) => ({
          signatures: s.signatures.filter((x) => x.id !== id),
          activeId: s.activeId === id ? null : s.activeId
        })),
      setActive: (activeId) => set({ activeId }),
      rename: (id, name) =>
        set((s) => ({
          signatures: s.signatures.map((x) => (x.id === id ? { ...x, name } : x))
        })),
      setVerifiedEmail: (id, email) =>
        set((s) => ({
          signatures: s.signatures.map((x) => (x.id === id ? { ...x, verifiedEmail: email } : x))
        })),
      openPad: () => set({ padOpen: true }),
      closePad: () => set({ padOpen: false }),
      openImport: () => set({ importOpen: true }),
      closeImport: () => set({ importOpen: false }),
      openStampPicker: () => set({ stampPickerOpen: true }),
      closeStampPicker: () => set({ stampPickerOpen: false }),
      openEmailVerify: (id) => set({ emailVerifyOpen: true, pendingVerifyId: id }),
      closeEmailVerify: () => set({ emailVerifyOpen: false, pendingVerifyId: null })
    }),
    {
      name: 'universal-pdf-signatures',
      partialize: (s) => ({ signatures: s.signatures, activeId: s.activeId })
    }
  )
)
