export type LangCode = 'en' | 'fr' | 'es' | 'it' | 'de' | 'other'

export interface LangOption {
  code: LangCode
  label: string
  flag: string
}

export const LANGS: LangOption[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'other', label: 'Other…', flag: '🌐' }
]

const STORAGE_KEY = 'universal-pdf-lang'

export function readSavedLang(): LangCode {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v && LANGS.some((l) => l.code === v)) return v as LangCode
  } catch { /* ignore */ }
  return 'en'
}

export function persistLang(code: LangCode) {
  try { localStorage.setItem(STORAGE_KEY, code) } catch { /* ignore */ }
  if (typeof document !== 'undefined') document.documentElement.lang = code
}
