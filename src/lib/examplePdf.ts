import { PDFDocument, PageSizes, StandardFonts, rgb } from 'pdf-lib'

const ORANGE = rgb(0.92, 0.34, 0.06)
const ORANGE_LIGHT = rgb(1, 0.93, 0.85)
const SLATE_900 = rgb(0.06, 0.09, 0.16)
const SLATE_600 = rgb(0.34, 0.39, 0.46)
const SLATE_400 = rgb(0.58, 0.64, 0.72)
const SLATE_200 = rgb(0.89, 0.91, 0.93)
const GREEN_600 = rgb(0.05, 0.59, 0.41)
const GREEN_50 = rgb(0.93, 0.99, 0.96)
const BLUE_50 = rgb(0.94, 0.97, 1)
const BLUE_400 = rgb(0.38, 0.65, 0.98)

export async function createExamplePdfFile(): Promise<File> {
  const pdf = await PDFDocument.create()
  const page = pdf.addPage(PageSizes.A4)
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const { width, height } = page.getSize()

  // Header band
  page.drawRectangle({ x: 0, y: height - 70, width, height: 70, color: SLATE_900 })
  page.drawCircle({ x: 55, y: height - 35, size: 13, color: ORANGE })
  page.drawText('U', { x: 50, y: height - 41, size: 16, font: bold, color: rgb(1, 1, 1) })
  page.drawText('Universal PDF — Feature tour', { x: 80, y: height - 32, size: 16, font: bold, color: rgb(1, 1, 1) })
  page.drawText('A one-page example of every editor tool in action.', { x: 80, y: height - 52, size: 9, font, color: rgb(0.82, 0.86, 0.91) })

  // Title
  let y = height - 110
  page.drawText('Sample document', { x: 50, y, size: 22, font: bold, color: SLATE_900 })
  y -= 28
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: SLATE_200 })
  y -= 25

  // Intro paragraph
  page.drawText('This file demonstrates the editor in one page. Try each feature:', {
    x: 50, y, size: 11, font, color: SLATE_600
  })
  y -= 22

  const bullets = [
    'Click any form field below to type into it',
    'Use the Text tool to add labels anywhere',
    'Use the Image tool to drop in a logo or photo',
    'Use Sign to draw, or "Import image" for a scanned signature',
    'Export keeps everything baked into the PDF'
  ]
  for (const b of bullets) {
    page.drawCircle({ x: 56, y: y + 4, size: 2, color: ORANGE })
    page.drawText(b, { x: 64, y, size: 10.5, font, color: SLATE_900 })
    y -= 17
  }
  y -= 10

  // ---- Form fields card ----
  const formTop = y
  page.drawRectangle({ x: 50, y: y - 130, width: width - 100, height: 130, borderColor: SLATE_200, borderWidth: 1, color: rgb(1, 1, 1) })
  page.drawRectangle({ x: 50, y: y - 24, width: width - 100, height: 24, color: BLUE_50 })
  page.drawText('Form fields — click any blue box to fill', { x: 60, y: y - 17, size: 10, font: bold, color: SLATE_900 })
  y -= 40

  const form = pdf.getForm()
  function addField(name: string, label: string, fx: number, fy: number, fw: number) {
    page.drawText(label, { x: fx, y: fy + 22, size: 9, font: bold, color: SLATE_600 })
    const field = form.createTextField(`example.${name}`)
    field.setText('')
    field.addToPage(page, {
      x: fx,
      y: fy,
      width: fw,
      height: 18,
      borderColor: BLUE_400,
      borderWidth: 1,
      backgroundColor: BLUE_50
    })
  }

  addField('name', 'Your full name', 60, y - 18, 200)
  addField('email', 'Email', 280, y - 18, 215)
  y -= 50
  addField('company', 'Company', 60, y - 18, 200)
  addField('date', 'Date', 280, y - 18, 215)
  y = formTop - 145

  // ---- Image + signature row ----
  // Image placeholder (left)
  const imgX = 50, imgY = y - 120, imgW = 200, imgH = 120
  page.drawRectangle({ x: imgX, y: imgY, width: imgW, height: imgH, color: ORANGE_LIGHT, borderColor: ORANGE, borderWidth: 1 })
  // Sun + mountains
  page.drawCircle({ x: imgX + 40, y: imgY + 85, size: 12, color: rgb(1, 0.87, 0.27) })
  page.drawRectangle({ x: imgX, y: imgY, width: imgW, height: 50, color: rgb(0.53, 0.94, 0.59) })
  page.drawSvgPath('M0 50 L40 20 L70 35 L110 5 L150 25 L200 10 L200 50 Z', {
    x: imgX, y: imgY + 50,
    color: rgb(0.58, 0.64, 0.72)
  })
  page.drawText('Image — drop a logo, photo or stamp here', {
    x: imgX + 8, y: imgY - 14, size: 8, font, color: SLATE_400
  })

  // Signature (right)
  const sigX = imgX + imgW + 30, sigW = width - 100 - imgW - 30
  page.drawRectangle({ x: sigX, y: imgY, width: sigW, height: imgH, color: rgb(1, 1, 1), borderColor: SLATE_200, borderWidth: 1 })
  page.drawText('Signed by', { x: sigX + 12, y: imgY + imgH - 22, size: 9, font: bold, color: SLATE_600 })

  // Stylised handwritten signature using svg path
  page.drawSvgPath(
    'M0 0 C 10 -18, 22 16, 36 -4 S 60 14, 78 -8 S 110 4, 130 -10',
    { x: sigX + 16, y: imgY + imgH - 50, borderColor: ORANGE, borderWidth: 2 }
  )
  page.drawText('Alex Morgan', { x: sigX + 16, y: imgY + 38, size: 10, font: bold, color: SLATE_900 })
  page.drawText('Director of Operations', { x: sigX + 16, y: imgY + 25, size: 8, font, color: SLATE_600 })

  // Verified email badge
  const badgeY = imgY + 8
  const badgeText = 'Verified: alex@example.com'
  const badgeW = bold.widthOfTextAtSize(badgeText, 8) + 26
  page.drawRectangle({ x: sigX + 12, y: badgeY, width: badgeW, height: 14, color: GREEN_50, borderColor: GREEN_600, borderWidth: 0.5 })
  page.drawText('✓', { x: sigX + 17, y: badgeY + 3.5, size: 8, font: bold, color: GREEN_600 })
  page.drawText(badgeText, { x: sigX + 27, y: badgeY + 3.5, size: 8, font: bold, color: GREEN_600 })

  // ---- Free-draw + shapes demo ----
  y = imgY - 30
  page.drawText('Annotations — ticks, crosses, free draw, rectangles', { x: 50, y, size: 10, font: bold, color: SLATE_900 })
  y -= 12
  // Tick
  page.drawSvgPath('M0 10 L8 18 L22 0', { x: 60, y: y - 22, borderColor: GREEN_600, borderWidth: 2.5 })
  page.drawText('Approved', { x: 92, y: y - 18, size: 10, font, color: SLATE_900 })
  // Cross
  page.drawLine({ start: { x: 200, y: y - 4 }, end: { x: 218, y: y - 22 }, thickness: 2.5, color: rgb(0.86, 0.15, 0.15) })
  page.drawLine({ start: { x: 200, y: y - 22 }, end: { x: 218, y: y - 4 }, thickness: 2.5, color: rgb(0.86, 0.15, 0.15) })
  page.drawText('Rejected', { x: 230, y: y - 18, size: 10, font, color: SLATE_900 })
  // Rectangle
  page.drawRectangle({ x: 340, y: y - 25, width: 80, height: 22, borderColor: rgb(0.15, 0.39, 0.92), borderWidth: 1.5 })
  page.drawText('Highlight', { x: 350, y: y - 19, size: 10, font, color: rgb(0.15, 0.39, 0.92) })

  // Footer
  page.drawText('Tip: Save the annotated copy via Export, or shrink it via Compress.', {
    x: 50, y: 60, size: 9, font, color: SLATE_400
  })

  const bytes = await pdf.save()
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' })
  return new File([blob], 'Universal-PDF-example.pdf', { type: 'application/pdf' })
}
