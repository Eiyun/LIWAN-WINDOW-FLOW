import type { CanvasDimensions, CanvasRatio, FrameId } from '../types'

export const CANVAS_PRESETS: Record<CanvasRatio, CanvasDimensions> = {
  '1x1': { width: 1080, height: 1080 },
  '9x16': { width: 1080, height: 1920 },
  '4x3': { width: 1440, height: 1080 },
}

export const FRAME_MANIFEST: Array<{ id: FrameId; name: string; english: string }> = [
  { id: 'frame01', name: '蓝绿白玻璃窗', english: 'Blue Green Glass' },
  { id: 'frame02', name: '彩色几何海棠窗', english: 'Geometric Begonia' },
  { id: 'frame03', name: '深色木格圆窗', english: 'Dark Wood Circle' },
  { id: 'frame04', name: '蓝白红八角彩窗', english: 'Octagonal Glass' },
  { id: 'frame05', name: '红黄花瓣圆窗', english: 'Petal Circle' },
]

export function frameUrl(ratio: CanvasRatio, frameId: FrameId) {
  return `./frames/${ratio}/${frameId}.png`
}

export async function loadFrameDataUrl(ratio: CanvasRatio, frameId: FrameId) {
  const response = await fetch(frameUrl(ratio, frameId))
  if (!response.ok) throw new Error('花窗资源加载失败。')
  const blob = await response.blob()
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('花窗资源读取失败。'))
    reader.readAsDataURL(blob)
  })
}
