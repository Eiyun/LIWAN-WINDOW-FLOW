import { DEFAULT_IMAGE_TRANSFORM, renderTransformedImage } from '../core/imageTransform'
import { STAGE_HEIGHT, STAGE_WIDTH, type CanvasDimensions, type PreparedImage, type SourceImage } from '../types'

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('无法读取这张图片，请换一张试试。'))
    image.src = src
  })

const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(String(reader.result))
  reader.onerror = () => reject(new Error('无法读取这张图片，请换一张试试。'))
  reader.readAsDataURL(file)
})

export async function loadSourceImage(file: File): Promise<SourceImage> {
  if (!file.type.startsWith('image/')) throw new Error('请选择 JPG、PNG 或 WebP 图片。')
  if (file.size > 24 * 1024 * 1024) throw new Error('图片请控制在 24MB 以内。')
  const dataUrl = await readFileAsDataUrl(file)
  const element = await loadImage(dataUrl)
  return {
    dataUrl,
    element,
    naturalWidth: element.naturalWidth,
    naturalHeight: element.naturalHeight,
    originalName: file.name,
  }
}

export async function prepareImage(file: File, dimensions: CanvasDimensions = { width: STAGE_WIDTH, height: STAGE_HEIGHT }): Promise<PreparedImage> {
  return renderTransformedImage(await loadSourceImage(file), dimensions, DEFAULT_IMAGE_TRANSFORM)
}

export function resizeImageData(source: ImageData, width: number, height: number): ImageData {
  const from = document.createElement('canvas')
  from.width = source.width
  from.height = source.height
  const fromContext = from.getContext('2d')
  if (!fromContext) throw new Error('无法分析图片。')
  fromContext.putImageData(source, 0, 0)

  const to = document.createElement('canvas')
  to.width = width
  to.height = height
  const toContext = to.getContext('2d', { willReadFrequently: true })
  if (!toContext) throw new Error('无法分析图片。')
  toContext.drawImage(from, 0, 0, width, height)
  return toContext.getImageData(0, 0, width, height)
}
