import { useRef, useState } from 'react'
import { clientPointToCanvas } from '../core/transformCoordinates'
import type { BrushPoint, BrushSettings, BrushStroke, CanvasDimensions } from '../types'

interface BrushSelectionProps {
  active: boolean
  settings: BrushSettings
  frameColor: string
  dimensions: CanvasDimensions
  onStrokeComplete: (stroke: BrushStroke) => void
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
const makeId = () => globalThis.crypto?.randomUUID?.() || `stroke-${Date.now()}-${Math.random().toString(16).slice(2)}`

export function BrushSelection({ active, settings, frameColor, dimensions, onStrokeComplete }: BrushSelectionProps) {
  const drawing = useRef(false)
  const pointsRef = useRef<BrushPoint[]>([])
  const [previewPoints, setPreviewPoints] = useState<BrushPoint[]>([])
  const [cursor, setCursor] = useState<BrushPoint | null>(null)

  const pointerPosition = (event: React.PointerEvent<SVGRectElement>): BrushPoint => {
    const bounds = event.currentTarget.ownerSVGElement?.getBoundingClientRect()
    if (!bounds) return { x: 0, y: 0, pressure: 1 }
    const margin = Math.min(dimensions.width, dimensions.height) * .04
    const point = clientPointToCanvas(event, bounds, dimensions)
    return {
      x: clamp(point.x, margin, dimensions.width - margin),
      y: clamp(point.y, margin, dimensions.height - margin),
      pressure: event.pressure > 0 ? event.pressure : 0.5,
    }
  }

  const begin = (event: React.PointerEvent<SVGRectElement>) => {
    if (!active || event.button !== 0) return
    event.preventDefault()
    const point = pointerPosition(event)
    drawing.current = true
    pointsRef.current = [point]
    setPreviewPoints([point])
    setCursor(point)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const move = (event: React.PointerEvent<SVGRectElement>) => {
    if (!active) return
    const point = pointerPosition(event)
    setCursor(point)
    if (!drawing.current) return
    event.preventDefault()
    const previous = pointsRef.current.at(-1)
    if (previous && Math.hypot(point.x - previous.x, point.y - previous.y) < 2) return
    pointsRef.current = [...pointsRef.current, point]
    setPreviewPoints(pointsRef.current)
  }

  const finish = (event: React.PointerEvent<SVGRectElement>, cancelled = false) => {
    if (!drawing.current) return
    event.preventDefault()
    drawing.current = false
    const points = cancelled ? [...pointsRef.current] : [...pointsRef.current, pointerPosition(event)]
    pointsRef.current = []
    setPreviewPoints([])
    if (points.length > 0) onStrokeComplete({ id: makeId(), operation: settings.operation, size: settings.size, hardness: settings.hardness, points })
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const path = previewPoints.map((point) => `${point.x},${point.y}`).join(' ')
  const paintColor = settings.operation === 'add' ? frameColor : '#ff9f85'

  return (
    <g data-export-ignore="true" className="brush-interaction-layer">
      {previewPoints.length === 1 && <circle cx={previewPoints[0].x} cy={previewPoints[0].y} r={settings.size / 2} fill={paintColor} opacity=".34" />}
      {previewPoints.length > 1 && (
        <>
          <polyline points={path} fill="none" stroke={paintColor} strokeWidth={settings.size * (1.18 - settings.hardness * .18)} strokeLinecap="round" strokeLinejoin="round" opacity=".15" />
          <polyline points={path} fill="none" stroke={paintColor} strokeWidth={settings.size * (.5 + settings.hardness * .5)} strokeLinecap="round" strokeLinejoin="round" opacity=".36" />
        </>
      )}
      {cursor && <circle cx={cursor.x} cy={cursor.y} r={settings.size / 2} fill="none" stroke={paintColor} strokeWidth="4" strokeDasharray="10 7" opacity=".9" pointerEvents="none" />}
      <rect
        x={Math.min(dimensions.width, dimensions.height) * .04}
        y={Math.min(dimensions.width, dimensions.height) * .04}
        width={dimensions.width - Math.min(dimensions.width, dimensions.height) * .08}
        height={dimensions.height - Math.min(dimensions.width, dimensions.height) * .08}
        fill="transparent"
        pointerEvents={active ? 'all' : 'none'}
        onPointerDown={begin}
        onPointerMove={move}
        onPointerUp={finish}
        onPointerCancel={(event) => finish(event, true)}
        onPointerLeave={() => { if (!drawing.current) setCursor(null) }}
      />
    </g>
  )
}
