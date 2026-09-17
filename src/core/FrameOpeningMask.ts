import type { CanvasDimensions, CanvasRatio } from '../types'

export interface FrameOpening {
  dataUrl: string
  pixels: Uint8Array
  width: number
  height: number
}

export interface FrameBounds {
  x: number
  y: number
  width: number
  height: number
}

const LANDSCAPE_SIDE_FRACTION = 0.16

export function findFrameBounds(image: CanvasImageSource & { width: number; height: number }): FrameBounds {
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('无法分析花窗边界。')
  context.drawImage(image, 0, 0)
  const data = context.getImageData(0, 0, image.width, image.height).data
  let left = image.width
  let right = -1
  let top = image.height
  let bottom = -1
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      if (data[(y * image.width + x) * 4 + 3] < 72) continue
      left = Math.min(left, x)
      right = Math.max(right, x)
      top = Math.min(top, y)
      bottom = Math.max(bottom, y)
    }
  }
  if (right < left || bottom < top) throw new Error('花窗图片没有可见内容。')
  return { x: left, y: top, width: right - left + 1, height: bottom - top + 1 }
}

export function landscapeFrameSlices(bounds: FrameBounds, dimensions: CanvasDimensions) {
  const sourceSide = bounds.width * LANDSCAPE_SIDE_FRACTION
  const destinationSide = sourceSide * dimensions.height / bounds.height
  return { sourceSide, destinationSide, destinationCenter: dimensions.width - destinationSide * 2 }
}

export function drawFrameToCanvas(
  image: CanvasImageSource & { width: number; height: number },
  context: CanvasRenderingContext2D,
  dimensions: CanvasDimensions,
  ratio: CanvasRatio,
  bounds: FrameBounds,
) {
  if (ratio !== '16x9') {
    context.drawImage(image, bounds.x, bounds.y, bounds.width, bounds.height, 0, 0, dimensions.width, dimensions.height)
    return
  }

  const { sourceSide, destinationSide, destinationCenter } = landscapeFrameSlices(bounds, dimensions)
  context.drawImage(image, bounds.x, bounds.y, sourceSide, bounds.height, 0, 0, destinationSide, dimensions.height)
  context.drawImage(image, bounds.x + sourceSide, bounds.y, bounds.width - sourceSide * 2, bounds.height, destinationSide, 0, destinationCenter, dimensions.height)
  context.drawImage(image, bounds.x + bounds.width - sourceSide, bounds.y, sourceSide, bounds.height, destinationSide + destinationCenter, 0, destinationSide, dimensions.height)
}

export function createFrameOpeningMask(
  image: CanvasImageSource & { width: number; height: number },
  dimensions: CanvasDimensions,
  ratio: CanvasRatio,
  bounds: FrameBounds,
): FrameOpening {
  const width = Math.round(dimensions.width / 2)
  const height = Math.round(dimensions.height / 2)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('无法分析花窗开口。')
  context.clearRect(0, 0, width, height)
  drawFrameToCanvas(image, context, { width, height }, ratio, bounds)
  const frame = context.getImageData(0, 0, width, height)
  const pixels = new Uint8Array(width * height)
  const queue = new Int32Array(pixels.length)
  const center = Math.floor(height / 2) * width + Math.floor(width / 2)
  if (frame.data[center * 4 + 3] > 72) throw new Error('花窗中央开口不透明，无法裁切底图。')

  let read = 0
  let write = 1
  queue[0] = center
  pixels[center] = 1
  while (read < write) {
    const current = queue[read++]
    const x = current % width
    const y = Math.floor(current / width)
    const neighbours = [x > 0 ? current - 1 : -1, x < width - 1 ? current + 1 : -1, y > 0 ? current - width : -1, y < height - 1 ? current + width : -1]
    for (const next of neighbours) {
      if (next < 0 || pixels[next] || frame.data[next * 4 + 3] > 72) continue
      pixels[next] = 1
      queue[write++] = next
    }
  }

  const mask = context.createImageData(width, height)
  for (let index = 0; index < pixels.length; index++) {
    if (!pixels[index]) continue
    const offset = index * 4
    mask.data[offset] = 255
    mask.data[offset + 1] = 255
    mask.data[offset + 2] = 255
    mask.data[offset + 3] = 255
  }
  context.putImageData(mask, 0, 0)
  return { dataUrl: canvas.toDataURL('image/png'), pixels, width, height }
}

export function isInsideFrameOpening(opening: FrameOpening, x: number, y: number, dimensions: CanvasDimensions) {
  const column = Math.floor(x / dimensions.width * opening.width)
  const row = Math.floor(y / dimensions.height * opening.height)
  return column >= 0 && column < opening.width && row >= 0 && row < opening.height && opening.pixels[row * opening.width + column] === 1
}
