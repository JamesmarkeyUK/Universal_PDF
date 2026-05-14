import { useEffect, useRef, useState } from 'react'

const UPSELL_URL = 'https://www.unisim.co.uk'

interface Item {
  key: string
  label: string
  description: string
  icon: string
  badge?: string
  highlight?: boolean
}

const ITEMS: Item[] = [
  { key: 'pro', label: 'Go PRO', description: 'Unlimited pages, priority support, no friction.', icon: '★', highlight: true },
  { key: 'projects', label: 'Projects', description: 'Group PDFs into shared workspaces.', icon: '📁', badge: 'PRO' },
  { key: 'team', label: 'Team Collaboration', description: 'Multi-user editing, comments and roles.', icon: '👥', badge: 'PRO' },
  { key: 'branding', label: 'Your Branding', description: 'Logo, colour theme and custom domain.', icon: '🎨', badge: 'PRO' },
  { key: 'ai', label: 'AI Features', description: 'Smart summaries, redaction and auto-fill.', icon: '✦', badge: 'PRO' }
]

export default function EnterpriseMenu() {
  const [open, setOpen] = useState(false)
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

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="h-8 px-3 rounded-md bg-white/10 hover:bg-white/15 text-white text-sm font-medium flex items-center gap-1.5 ring-1 ring-white/15"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <span className="hidden sm:inline">Enterprise</span>
        <span className="sm:hidden">PRO</span>
        <svg viewBox="0 0 12 12" className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true">
          <path d="M2 4 L6 8 L10 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50">
          <div className="px-4 py-3 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
            <div className="text-xs uppercase tracking-wide opacity-70">Universal PDF for teams</div>
            <div className="text-sm font-semibold mt-0.5">Unlock more with Enterprise</div>
          </div>
          <ul className="py-1">
            {ITEMS.map((item) => (
              <li key={item.key}>
                <a
                  href={UPSELL_URL}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setOpen(false)}
                  className={[
                    'flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors',
                    item.highlight ? 'bg-orange-50/60' : ''
                  ].join(' ')}
                >
                  <span
                    className={[
                      'shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-lg',
                      item.highlight ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-700'
                    ].join(' ')}
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={['text-sm font-semibold', item.highlight ? 'text-orange-700' : 'text-slate-900'].join(' ')}>
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className="text-[10px] uppercase tracking-wide bg-slate-900 text-white px-1.5 py-0.5 rounded-full font-medium">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 truncate">{item.description}</div>
                  </div>
                </a>
              </li>
            ))}
          </ul>
          <div className="px-4 py-2.5 border-t border-slate-100 text-xs text-slate-500">
            Hosted by{' '}
            <a href={UPSELL_URL} target="_blank" rel="noreferrer" className="text-orange-600 hover:underline font-medium">
              UNI SIM
            </a>
            {' '}— contact sales for a demo.
          </div>
        </div>
      )}
    </div>
  )
}
