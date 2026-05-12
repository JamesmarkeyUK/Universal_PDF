import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  Stage,
  Layer,
  Line,
  Rect,
  Text,
  Group,
  Image as KonvaImage,
  Transformer
} from 'react-konva'
import type Konva from 'konva'
import { useAnnotationStore } from '../../stores/annotationStore'
import { useSignatureStore } from '../../stores/signatureStore'
import { useImage } from '../../lib/useImage'
import type { Annotation, ImageAnnotation, TextAnnotation } from '../../types/annotations'

interface Props {
  pageIndex: number
  width: number
  height: number
}

function isResizable(a: Annotation): boolean {
  return a.type === 'image' || a.type === 'rect'
}

function SignatureImage({
  a,
  shapeRef,
  draggable,
  onClick,
  onDragEnd,
  onTransformEnd
}: {
  a: ImageAnnotation
  shapeRef: (n: Konva.Node | null) => void
  draggable: boolean
  onClick: () => void
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void
  onTransformEnd: (e: Konva.KonvaEventObject<Event>) => void
}) {
  const img = useImage(a.src)
  if (!img) return null
  return (
    <KonvaImage
      ref={shapeRef}
      image={img}
      x={a.x}
      y={a.y}
      width={a.width}
      height={a.height}
      draggable={draggable}
      onClick={onClick}
      onTap={onClick}
      onDragEnd={onDragEnd}
      onTransformEnd={onTransformEnd}
    />
  )
}

