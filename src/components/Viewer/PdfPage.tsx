import { useEffect, useRef, useState } from 'react'
import type { PDFDocumentProxy, PDFPageProxy } from '../../lib/pdfjs'
import AnnotationLayer from './AnnotationLayer'
import FormFieldLayer from './FormFieldLayer'

interface Props {
  doc: PDFDocumentProxy
  pageIndex: number
  scale: number
}

export default function PdfPage({ doc, pageIndex, scale }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [size, setSize] = useState<{ width: number; height: number } | null>(null)
  const [page, setPage] = useState<PDFPageProxy | null>(null)

  useEffect(() => {
    let cancelled = false
    let renderTask: { cancel: () => void; promise: Promise<void> } | null = null

    async function render() {
      const p = await doc.getPage(pageIndex + 1)
      if (cancelled) return
      setPage(p)
      const viewport = p.getViewport({ scale })
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = viewport.width
      canvas.height = viewport.height
      setSize({ width: viewport.width, height: viewport.height })

      renderTask = p.render({ canvasContext: ctx, viewport })
      try {
        await renderTask.promise
      } catch {
        // render cancelled; ignore
      }
    }

    render()
    return () => {
      cancelled = true
      renderTask?.cancel()
    }
  }, [doc, pageIndex, scale])

  return (
    <div
      data-page-index={pageIndex}
      className="relative shadow-lg mx-auto bg-white scroll-mt-4"
      style={size ? { width: size.width, height: size.height } : undefined}
    >
      <canvas ref={canvasRef} className="block" />
      {size && <AnnotationLayer pageIndex={pageIndex} width={size.width} height={size.height} />}
      {size && page && (
        <FormFieldLayer
          page={page}
          pageIndex={pageIndex}
          scale={scale}
          pageHeight={size.height}
        />
      )}
    </div>
  )
}
