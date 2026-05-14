import { useEffect, useRef, useState } from 'react'

const UPSELL_URL = 'https://www.unisim.co.uk'
const REPO_URL = 'https://github.com/JamesmarkeyUK/Universal_PDF'

type Item =
  | {
      key: string
      label: string
      description: string
      icon: string
      kind: 'link'
      href: string
      badge?: string
      highlight?: boolean
      tinted?: boolean
    }
  | {
      key: string
      label: string
      description: string
      icon: string
      kind: 'action'
      action: 'ai' | 'soon'
      badge?: string
      highlight?: boolean
      tinted?: boolean
    }

interface Props {
  onAIOpen?: () => void
  aiEnabled?: boolean
}

export default function EnterpriseMenu({ onAIOpen, aiEnabled = true }: Props) {
  const [open, setOpen] = useState(false)
  const [soonKey, setSoonKey] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSoonKey(null)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        setSoonKey(null)
      }
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const items: Item[] = [
    { key: 'self-host', label: 'Self host for FREE', description: 'Clone the repo and run it on your own server. MIT-licensed.', icon: '⌂', kind: 'link', href: REPO_URL, badge: 'Open source' },
    { key: 'pro', label: 'Go PRO', description: 'Unlimited pages, priority support, no friction.', icon: '★', kind: 'link', href: UPSELL_URL, highlight: true },
    { key: 'projects', label: 'Projects', description: 'Group PDFs into shared workspaces.', icon: '📁', kind: 'action', action: 'soon', badge: 'Soon', tinted: true },
    { key: 'team', label: 'Team Collaboration', description: 'Multi-user editing, comments and roles.', icon: '👥', kind: 'action', action: 'soon', badge: 'Soon', tinted: true },
    { key: 'branding', label: 'Your Branding', description: 'Logo, colour theme and custom domain.', icon: '🎨', kind: 'action', action: 'soon', badge: 'Soon', tinted: true },
    { key: 'fonts', label: 'Customised fonts', description: 'Upload your brand fonts and use them in any PDF.', icon: 'Aa', kind: 'action', action: 'soon', badge: 'Soon', tinted: true },
    { key: 'stamp-generator', label: 'Stamp generator', description: 'Design custom branded stamps in seconds.', icon: '🔖', kind: 'action', action: 'soon', badge: 'Soon', tinted: true },
    { key: 'ai', label: 'AI Features', description: 'Smart summaries, redaction and auto-fill.', icon: '✦', kind: 'action', action: 'ai', tinted: true }
  ]

  function handleItem(item: Item) {
    if (item.kind === 'link') {
      window.open(item.href, '_blank', 'noopener,noreferrer')
      setOpen(false)
      return
    }
    if (item.action === 'ai') {
      if (aiEnabled && onAIOpen) {
        onAIOpen()
        setOpen(false)
        return
      }
      setSoonKey(item.key)
      return
    }
    setSoonKey(item.key)
  }

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
            {items.map((item) => {
              const showSoon = soonKey === item.key
              const isAi = item.kind === 'action' && item.action === 'ai'
              const aiDisabled = isAi && !aiEnabled
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => handleItem(item)}
                    disabled={aiDisabled}
                    className={[
                      'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                      (item.highlight || item.tinted) ? 'bg-orange-50/60 hover:bg-orange-100/60' : 'hover:bg-slate-50'
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-lg',
                        item.highlight ? 'bg-orange-600 text-white' : isAi ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-700'
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
                        {isAi && aiEnabled && (
                          <span className="text-[10px] uppercase tracking-wide bg-violet-600 text-white px-1.5 py-0.5 rounded-full font-medium">
                            Try
                          </span>
                        )}
                        {aiDisabled && (
                          <span className="text-[10px] uppercase tracking-wide bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded-full font-medium">
                            Open a PDF
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{item.description}</div>
                      {showSoon && (
                        <div className="mt-1 text-xs text-orange-700 bg-orange-50 px-2 py-1 rounded">
                          Coming soon — contact UNI SIM to register interest.
                        </div>
                      )}
                    </div>
                  </button>
                </li>
              )
            })}
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