export default function AnnotationLayer({ pageIndex, width, height }: Props) {
  const tool = useAnnotationStore((s) => s.tool)
  const color = useAnnotationStore((s) => s.color)
  const strokeWidth = useAnnotationStore((s) => s.strokeWidth)
  const fontSize = useAnnotationStore((s) => s.fontSize)
  const allAnnotations = useAnnotationStore((s) => s.annotations)
  const selectedId = useAnnotationStore((s) => s.selectedId)
  const add = useAnnotationStore((s) => s.add)
  const update = useAnnotationStore((s) => s.update)
  const remove = useAnnotationStore((s) => s.remove)
  const setSelected = useAnnotationStore((s) => s.setSelected)

  const annotations = allAnnotations.filter((a) => a.pageIndex === pageIndex)

  const drawingRef = useRef(false)
  const [currentLine, setCurrentLine] = useState<number[] | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const editingAnnotation = annotations.find(
    (a) => a.id === editingId && a.type === 'text'
  ) as TextAnnotation | undefined

  const trRef = useRef<Konva.Transformer>(null)
  const shapeRefs = useRef(new Map<string, Konva.Node>())

  useEffect(() => {
    const tr = trRef.current
    if (!tr) return
    const selected = annotations.find((a) => a.id === selectedId)
    if (selected && isResizable(selected) && !editingId) {
      const node = shapeRefs.current.get(selected.id)
      if (node) {
        tr.nodes([node])
        tr.getLayer()?.batchDraw()
        return
      }
    }
    tr.nodes([])
    tr.getLayer()?.batchDraw()
  }, [selectedId, annotations, editingId])

  function getPos(e: Konva.KonvaEventObject<PointerEvent>) {
    return e.target.getStage()!.getPointerPosition()!
  }

  function onPointerDown(e: Konva.KonvaEventObject<PointerEvent>) {
    if (editingId) return // ignore stage events while typing
    if (tool === 'select') {
      if (e.target === e.target.getStage()) setSelected(null)
      return
    }
    const pos = getPos(e)
    if (tool === 'draw') {
      drawingRef.current = true
      setCurrentLine([pos.x, pos.y])
    } else if (tool === 'text') {
      const id = crypto.randomUUID()
      add({
        id,
        pageIndex,
        type: 'text',
        x: pos.x,
        y: pos.y,
        text: '',
        color,
        fontSize
      })
      setEditingId(id)
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
        // After placing a signature, switch to select so the user can
        // immediately drag, resize, or delete it.
        useAnnotationStore.getState().setTool('select')
      }
    }
  }

  function onPointerMove(e: Konva.KonvaEventObject<PointerEvent>) {
    if (!drawingRef.current) return
    const pos = getPos(e)
    setCurrentLine((prev) => {
      if (!prev) return null
      if (tool === 'rect') return [prev[0], prev[1], pos.x, pos.y]
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

  function shapeRefSetter(id: string) {
    return (node: Konva.Node | null) => {
      if (node) shapeRefs.current.set(id, node)
      else shapeRefs.current.delete(id)
    }
  }

  function onShapeClick(id: string) {
    if (tool !== 'select') return
    setSelected(id)
  }

  function onTextDblClick(a: TextAnnotation) {
    if (tool !== 'select') return
    setEditingId(a.id)
    setSelected(a.id)
  }

  function onShapeDragEnd(a: Annotation, e: Konva.KonvaEventObject<DragEvent>) {
    const node = e.target
    if (a.type === 'draw') {
      const dx = node.x()
      const dy = node.y()
      const next = a.points.map((v, i) => (i % 2 === 0 ? v + dx : v + dy))
      node.position({ x: 0, y: 0 })
      update(a.id, { points: next })
    } else {
      update(a.id, { x: node.x(), y: node.y() } as Partial<Annotation>)
    }
  }

  function onShapeTransformEnd(a: Annotation, e: Konva.KonvaEventObject<Event>) {
    const node = e.target
    if (a.type === 'image' || a.type === 'rect') {
      const newWidth = Math.max(8, node.width() * node.scaleX())
      const newHeight = Math.max(8, node.height() * node.scaleY())
      node.scaleX(1)
      node.scaleY(1)
      update(a.id, {
        x: node.x(),
        y: node.y(),
        width: newWidth,
        height: newHeight
      } as Partial<Annotation>)
    }
  }

  function commitEdit(value: string) {
    if (!editingAnnotation) return
    const trimmed = value
    if (!trimmed.trim()) {
      remove(editingAnnotation.id)
    } else {
      update(editingAnnotation.id, { text: trimmed })
    }
    setEditingId(null)
  }

  const selectable = tool === 'select'
  const cursor = tool === 'select' ? 'default' : 'crosshair'
  // In select mode let the browser handle vertical scroll + pinch-zoom so the
  // PDF stays usable on touch screens. Konva still captures shape drags from
  // direct hits on annotations. In creation modes we need exclusive control of
  // touch input so drawing doesn't scroll the page.
  const touchAction = tool === 'select' ? 'pan-y pinch-zoom' : 'none'

  return (
    <>
      <Stage
        width={width}
        height={height}
        style={{
          position: 'absolute',
          inset: 0,
          cursor,
          touchAction
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <Layer>
          {annotations.map((a) => {
            const common = {
              draggable: selectable,
              onClick: () => onShapeClick(a.id),
              onTap: () => onShapeClick(a.id),
              onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) =>
                onShapeDragEnd(a, e),
              ref: shapeRefSetter(a.id)
            }

            switch (a.type) {
              case 'draw':
                return (
                  <Line
                    key={a.id}
                    {...common}
                    x={0}
                    y={0}
                    points={a.points}
                    stroke={a.color}
                    strokeWidth={a.strokeWidth}
                    lineCap="round"
                    lineJoin="round"
                    tension={0.4}
                    hitStrokeWidth={Math.max(20, a.strokeWidth + 14)}
                  />
                )
              case 'text':
                return (
                  <Text
                    key={a.id}
                    {...common}
                    x={a.x}
                    y={a.y}
                    text={a.text}
                    fill={a.color}
                    fontSize={a.fontSize}
                    visible={a.id !== editingId}
                    onDblClick={() => onTextDblClick(a)}
                    onDblTap={() => onTextDblClick(a)}
                  />
                )
              case 'rect':
                return (
                  <Rect
                    key={a.id}
                    {...common}
                    x={a.x}
                    y={a.y}
                    width={a.width}
                    height={a.height}
                    stroke={a.color}
                    strokeWidth={2}
                    onTransformEnd={(e) => onShapeTransformEnd(a, e)}
                  />
                )
              case 'tick': {
                const s = a.size
                return (
                  <Group key={a.id} {...common} x={a.x} y={a.y}>
                    <Line
                      points={[0, s * 0.55, s * 0.35, s * 0.9, s, s * 0.1]}
                      stroke={a.color}
                      strokeWidth={3.5}
                      lineCap="round"
                      lineJoin="round"
                      hitStrokeWidth={24}
                    />
                  </Group>
                )
              }
              case 'cross': {
                const s = a.size
                return (
                  <Group key={a.id} {...common} x={a.x} y={a.y}>
                    <Line
                      points={[0, 0, s, s]}
                      stroke={a.color}
                      strokeWidth={3.5}
                      lineCap="round"
                      hitStrokeWidth={20}
                    />
                    <Line
                      points={[s, 0, 0, s]}
                      stroke={a.color}
                      strokeWidth={3.5}
                      lineCap="round"
                      hitStrokeWidth={20}
                    />
                  </Group>
                )
              }
              case 'image':
                return (
                  <SignatureImage
                    key={a.id}
                    a={a}
                    shapeRef={shapeRefSetter(a.id)}
                    draggable={selectable}
                    onClick={() => onShapeClick(a.id)}
                    onDragEnd={(e) => onShapeDragEnd(a, e)}
                    onTransformEnd={(e) => onShapeTransformEnd(a, e)}
                  />
                )
              default:
                return null
            }
          })}

          {currentLine && tool === 'draw' && (
            <Line
              listening={false}
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
                listening={false}
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

          <Transformer
            ref={trRef}
            rotateEnabled={false}
            keepRatio={
              annotations.find((a) => a.id === selectedId)?.type === 'image'
            }
            enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
            boundBoxFunc={(_oldBox, newBox) => {
              if (newBox.width < 12 || newBox.height < 12) return _oldBox
              return newBox
            }}
          />
        </Layer>
      </Stage>

      {editingAnnotation && (
        <TextEditor
          annotation={editingAnnotation}
          onCommit={commitEdit}
          onCancel={() => {
            if (!editingAnnotation.text.trim()) {
              remove(editingAnnotation.id)
            }
            setEditingId(null)
          }}
        />
      )}
    </>
  )
}

function TextEditor({
  annotation,
  onCommit,
  onCancel
}: {
  annotation: TextAnnotation
  onCommit: (value: string) => void
  onCancel: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState(annotation.text)
  // Suppress the very first blur so a focus race in Firefox doesn't silently
  // delete the empty annotation before the user gets a chance to type.
  const justMountedRef = useRef(true)

  // Focus synchronously after DOM mutations, then again on the next frame as
  // a safety net for browsers that drop the first focus call.
  useLayoutEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])
  useEffect(() => {
    const t = requestAnimationFrame(() => {
      if (document.activeElement !== inputRef.current) {
        inputRef.current?.focus()
        inputRef.current?.select()
      }
      justMountedRef.current = false
    })
    return () => cancelAnimationFrame(t)
  }, [])

  return (
    <input
      autoFocus
      ref={inputRef}
      type="text"
      inputMode="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        // If we blur in the same frame as mount (focus never landed), keep
        // the editor open instead of silently removing an empty annotation.
        if (justMountedRef.current) {
          inputRef.current?.focus()
          return
        }
        onCommit(value)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          onCommit(value)
        } else if (e.key === 'Escape') {
          e.preventDefault()
          onCancel()
        }
      }}
      style={{
        position: 'absolute',
        left: annotation.x,
        top: annotation.y,
        color: annotation.color,
        fontSize: annotation.fontSize + 'px',
        fontFamily: 'sans-serif',
        lineHeight: 1,
        background: 'transparent',
        border: '1px dashed #ea580c',
        outline: 'none',
        padding: '0 2px',
        minWidth: '120px',
        width: Math.max(120, value.length * annotation.fontSize * 0.6 + 24) + 'px',
        height: annotation.fontSize * 1.25 + 'px',
        zIndex: 10
      }}
    />
  )
}
