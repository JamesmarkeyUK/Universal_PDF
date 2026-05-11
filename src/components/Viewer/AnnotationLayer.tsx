import { useRef, useState } from 'react'
import { Stage, Layer, Line, Rect, Text, Group, Image as KonvaImage } from 'react-konva'
import type Konva from 'konva'
import { useAnnotationStore } from '../../stores/annotationStore'
import { useSignatureStore } from '../../stores/signatureStore'
import { useImage } from '../../lib/useImage'
import type { ImageAnnotation } from '../../types/annotations'

function SignatureImage({ a }: { a: ImageAnnotation }) {
  const img = useImage(a.src)
  if (!img) return null
  return <KonvaImage image={img} x={a.x} y={a.y} width={a.width} height={a.height} />
}

interface Props {
  pageIndex: number
  width: number
  height: number
}

export default function AnnotationLayer({ pageIndex, width, height }: Props) {
  const tool = useAnnotationStore((s) => s.tool)
  const color = useAnnotationStore((s) => s.color)
  const strokeWidth = useAnnotationStore((s) => s.strokeWidth)
  const fontSize = useAnnotationStore((s) => s.fontSize)
  const allAnnotations = useAnnotationStore((s) => s.annotations)
  const add = useAnnotationStore((s) => s.add)

  const annotations = allAnnotations.filter((a) => a.pageIndex === pageIndex)

  const drawingRef = useRef(false)
  const [currentLine, setCurrentLine] = useState<number[] | null>(null)

  function getPos(e: Konva.KonvaEventObject<PointerEvent>) {
    return e.target.getStage()!.getPointerPosition()!
  }

  function onPointerDown(e: Konva.KonvaEventObject<PointerEvent>) {
    const pos = getPos(e)
    if (tool === 'draw') {
      drawingRef.current = true
      setCurrentLine([pos.x, pos.y])
    } else if (tool === 'text') {
      const text = window.prompt('Enter text:')
      if (text) {
        add({
          id: crypto.randomUUID(),
          pageIndex,
          type: 'text',
          x: pos.x,
          y: pos.y,
          text,
          color,
          fontSize
        })
      }
    } else if (tool === 'tick' || tool === 'cross') {
      add({
        id: crypto.randomUUID(),
        pageIndex,
        type: tool,
        x: pos.x - 14,
        y: pos.y - 14,
        size: 28,
        color
      })
    } else if (tool === 'rect') {
      drawingRef.current = true
      setCurrentLine([pos.x, pos.y, pos.x, pos.y])
    } else if (tool === 'signature') {
      const sigState = useSignatureStore.getState()
      const active = sigState.signatures.find((x) => x.id === sigState.activeId)
      if (active) {
        const targetW = 160
        const ratio = active.height / active.width
        add({
          id: crypto.randomUUID(),
          pageIndex,
          type: 'image',
          x: pos.x - targetW / 2,
          y: pos.y - (targetW * ratio) / 2,
          width: targetW,
          height: targetW * ratio,
          src: active.dataUrl
        })
      }
    }
  }

  function onPointerMove(e: Konva.KonvaEventObject<PointerEvent>) {
    if (!drawingRef.current) return
    const pos = getPos(e)
    setCurrentLine((prev) => {
      if (!prev) return null
      if (tool === 'rect') {
        return [prev[0], prev[1], pos.x, pos.y]
      }
      return [...prev, pos.x, pos.y]
    })
  }

  function onPointerUp() {
    if (drawingRef.current && currentLine) {
      if (tool === 'draw' && currentLine.length >= 4) {
        add({
          id: crypto.randomUUID(),
          pageIndex,
          type: 'draw',
          points: currentLine,
          color,
          strokeWidth
        })
      } else if (tool === 'rect') {
        const [x1, y1, x2, y2] = currentLine
        const x = Math.min(x1, x2)
        const y = Math.min(y1, y2)
        const w = Math.abs(x2 - x1)
        const h = Math.abs(y2 - y1)
        if (w > 4 && h > 4) {
          add({
            id: crypto.randomUUID(),
            pageIndex,
            type: 'rect',
            x,
            y,
            width: w,
            height: h,
            color
          })
        }
      }
    }
    drawingRef.current = false
    setCurrentLine(null)
  }

  const cursor = tool === 'select' ? 'default' : 'crosshair'

  return (
    <Stage
      width={width}
      height={height}
      style={{
        position: 'absolute',
        inset: 0,
        cursor,
        touchAction: 'none',
        pointerEvents: tool === 'select' ? 'none' : 'auto'
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <Layer>
        {annotations.map((a) => {
          switch (a.type) {
            case 'draw':
              return (
                <Line
                  key={a.id}
                  points={a.points}
                  stroke={a.color}
                  strokeWidth={a.strokeWidth}
                  lineCap="round"
                  lineJoin="round"
                  tension={0.4}
                />
              )
            case 'text':
              return (
                <Text
                  key={a.id}
                  x={a.x}
                  y={a.y}
                  text={a.text}
                  fill={a.color}
                  fontSize={a.fontSize}
                />
              )
            case 'rect':
              return (
                <Rect
                  key={a.id}
                  x={a.x}
                  y={a.y}
                  width={a.width}
                  height={a.height}
                  stroke={a.color}
                  strokeWidth={2}
                />
              )
            case 'tick': {
              const s = a.size
              return (
                <Line
                  key={a.id}
                  points={[a.x, a.y + s * 0.55, a.x + s * 0.35, a.y + s * 0.9, a.x + s, a.y + s * 0.1]}
                  stroke={a.color}
                  strokeWidth={3.5}
                  lineCap="round"
                  lineJoin="round"
                />
              )
            }
            case 'cross': {
              const s = a.size
              return (
                <Group key={a.id}>
                  <Line
                    points={[a.x, a.y, a.x + s, a.y + s]}
                    stroke={a.color}
                    strokeWidth={3.5}
                    lineCap="round"
                  />
                  <Line
                    points={[a.x + s, a.y, a.x, a.y + s]}
                    stroke={a.color}
                    strokeWidth={3.5}
                    lineCap="round"
                  />
                </Group>
              )
            }
            case 'image':
              return <SignatureImage key={a.id} a={a} />
            default:
              return null
          }
        })}

        {currentLine && tool === 'draw' && (
          <Line
            points={currentLine}
            stroke={color}
            strokeWidth={strokeWidth}
            lineCap="round"
            lineJoin="round"
            tension={0.4}
          />
        )}
        {currentLine && tool === 'rect' && (() => {
          const [x1, y1, x2, y2] = currentLine
          return (
            <Rect
              x={Math.min(x1, x2)}
              y={Math.min(y1, y2)}
              width={Math.abs(x2 - x1)}
              height={Math.abs(y2 - y1)}
              stroke={color}
              strokeWidth={2}
              dash={[6, 4]}
            />
          )
        })()}
      </Layer>
    </Stage>
  )
}
