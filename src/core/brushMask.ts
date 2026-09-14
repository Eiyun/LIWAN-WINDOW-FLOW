import type { BrushPoint, BrushStroke, CanvasDimensions, DetectionResult } from '../types'
import { selectionMaskResult, selectionMaskSize } from './selectionMask'

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value))
const smoothstep = (value: number) => value * value * (3 - 2 * value)

function interpolate(a: BrushPoint, b: BrushPoint, amount: number): BrushPoint {
  return {
    x: a.x + (b.x - a.x) * amount,
    y: a.y + (b.y - a.y) * amount,
    pressure: a.pressure + (b.pressure - a.pressure) * amount,
  }
}

function stamp(mask: Float32Array, maskWidth: number, maskHeight: number, dimensions: CanvasDimensions, stroke: BrushStroke, point: BrushPoint) {
  const pressure = point.pressure > 0 ? 0.72 + point.pressure * 0.28 : 1
  const radiusX = (stroke.size * pressure * 0.5 / dimensions.width) * maskWidth
  const radiusY = (stroke.size * pressure * 0.5 / dimensions.height) * maskHeight
  const centerX = point.x / dimensions.width * maskWidth
  const centerY = point.y / dimensions.height * maskHeight
  const left = Math.max(0, Math.floor(centerX - radiusX - 1))
  const right = Math.min(maskWidth - 1, Math.ceil(centerX + radiusX + 1))
  const top = Math.max(0, Math.floor(centerY - radiusY - 1))
  const bottom = Math.min(maskHeight - 1, Math.ceil(centerY + radiusY + 1))

  for (let y = top; y <= bottom; y += 1) {
    for (let x = left; x <= right; x += 1) {
      const dx = (x + 0.5 - centerX) / Math.max(0.001, radiusX)
      const dy = (y + 0.5 - centerY) / Math.max(0.001, radiusY)
      const distance = Math.hypot(dx, dy)
      if (distance >= 1) continue
      const edge = clamp((1 - distance) / Math.max(0.03, 1 - stroke.hardness))
      const strength = distance <= stroke.hardness ? 1 : smoothstep(edge)
      const index = y * maskWidth + x
      mask[index] = stroke.operation === 'add'
        ? Math.max(mask[index], strength)
        : mask[index] * (1 - strength)
    }
  }
}

export class BrushMaskBuilder {
  static fromStrokes(strokes: BrushStroke[], dimensions: CanvasDimensions): DetectionResult | null {
    if (strokes.length === 0) return null
    const { width: maskWidth, height: maskHeight } = selectionMaskSize(dimensions)
    const mask = new Float32Array(maskWidth * maskHeight)

    for (const stroke of strokes) {
      if (stroke.points.length === 0) continue
      stamp(mask, maskWidth, maskHeight, dimensions, stroke, stroke.points[0])
      for (let index = 1; index < stroke.points.length; index += 1) {
        const previous = stroke.points[index - 1]
        const current = stroke.points[index]
        const distance = Math.hypot(current.x - previous.x, current.y - previous.y)
        const steps = Math.max(1, Math.ceil(distance / Math.max(3, stroke.size * 0.2)))
        for (let step = 1; step <= steps; step += 1) stamp(mask, maskWidth, maskHeight, dimensions, stroke, interpolate(previous, current, step / steps))
      }
    }

    return selectionMaskResult(mask, maskWidth, maskHeight)
  }
}
