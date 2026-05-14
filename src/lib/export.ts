import { PDFDocument, StandardFonts, LineCapStyle } from 'pdf-lib'
import type { Annotation } from '../types/annotations'
import type { FormFieldValue } from '../stores/formStore'
import { hexToPdfRgb } from './colors'

// Convert a polyline (flat [x0,y0,x1,y1,...]) to a sequence of cardinal-spline
// Bezier segments matching Konva's `tension` smoothing on the screen overlay.
function smoothPolyline(points: number[], tension = 0.4, samplesPerSeg = 12) {
  if (points.length < 4) return points
  const out: Array<[number, number]> = []
  out.push([points[0], points[1]])
  for (let i = 0; i < points.length - 2; i += 2) {
    const p1x = points[i]
    const p1y = points[i + 1]
    const p2x = points[i + 2]
    const p2y = points[i + 3]
    const p0x = i === 0 ? p1x : points[i - 2]
    const p0y = i === 0 ? p1y : points[i - 1]
    const p3x = i + 4 >= points.length ? p2x : points[i + 4]
    const p3y = i + 4 >= points.length ? p2y : points[i + 5]
    const cp1x = p1x + ((p2x - p0x) * tension) / 6
    const cp1y = p1y + ((p2y - p0y) * tension) / 6
    const cp2x = p2x - ((p3x - p1x) * tension) / 6
    const cp2y = p2y - ((p3y - p1y) * tension) / 6
    for (let s = 1; s <= samplesPerSeg; s++) {
      const t = s / samplesPerSeg
      const mt = 1 - t
      const x =
        mt * mt * mt * p1x +
        3 * mt * mt * t * cp1x +
        3 * mt * t * t * cp2x +
        t * t * t * p2x
      const y =
        mt * mt * mt * p1y +
        3 * mt * mt * t * cp1y +
        3 * mt * t * t * cp2y +
        t * t * t * p2y
      out.push([x, y])
    }
  }
  return out.flat()
}

export async function buildAnnotatedPdfBytes(
  sourceBytes: ArrayBuffer,
  annotations: Annotation[],
  scale: number,
  formValues?: FormFieldValue[]
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(sourceBytes)
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const pages = pdf.getPages()

  // Fill PDF form fields if any
  if (formValues && formValues.length > 0) {
    try {
      const form = pdf.getForm()
      for (const fv of formValues) {
        if (!fv.value) continue
        try {
          const field = form.getTextField(fv.fieldName)
          field.setText(fv.value)
        } catch {
          // Field not found or not a text field — skip silently
        }
      }
      // Flatten form so values are baked in
      try { form.flatten() } catch { /* ignore if form can't be flattened */ }
    } catch {
      // No form fields or form not supported
    }
  }

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
          const pts = smoothPolyline(a.points, 0.4, 12)
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

  return pdf.save()
}

export function downloadPdfBytes(bytes: Uint8Array, fileName: string) {
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export async function exportPdfWithAnnotations(
  sourceBytes: ArrayBuffer,
  annotations: Annotation[],
  scale: number,
  fileName: string,
  formValues?: FormFieldValue[]
) {
  const bytes = await buildAnnotatedPdfBytes(sourceBytes, annotations, scale, formValues)
  const outName = fileName.replace(/\.pdf$/i, '') + '-annotated.pdf'
  downloadPdfBytes(bytes, outName)
}

export interface CompressResult {
  bytes: Uint8Array
  originalSize: number
  compressedSize: number
  fileName: string
}

export async function compressPdf(
  sourceBytes: ArrayBuffer,
  fileName: string
): Promise<CompressResult> {
  const originalSize = sourceBytes.byteLength
  const pdf = await PDFDocument.load(sourceBytes)
  const bytes = await pdf.save({ useObjectStreams: true })
  const outName = fileName.replace(/\.pdf$/i, '') + '-compressed.pdf'
  return { bytes, originalSize, compressedSize: bytes.byteLength, fileName: outName }
}
