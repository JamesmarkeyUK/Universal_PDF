import { useSignatureStore } from '../../stores/signatureStore'
import { useAnnotationStore } from '../../stores/annotationStore'

interface StampDef {
  label: string
  text: string
  color: string
  shape: 'oval' | 'rect'
}

const STAMPS: StampDef[] = [
  { label: 'Approved', text: 'APPROVED', color: '#16a34a', shape: 'oval' },
  { label: 'Confidential', text: 'CONFIDENTIAL', color: '#dc2626', shape: 'oval' },
  { label: 'Draft', text: 'DRAFT', color: '#ea580c', shape: 'rect' },
  { label: 'Received', text: 'RECEIVED', color: '#2563eb', shape: 'rect' },
  { label: 'Reviewed', text: 'REVIEWED', color: '#7c3aed', shape: 'oval' },
  { label: 'Void', text: 'VOID', color: '#dc2626', shape: 'rect' },
  { label: 'Paid', text: 'PAID', color: '#16a34a', shape: 'rect' },
  { label: 'Not Approved', text: 'NOT APPROVED', color: '#9f1239', shape: 'oval' },
]

function renderStampDataUrl(text: string, color: string, shape: 'oval' | 'rect'): string {
  const W = 240
  const H = 96
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, W, H)

  // Choose font size based on text length
  const fontSize = text.length > 10 ? 20 : text.length > 7 ? 24 : 28
  ctx.font = `bold ${fontSize}px Arial, sans-serif`

  const textW = ctx.measureText(text).width
  const padX = Math.max(20, (W - textW) / 2 - 4)
  const padY = 14

  ctx.strokeStyle = color
  ctx.lineWidth = 4

  if (shape === 'oval') {
    const rx = W / 2 - padX
    const ry = H / 2 - padY
    ctx.beginPath()
    ctx.ellipse(W / 2, H / 2, rx, ry, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.ellipse(W / 2, H / 2, rx - 5, ry - 5, 0, 0, Math.PI * 2)
    ctx.stroke()
  } else {
    ctx.strokeRect(padX - 4, padY - 4, W - (padX - 4) * 2, H - (padY - 4) * 2)
    ctx.lineWidth = 1.5
    ctx.strokeRect(padX, padY, W - padX * 2, H - padY * 2)
  }

  ctx.fillStyle = color
  ctx.font = `bold ${fontSize}px Arial, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, W / 2, H / 2)

  return canvas.toDataURL('image/png')
}

export default function StampPicker() {
  const open = useSignatureStore((s) => s.stampPickerOpen)
  const closeStampPicker = useSignatureStore((s) => s.closeStampPicker)
  const addSignature = useSignatureStore((s) => s.add)
  const setActive = useSignatureStore((s) => s.setActive)
  const setTool = useAnnotationStore((s) => s.setTool)

  if (!open) return null

  function pickStamp(def: StampDef) {
    const dataUrl = renderStampDataUrl(def.text, def.color, def.shape)
    const W = 240
    const H = 96
    const id = addSignature({ name: def.label + ' Stamp', dataUrl, width: W, height: H })
    setActive(id)
    setTool('signature')
    closeStampPicker()
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) closeStampPicker() }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-slate-900">Choose a Stamp</h2>
          <button
            onClick={closeStampPicker}
            className="text-slate-400 hover:text-slate-700 text-2xl leading-none w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {STAMPS.map((def) => (
            <button
              key={def.text}
              onClick={() => pickStamp(def)}
              className="border-2 rounded-lg p-3 hover:bg-slate-50 transition-colors flex items-center justify-center"
              style={{ borderColor: def.color + '60' }}
            >
              <StampPreview def={def} />
            </button>
          ))}
        </div>
        <p className="mt-4 text-xs text-slate-400 text-center">
          Click a stamp then click on the PDF to place it. Resize with handles.
        </p>
      </div>
    </div>
  )
}

function StampPreview({ def }: { def: StampDef }) {
  const fontSize = def.text.length > 10 ? 11 : def.text.length > 7 ? 13 : 15

  if (def.shape === 'oval') {
    return (
      <div className="relative flex items-center justify-center" style={{ width: 120, height: 48 }}>
        <div
          className="absolute inset-0 rounded-full border-2"
          style={{ borderColor: def.color }}
        />
        <div
          className="absolute rounded-full border"
          style={{ inset: 4, borderColor: def.color }}
        />
        <span
          className="relative font-bold tracking-wide"
          style={{ color: def.color, fontSize }}
        >
          {def.text}
        </span>
      </div>
    )
  }

  return (
    <div className="relative flex items-center justify-center" style={{ width: 120, height: 48 }}>
      <div
        className="absolute inset-0 border-2 rounded-sm"
        style={{ borderColor: def.color }}
      />
      <div
        className="absolute border rounded-sm"
        style={{ inset: 4, borderColor: def.color }}
      />
      <span
        className="relative font-bold tracking-wide"
        style={{ color: def.color, fontSize }}
      >
        {def.text}
      </span>
    </div>
  )
}
