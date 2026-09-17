import type { CanvasDimensions, CanvasRatio, FrameId } from '../types'
import { createFrameOpeningMask, findFrameBounds, landscapeFrameSlices, type FrameBounds, type FrameOpening } from './FrameOpeningMask'

export const CANVAS_PRESETS: Record<CanvasRatio, CanvasDimensions> = {
  '1x1': { width: 1080, height: 1080 },
  '9x16': { width: 1080, height: 1920 },
  '16x9': { width: 1920, height: 1080 },
}

export const FRAME_MANIFEST: Array<{ id: FrameId; name: string; english: string }> = [
  { id: 'frame01', name: '蓝绿白玻璃窗', english: 'Blue Green Glass' },
  { id: 'frame02', name: '彩色几何海棠窗', english: 'Geometric Begonia' },
  { id: 'frame03', name: '深色木格圆窗', english: 'Dark Wood Circle' },
  { id: 'frame04', name: '蓝白红八角彩窗', english: 'Octagonal Glass' },
  { id: 'frame05', name: '红黄花瓣圆窗', english: 'Petal Circle' },
]

export function frameUrl(ratio: CanvasRatio, frameId: FrameId) {
  return `./frames/${ratio === '16x9' ? '4x3' : ratio}/${frameId}.png`
}

export interface FrameAsset {
  dataUrl: string
  opening: FrameOpening
}

function frameSvg(sourceDataUrl: string, sourceWidth: number, sourceHeight: number, bounds: FrameBounds, ratio: CanvasRatio) {
  const dimensions = CANVAS_PRESETS[ratio]
  if (ratio !== '16x9') {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${dimensions.width}" height="${dimensions.height}" viewBox="${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}" preserveAspectRatio="none"><image href="${sourceDataUrl}" width="${sourceWidth}" height="${sourceHeight}"/></svg>`
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  }

  const { sourceSide, destinationSide, destinationCenter } = landscapeFrameSlices(bounds, dimensions)
  const sourceCenter = bounds.width - sourceSide * 2
  const rightX = destinationSide + destinationCenter
  const rightSourceX = bounds.x + bounds.width - sourceSide
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${dimensions.width}" height="${dimensions.height}" viewBox="0 0 ${dimensions.width} ${dimensions.height}"><defs><image id="frame-source" href="${sourceDataUrl}" xlink:href="${sourceDataUrl}" width="${sourceWidth}" height="${sourceHeight}"/></defs><svg x="0" y="0" width="${destinationSide}" height="${dimensions.height}" viewBox="${bounds.x} ${bounds.y} ${sourceSide} ${bounds.height}" preserveAspectRatio="none"><use href="#frame-source" xlink:href="#frame-source"/></svg><svg x="${destinationSide}" y="0" width="${destinationCenter}" height="${dimensions.height}" viewBox="${bounds.x + sourceSide} ${bounds.y} ${sourceCenter} ${bounds.height}" preserveAspectRatio="none"><use href="#frame-source" xlink:href="#frame-source"/></svg><svg x="${rightX}" y="0" width="${destinationSide}" height="${dimensions.height}" viewBox="${rightSourceX} ${bounds.y} ${sourceSide} ${bounds.height}" preserveAspectRatio="none"><use href="#frame-source" xlink:href="#frame-source"/></svg></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export async function loadFrameAsset(ratio: CanvasRatio, frameId: FrameId): Promise<FrameAsset> {
  const response = await fetch(frameUrl(ratio, frameId))
  if (!response.ok) throw new Error('花窗资源加载失败。')
  const blob = await response.blob()
  const sourceDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('花窗资源读取失败。'))
    reader.readAsDataURL(blob)
  })
  const image = await createImageBitmap(blob)
  try {
    const bounds = findFrameBounds(image)
    const opening = createFrameOpeningMask(image, CANVAS_PRESETS[ratio], ratio, bounds)
    return {
      dataUrl: frameSvg(sourceDataUrl, image.width, image.height, bounds, ratio),
      opening,
    }
  } finally {
    image.close()
  }
}
