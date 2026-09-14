import type { CanvasDimensions, ImageDrawRect, ImageTransform, PreparedImage, SourceImage } from '../types'

export const MIN_IMAGE_SCALE = 0.25
export const MAX_IMAGE_SCALE = 4
export const DEFAULT_IMAGE_TRANSFORM: ImageTransform = { scale: 1, x: 0, y: 0 }

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

export function imagePositionLimits(dimensions: CanvasDimensions) {
  return { x: dimensions.width, y: dimensions.height }
}

export function clampImageTransform(transform: ImageTransform, dimensions: CanvasDimensions): ImageTransform {
  const limits = imagePositionLimits(dimensions)
  return {
    scale: clamp(transform.scale, MIN_IMAGE_SCALE, MAX_IMAGE_SCALE),
    x: clamp(transform.x, -limits.x, limits.x),
    y: clamp(transform.y, -limits.y, limits.y),
  }
}

export function getImageDrawRect(source: SourceImage, dimensions: CanvasDimensions, transform: ImageTransform): ImageDrawRect {
  const fitScale = Math.min(dimensions.width / source.naturalWidth, dimensions.height / source.naturalHeight)
  const drawScale = fitScale * transform.scale
  const width = source.naturalWidth * drawScale
  const height = source.naturalHeight * drawScale
  return {
    x: (dimensions.width - width) / 2 + transform.x,
    y: (dimensions.height - height) / 2 + transform.y,
    width,
    height,
  }
}

export function fitImageTransform(): ImageTransform {
  return { ...DEFAULT_IMAGE_TRANSFORM }
}

export function fillImageTransform(source: SourceImage, dimensions: CanvasDimensions): ImageTransform {
  const fitScale = Math.min(dimensions.width / source.naturalWidth, dimensions.height / source.naturalHeight)
  const fillScale = Math.max(dimensions.width / source.naturalWidth, dimensions.height / source.naturalHeight)
  return {
    scale: clamp(fillScale / Math.max(0.0001, fitScale), MIN_IMAGE_SCALE, MAX_IMAGE_SCALE),
    x: 0,
    y: 0,
  }
}

export function zoomImageTransformAtPoint(
  transform: ImageTransform,
  nextScale: number,
  anchor: { x: number; y: number },
  dimensions: CanvasDimensions,
): ImageTransform {
  const clampedScale = clamp(nextScale, MIN_IMAGE_SCALE, MAX_IMAGE_SCALE)
  const ratio = clampedScale / Math.max(MIN_IMAGE_SCALE, transform.scale)
  const imageCenter = {
    x: dimensions.width / 2 + transform.x,
    y: dimensions.height / 2 + transform.y,
  }
  return clampImageTransform({
    scale: clampedScale,
    x: anchor.x + (imageCenter.x - anchor.x) * ratio - dimensions.width / 2,
    y: anchor.y + (imageCenter.y - anchor.y) * ratio - dimensions.height / 2,
  }, dimensions)
}

export function renderTransformedImage(source: SourceImage, dimensions: CanvasDimensions, transform: ImageTransform): PreparedImage {
  const canvas = document.createElement('canvas')
  canvas.width = dimensions.width
  canvas.height = dimensions.height
  const context = canvas.getContext('2d', { willReadFrequently: true, alpha: true })
  if (!context) throw new Error('浏览器无法创建图片调整画布。')

  const rect = getImageDrawRect(source, dimensions, transform)
  context.clearRect(0, 0, dimensions.width, dimensions.height)
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(source.element, rect.x, rect.y, rect.width, rect.height)

  return {
    imageData: context.getImageData(0, 0, dimensions.width, dimensions.height),
    originalName: source.originalName,
  }
}
