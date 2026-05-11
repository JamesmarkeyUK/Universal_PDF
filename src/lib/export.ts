import { PDFDocument, StandardFonts, LineCapStyle } from 'pdf-lib'
import type { Annotation } from '../types/annotations'
import { hexToPdfRgb } from './colors'

export async function exportPdfWithAnnotations(
  sourceBytes: ArrayBuffer,
  annotations: Annotation[],
  scale: number,
  fileName: string
) {
  const pdf = await PDFDocument.load(sourceBytes)
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const pages = pdf.getPages()

  const byPage = new Map<number, Annotation[]>()
  for (const a of annotations) {
    if (!byPage.has(a.pageIndex)) byPage.set(a.pageIndex, [])
    byPage.get(a.pageIndex)!.push(a)
  }

  for (const [pageIndex, items] of byPage) {
    const page = pages[pageIndex]
    if (!page) continue
    const { height: ph } = page.getSize()
    const sx = (n: number) => n / scale
    const toY = (canvasY: number) => ph - canvasY / scale

    for (const a of items) {
      switch (a.type) {
        case 'text': {
          const baselineY = a.y + a.fontSize * 0.8
          page.drawText(a.text, {
            x: sx(a.x),
            y: ph - baselineY / scale,
            size: a.fontSize / scale,
            font,
            color: hexToPdfRgb(a.color)
          })
          break
        }
        case 'rect': {
          page.drawRectangle({
            x: sx(a.x),
            y: ph - (a.y + a.height) / scale,
            width: sx(a.width),
            height: sx(a.height),
            borderColor: hexToPdfRgb(a.color),
            borderWidth: 2 / scale,
            opacity: 0
          })
          break
        }
        case 'draw': {
          const pts = a.points
          for (let i = 0; i < pts.length - 2; i += 2) {
            page.drawLine({
              start: { x: sx(pts[i]), y: toY(pts[i + 1]) },
              end: { x: sx(pts[i + 2]), y: toY(pts[i + 3]) },
              thickness: a.strokeWidth / scale,
              color: hexToPdfRgb(a.color),
              lineCap: LineCapStyle.Round
            })
          }
          break
        }
        case 'tick': {
          const s = a.size
          const segs: Array<[number, number, number, number]> = [
            [a.x, a.y + s * 0.55, a.x + s * 0.35, a.y + s * 0.9],
            [a.x + s * 0.35, a.y + s * 0.9, a.x + s, a.y + s * 0.1]
          ]
          for (const [x1, y1, x2, y2] of segs) {
            page.drawLine({
              start: { x: sx(x1), y: toY(y1) },
              end: { x: sx(x2), y: toY(y2) },
              thickness: 3.5 / scale,
              color: hexToPdfRgb(a.color),
              lineCap: LineCapStyle.Round
            })
          }
          break
        }
        case 'cross': {
          const s = a.size
          const segs: Array<[number, number, number, number]> = [
            [a.x, a.y, a.x + s, a.y + s],
            [a.x + s, a.y, a.x, a.y + s]
          ]
          for (const [x1, y1, x2, y2] of segs) {
            page.drawLine({
              start: { x: sx(x1), y: toY(y1) },
              end: { x: sx(x2), y: toY(y2) },
              thickness: 3.5 / scale,
              color: hexToPdfRgb(a.color),
              lineCap: LineCapStyle.Round
            })
          }
          break
        }
        case 'image': {
          const isPng = a.src.startsWith('data:image/png')
          const img = isPng
            ? await pdf.embedPng(a.src)
            : await pdf.embedJpg(a.src)
          page.drawImage(img, {
            x: sx(a.x),
            y: ph - (a.y + a.height) / scale,
            width: sx(a.width),
            height: sx(a.height)
          })
          break
        }
      }
    }
  }

  const out = await pdf.save()
  const blob = new Blob([out as BlobPart], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName.replace(/\.pdf$/i, '') + '-annotated.pdf'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
