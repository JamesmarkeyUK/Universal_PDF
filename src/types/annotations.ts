export type Tool =
  | 'select'
  | 'text'
  | 'draw'
  | 'rect'
  | 'tick'
  | 'cross'
  | 'image'
  | 'signature'
  | 'form'

type Base = { id: string; pageIndex: number }

export type TextAnnotation = Base & {
  type: 'text'
  x: number
  y: number
  text: string
  color: string
  fontSize: number
}

export type DrawAnnotation = Base & {
  type: 'draw'
  points: number[]
  color: string
  strokeWidth: number
}

export type RectAnnotation = Base & {
  type: 'rect'
  x: number
  y: number
  width: number
  height: number
  color: string
}

export type MarkAnnotation = Base & {
  type: 'tick' | 'cross'
  x: number
  y: number
  size: number
  color: string
}

export type ImageAnnotation = Base & {
  type: 'image'
  x: number
  y: number
  width: number
  height: number
  src: string
}

export type Annotation =
  | TextAnnotation
  | DrawAnnotation
  | RectAnnotation
  | MarkAnnotation
  | ImageAnnotation
