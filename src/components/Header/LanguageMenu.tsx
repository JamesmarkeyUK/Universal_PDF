import { useEffect, useRef, useState } from 'react'

type LangCode = 'en' | 'fr' | 'es' | 'it' | 'de' | 'other'

const LANGS: { code: LangCode; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'other', label: 'Other…', flag: '🌐' }
]

const STORAGE_KEY = 'universal-pdf-lang'

function readSaved(): LangCode {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v && LANGS.some((l) => l.code === v)) return v as LangCode
  } catch { /* ignore */ }
  return 'en'
}

export default function LanguageMenu() {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState<LangCode>(readSaved())
  const [showOther, setShowOther] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function pick(code: LangCode) {
    if (code === 'other') {
      setShowOther(true)
      return
    }
    setCurrent(code)
    try { localStorage.setItem(STORAGE_KEY, code) } catch { /* ignore */ }
    document.documentElement.lang = code
    setOpen(false)
    setShowOther(false)
  }

  const currentLang = LANGS.find((l) => l.code === current) ?? LANGS[0]

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="h-8 px-2.5 rounded-md bg-white/10 hover:bg-white/15 text-white text-sm font-medium ring-1 ring-white/15 flex items-center gap-1.5"
        aria-haspopup="true"
        aria-expanded={open}
        title={`Language: ${currentLang.label}`}
      >
        <span aria-hidden="true">{currentLang.flag}</span>
        <span className="hidden sm:inline uppercase text-xs tracking-wide">{currentLang.code === 'other' ? 'EN' : currentLang.code}</span>
        <svg viewBox="0 0 12 12" className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true">
          <path d="M2 4 L6 8 L10 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white text-slate-900 rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden">
          <ul className="py-1">
            {LANGS.map((l) => (
              <li key={l.code}>
                <button
                  type="button"
                  onClick={() => pick(l.code)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-slate-50 transition-colors ${
                    l.code === current ? 'text-orange-700 font-medium bg-orange-50/40' : 'text-slate-700'
                  }`}
                >
                  <span className="text-lg leading-none">{l.flag}</span>
                  <span className="flex-1 text-left">{l.label}</span>
                  {l.code === current && <span aria-hidden="true">✓</span>}
                </button>
              </li>
            ))}
          </ul>
          {showOther && (
            <div className="px-3 py-3 border-t border-slate-100 text-xs text-slate-600 bg-slate-50">
              <a
                href="https://www.unisim.co.uk"
                target="_blank"
                rel="noreferrer"
                className="text-orange-600 hover:underline font-medium"
              >
                Contact UNI SIM
              </a>{' '}
              to request a language.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
