interface Props {
  open: boolean
  onClose: () => void
}

export default function AIToolsPanel({ open, onClose }: Props) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✦</span>
            <h2 className="text-lg font-semibold text-slate-900">AI Tools</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-2xl leading-none w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        <div className="space-y-3">
          <AIToolCard
            icon="📄"
            title="Summarise Document"
            description="Get a concise summary of the entire PDF document."
            comingSoon
          />
          <AIToolCard
            icon="❓"
            title="Ask a Question"
            description="Ask anything about the content of the document."
            comingSoon
          />
          <AIToolCard
            icon="✏️"
            title="Suggest Edits"
            description="AI-powered suggestions to improve document text."
            comingSoon
          />
          <AIToolCard
            icon="🌐"
            title="Translate Document"
            description="Translate the document content into another language."
            comingSoon
          />
        </div>

        <p className="mt-6 text-xs text-slate-400 text-center">
          AI features require an API connection — coming soon.
        </p>
      </div>
    </div>
  )
}

function AIToolCard({
  icon,
  title,
  description,
  comingSoon,
}: {
  icon: string
  title: string
  description: string
  comingSoon?: boolean
}) {
  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${comingSoon ? 'border-slate-200 bg-slate-50 opacity-70' : 'border-orange-200 bg-orange-50 cursor-pointer hover:bg-orange-100'}`}>
      <span className="text-2xl leading-none mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-800">{title}</span>
          {comingSoon && (
            <span className="text-[10px] font-semibold bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
              Coming soon
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
    </div>
  )
}
