import type { AnimationSettings, CanvasDimensions } from '../types'
import { AnimationEngine } from './AnimationEngine'
import { downloadBlob, serializeSvgInPlace } from './Exporter'

export type VideoFormat = 'webm' | 'mp4'

export interface VideoExportOptions {
  durationSeconds: 15 | 30 | 45 | 60
  format: VideoFormat
  animation: AnimationSettings
  filename: string
  signal?: AbortSignal
  onProgress?: (progress: number) => void
}

const FRAME_RATE = 24
const videoBitrate = (dimensions: CanvasDimensions) => dimensions.width * dimensions.height > 1_700_000 ? 7_000_000 : 5_000_000
const abortError = () => new DOMException('视频导出已取消。', 'AbortError')

async function loadWindowFrame(svg: SVGSVGElement) {
  const href = svg.querySelector<SVGImageElement>('[data-layer="window-frame-png"]')?.getAttribute('href')
  if (!href) return null
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('视频花窗加载失败。'))
    image.src = href
  })
}

async function drawSvgFrame(
  svg: SVGSVGElement,
  context: CanvasRenderingContext2D,
  dimensions: CanvasDimensions,
  frame: HTMLImageElement | null,
) {
  const blob = new Blob([serializeSvgInPlace(svg)], { type: 'image/svg+xml;charset=utf-8' })
  context.clearRect(0, 0, dimensions.width, dimensions.height)
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(blob)
      context.drawImage(bitmap, 0, 0, dimensions.width, dimensions.height)
      bitmap.close()
      if (frame) context.drawImage(frame, 0, 0, dimensions.width, dimensions.height)
      return
    } catch {
      // Some browsers expose createImageBitmap but cannot decode SVG blobs.
    }
  }

  const url = URL.createObjectURL(blob)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error('视频画面渲染失败。'))
      element.src = url
    })
    context.drawImage(image, 0, 0, dimensions.width, dimensions.height)
    if (frame) context.drawImage(frame, 0, 0, dimensions.width, dimensions.height)
  } finally {
    URL.revokeObjectURL(url)
  }
}

export class VideoExporter {
  static supportsMp4() {
    return typeof VideoEncoder !== 'undefined'
  }

  static async export(svg: SVGSVGElement, options: VideoExportOptions): Promise<VideoFormat> {
    if (options.signal?.aborted) throw abortError()
    await document.fonts?.ready
    const box = svg.viewBox.baseVal
    const dimensions = { width: box.width || 1080, height: box.height || 1920 }
    const canvas = document.createElement('canvas')
    canvas.width = dimensions.width
    canvas.height = dimensions.height
    const context = canvas.getContext('2d', { alpha: false })
    if (!context) throw new Error('无法创建视频画布。')

    if (typeof VideoEncoder === 'undefined') throw new Error('当前浏览器不支持本地视频编码。请使用最新版 Chrome、Edge 或 Safari。')
    const { BufferTarget, CanvasSource, Mp4OutputFormat, Output, Quality, WebMOutputFormat, getFirstEncodableVideoCodec } = await import('mediabunny')
    const format = options.format === 'mp4' ? new Mp4OutputFormat() : new WebMOutputFormat()
    const candidates = options.format === 'mp4' ? ['avc'] as const : ['vp9', 'vp8'] as const
    const codec = await getFirstEncodableVideoCodec([...candidates], dimensions)
    if (!codec) throw new Error(options.format === 'mp4'
      ? '当前浏览器无法编码 H.264 MP4。请使用最新版 Chrome、Edge 或 Safari。'
      : '当前浏览器无法编码 WebM。请使用最新版 Chrome 或 Edge。')

    const target = new BufferTarget()
    const output = new Output({ format, target })
    const source = new CanvasSource(canvas, { codec, quality: new Quality({ bitrate: videoBitrate(dimensions) }) })
    output.addVideoTrack(source, { frameRate: FRAME_RATE })
    const frame = await loadWindowFrame(svg)
    const frameSvg = svg.cloneNode(true) as SVGSVGElement
    frameSvg.querySelectorAll('[data-export-ignore], [data-layer="window-frame-png"]').forEach((node) => node.remove())
    const nodes = Array.from(frameSvg.querySelectorAll<SVGTextElement>('[data-cell-opacity]'))
    const engine = new AnimationEngine()
    const totalFrames = options.durationSeconds * FRAME_RATE

    try {
      await output.start()
      for (let index = 0; index < totalFrames; index++) {
        if (options.signal?.aborted) throw abortError()
        engine.apply(nodes, index * 1000 / FRAME_RATE, options.animation, dimensions)
        await drawSvgFrame(frameSvg, context, dimensions, frame)
        await source.add(index / FRAME_RATE, 1 / FRAME_RATE, { keyFrame: index % (FRAME_RATE * 2) === 0 })
        options.onProgress?.((index + 1) / totalFrames * .98)
        if (index % 4 === 0) await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
      }
      if (options.signal?.aborted) throw abortError()
      await output.finalize()
      if (options.signal?.aborted) throw abortError()
      const buffer = target.buffer
      if (!buffer || buffer.byteLength < 1024) throw new Error('视频编码未生成有效文件。')
      const filename = options.filename.replace(/\.(webm|mp4)$/i, `.${options.format}`)
      downloadBlob(new Blob([buffer], { type: options.format === 'mp4' ? 'video/mp4' : 'video/webm' }), filename)
      options.onProgress?.(1)
      return options.format
    } catch (reason) {
      if (output.state === 'pending' || output.state === 'started') await output.cancel()
      throw reason
    }
  }
}
