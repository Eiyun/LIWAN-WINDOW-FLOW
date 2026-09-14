import type { CanvasDimensions } from '../types'

export interface ClientPoint {
  clientX: number
  clientY: number
}

export function clientPointToCanvas(point: ClientPoint, bounds: DOMRect, dimensions: CanvasDimensions) {
  return {
    x: ((point.clientX - bounds.left) / bounds.width) * dimensions.width,
    y: ((point.clientY - bounds.top) / bounds.height) * dimensions.height,
  }
}
