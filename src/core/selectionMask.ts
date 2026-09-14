import type { CanvasDimensions, DetectionResult } from '../types'

export const SELECTION_MASK_WIDTH = 96

export function selectionMaskSize(dimensions: CanvasDimensions) {
  return { width: SELECTION_MASK_WIDTH, height: Math.max(72, Math.round(SELECTION_MASK_WIDTH * dimensions.height / dimensions.width)) }
}

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value))

function maskDataUrl(mask: Float32Array, width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('无法生成选区蒙版。')
  const imageData = context.createImageData(width, height)
  for (let index = 0; index < mask.length; index += 1) {
    const offset = index * 4
    imageData.data[offset] = 255
    imageData.data[offset + 1] = 255
    imageData.data[offset + 2] = 255
    imageData.data[offset + 3] = Math.round(clamp(mask[index]) * 255)
  }
  context.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/png')
}

export function selectionMaskResult(mask: Float32Array, width: number, height: number): DetectionResult | null {
  let covered = 0
  for (const value of mask) covered += clamp(value)
  if (covered <= 0.01) return null
  return {
    mask,
    width,
    height,
    maskDataUrl: maskDataUrl(mask, width, height),
    confidence: 1,
    coverage: covered / mask.length,
  }
}
