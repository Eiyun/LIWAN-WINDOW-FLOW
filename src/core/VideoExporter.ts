import { downloadBlob, serializeSvg } from './Exporter'

export type VideoFormat = 'webm' | 'mp4'

export interface VideoExportOptions {
  durationSeconds: 15 | 30 | 45 | 60
  format: VideoFormat
  filename: string
  signal?: AbortSignal
  onProgress?: (progress: number) => void
}

const wait = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds))

function chooseMimeType(requested: VideoFormat) {
  const candidates = requested === 'mp4'
    ? ['video/mp4;codecs=avc1.42E01E', 'video/mp4']
    : ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
  const supported = candidates.find((mime) => MediaRecorder.isTypeSupported(mime))
  if (supported) return { mimeType: supported, format: requested }
  const fallback = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find((mime) => MediaRecorder.isTypeSupported(mime))
  if (!fallback) throw new Error('当前浏览器不支持视频录制，请使用最新版 Chrome 或 Edge。')
  return { mimeType: fallback, format: 'webm' as const }
}

async function drawSvgFrame(svg: SVGSVGElement, context: CanvasRenderingContext2D, width: number, height: number, frame: CanvasImageSource | null) {
  const blob = new Blob([serializeSvg(svg, false, true)], { type: 'image/svg+xml;charset=utf-8' })
  if ('createImageBitmap' in window) {
    const bitmap = await createImageBitmap(blob)
    context.clearRect(0, 0, width, height)
    context.drawImage(bitmap, 0, 0, width, height)
    if (frame) context.drawImage(frame, 0, 0, width, height)
    bitmap.close()
    return
  }
  const url = URL.createObjectURL(blob)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error('视频画面渲染失败。'))
      element.src = url
    })
    context.clearRect(0, 0, width, height)
    context.drawImage(image, 0, 0, width, height)
    if (frame) context.drawImage(frame, 0, 0, width, height)
  } finally {
    URL.revokeObjectURL(url)
  }
}

export class VideoExporter {
  static supportsMp4() {
    return typeof MediaRecorder !== 'undefined' && (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1.42E01E') || MediaRecorder.isTypeSupported('video/mp4'))
  }

  static async export(svg: SVGSVGElement, options: VideoExportOptions) {
    if (typeof MediaRecorder === 'undefined') throw new Error('当前浏览器不支持 MediaRecorder 视频导出。')
    const box = svg.viewBox.baseVal
    const width = box.width || 1080
    const height = box.height || 1920
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d', { alpha: false })
    if (!context) throw new Error('无法创建视频画布。')
    const capture = canvas.captureStream(30)
    const chosen = chooseMimeType(options.format)
    const recorder = new MediaRecorder(capture, {
      mimeType: chosen.mimeType,
      videoBitsPerSecond: width * height > 1_700_000 ? 10_000_000 : 7_000_000,
    })
    const chunks: Blob[] = []
    let frameBitmap: ImageBitmap | null = null
    let staticFrame: CanvasImageSource | null = null
    const frameHref = svg.querySelector<SVGImageElement>('[data-layer="window-frame-png"]')?.getAttribute('href')
    if (frameHref && 'createImageBitmap' in window) {
      const response = await fetch(frameHref)
      frameBitmap = await createImageBitmap(await response.blob())
      staticFrame = frameBitmap
    } else if (frameHref) {
      staticFrame = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image()
        image.onload = () => resolve(image)
        image.onerror = () => reject(new Error('视频花窗加载失败。'))
        image.src = frameHref
      })
    }
    recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data) }
    const stopped = new Promise<void>((resolve, reject) => {
      recorder.onstop = () => resolve()
      recorder.onerror = () => reject(new Error('视频录制失败。'))
    })

    let recordingStarted = false
    try {
      svg.dispatchEvent(new Event('liwan-animation-restart'))
      await drawSvgFrame(svg, context, width, height, staticFrame)
      recorder.start(500)
      recordingStarted = true
      const startedAt = performance.now()
      const durationMs = options.durationSeconds * 1000
      while (performance.now() - startedAt < durationMs) {
        if (options.signal?.aborted) throw new DOMException('视频导出已取消。', 'AbortError')
        const frameStarted = performance.now()
        await drawSvgFrame(svg, context, width, height, staticFrame)
        options.onProgress?.(Math.min(1, (performance.now() - startedAt) / durationMs))
        await wait(Math.max(0, 1000 / 30 - (performance.now() - frameStarted)))
      }
      options.onProgress?.(1)
    } finally {
      if (recordingStarted && recorder.state !== 'inactive') recorder.stop()
      if (recordingStarted) await stopped
      capture.getTracks().forEach((track) => track.stop())
      frameBitmap?.close()
    }

    if (options.signal?.aborted) throw new DOMException('视频导出已取消。', 'AbortError')
    const extension = chosen.format
    const filename = options.filename.replace(/\.(webm|mp4)$/i, `.${extension}`)
    downloadBlob(new Blob(chunks, { type: chosen.mimeType }), filename)
    return chosen.format
  }
}
