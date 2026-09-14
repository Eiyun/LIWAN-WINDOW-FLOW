import type { CanvasDimensions, DetectionResult, SelectionRegion } from '../types'
import { selectionMaskResult, selectionMaskSize } from './selectionMask'

/**
 * Converts editable region shapes into the same mask format used by automatic
 * detection. New freeform shapes can be added here without touching rendering.
 */
export class RegionMaskBuilder {
  static fromSelections(selections: SelectionRegion[], dimensions: CanvasDimensions): DetectionResult | null {
    if (selections.length === 0) return null
    const { width: maskWidth, height: maskHeight } = selectionMaskSize(dimensions)
    const mask = new Float32Array(maskWidth * maskHeight)

    for (const selection of selections) {
      if (selection.shape !== 'rectangle') continue
      const left = Math.max(0, selection.x / dimensions.width)
      const top = Math.max(0, selection.y / dimensions.height)
      const right = Math.min(1, (selection.x + selection.width) / dimensions.width)
      const bottom = Math.min(1, (selection.y + selection.height) / dimensions.height)

      for (let y = 0; y < maskHeight; y += 1) {
        const normalizedY = (y + 0.5) / maskHeight
        if (normalizedY < top || normalizedY > bottom) continue
        for (let x = 0; x < maskWidth; x += 1) {
          const normalizedX = (x + 0.5) / maskWidth
          if (normalizedX >= left && normalizedX <= right) mask[y * maskWidth + x] = 1
        }
      }
    }
    return selectionMaskResult(mask, maskWidth, maskHeight)
  }
}
