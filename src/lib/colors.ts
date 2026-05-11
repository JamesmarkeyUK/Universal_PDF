import { rgb } from 'pdf-lib'

export function hexToPdfRgb(hex: string) {
  const m = hex.replace('#', '')
  const r = parseInt(m.slice(0, 2), 16) / 255
  const g = parseInt(m.slice(2, 4), 16) / 255
  const b = parseInt(m.slice(4, 6), 16) / 255
  return rgb(r, g, b)
}
