const DB_NAME = 'universal-pdf'
const STORE = 'recents'
const VERSION = 1
const MAX_RECENTS = 8

export interface RecentFile {
  id: string
  name: string
  size: number
  lastOpened: number
  bytes: ArrayBuffer
}

export interface RecentMeta {
  id: string
  name: string
  size: number
  lastOpened: number
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
    req.onblocked = () => reject(new Error('IndexedDB blocked'))
  })
}

export async function listRecents(): Promise<RecentMeta[]> {
  try {
    const db = await openDB()
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).getAll()
      req.onsuccess = () => {
        const all = req.result as RecentFile[]
        const metas = all
          .map((f) => ({ id: f.id, name: f.name, size: f.size, lastOpened: f.lastOpened }))
          .sort((a, b) => b.lastOpened - a.lastOpened)
        resolve(metas)
      }
      req.onerror = () => reject(req.error)
    })
  } catch (e) {
    console.warn('recents.listRecents failed:', e)
    return []
  }
}

export async function saveRecent(name: string, bytes: ArrayBuffer): Promise<void> {
  try {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      const store = tx.objectStore(STORE)
      const allReq = store.getAll()
      allReq.onsuccess = () => {
        const all = allReq.result as RecentFile[]
        const existing = all.find((f) => f.name === name)
        const entry: RecentFile = {
          id: existing?.id ?? crypto.randomUUID(),
          name,
          size: bytes.byteLength,
          lastOpened: Date.now(),
          bytes
        }
        store.put(entry)
        // Evict oldest if over the cap
        const merged = [...all.filter((f) => f.id !== entry.id), entry].sort(
          (a, b) => b.lastOpened - a.lastOpened
        )
        merged.slice(MAX_RECENTS).forEach((f) => store.delete(f.id))
      }
      allReq.onerror = () => reject(allReq.error)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (e) {
    console.warn('recents.saveRecent failed:', e)
  }
}

export async function getRecent(id: string): Promise<ArrayBuffer | null> {
  try {
    const db = await openDB()
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).get(id)
      req.onsuccess = () => {
        const entry = req.result as RecentFile | undefined
        resolve(entry?.bytes ?? null)
      }
      req.onerror = () => reject(req.error)
    })
  } catch (e) {
    console.warn('recents.getRecent failed:', e)
    return null
  }
}

export async function renameRecent(oldName: string, newName: string): Promise<void> {
  if (!oldName || !newName || oldName === newName) return
  try {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      const store = tx.objectStore(STORE)
      const allReq = store.getAll()
      allReq.onsuccess = () => {
        const all = allReq.result as RecentFile[]
        const entry = all.find((f) => f.name === oldName)
        if (entry) {
          store.put({ ...entry, name: newName })
        }
      }
      allReq.onerror = () => reject(allReq.error)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (e) {
    console.warn('recents.renameRecent failed:', e)
  }
}

export async function deleteRecent(id: string): Promise<void> {
  try {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).delete(id)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (e) {
    console.warn('recents.deleteRecent failed:', e)
  }
}
