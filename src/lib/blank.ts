import { PDFDocument, PageSizes } from 'pdf-lib'

export type PageSize = 'A3' | 'A4' | 'A5'

const SIZE_MAP: Record<PageSize, [number, number]> = {
  A3: PageSizes.A3,
  A4: PageSizes.A4,
  A5: PageSizes.A5
}

export async function createBlankPdfFile(size: PageSize): Promise<File> {
  const pdf = await PDFDocument.create()
  pdf.addPage(SIZE_MAP[size])
  const bytes = await pdf.save()
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' })
  const stamp = new Date().toISOString().slice(0, 10)
  return new File([blob], `Untitled-${size}-${stamp}.pdf`, { type: 'application/pdf' })
}
