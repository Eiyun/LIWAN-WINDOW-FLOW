import type { DetectionResult, TypographyCell, TypographySettings } from '../types'

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value))
const hash = (x: number, y: number) => {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return value - Math.floor(value)
}

function vibrantSample(r: number, g: number, b: number, luminance: number) {
  const average = (r + g + b) / 3
  const saturationBoost = 1.18
  let nr = average + (r - average) * saturationBoost
  let ng = average + (g - average) * saturationBoost
  let nb = average + (b - average) * saturationBoost
  const lift = luminance < 0.25 ? (0.25 - luminance) * 150 : 0
  nr = Math.round(clamp((nr + lift) / 255) * 255)
  ng = Math.round(clamp((ng + lift * 0.82) / 255) * 255)
  nb = Math.round(clamp((nb + lift * 0.62) / 255) * 255)
  return `rgb(${nr} ${ng} ${nb})`
}

export class TypographyRenderer {
  render(source: ImageData, detection: DetectionResult, rawText: string, settings: TypographySettings): TypographyCell[] {
    const characters = Array.from(rawText.trim() || '荔湾').slice(0, 50)
    const stageWidth = source.width
    const stageHeight = source.height
    const columns = Math.round(settings.density)
    const cellWidth = stageWidth / columns
    const rowStep = cellWidth * 0.92
    const rows = Math.ceil(stageHeight / rowStep)
    const cells: Omit<TypographyCell, 'id' | 'order'>[] = []

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const x = (column + 0.5) * cellWidth
        const y = (row + 0.72) * rowStep
        if (y > stageHeight) continue

        const maskX = Math.min(detection.width - 1, Math.floor((x / stageWidth) * detection.width))
        const maskY = Math.min(detection.height - 1, Math.floor((y / stageHeight) * detection.height))
        const maskValue = detection.mask[maskY * detection.width + maskX]
        if (maskValue < 0.12) continue

        const sourceX = Math.min(source.width - 1, Math.floor((x / stageWidth) * source.width))
        const sourceY = Math.min(source.height - 1, Math.floor((y / stageHeight) * source.height))
        const sourceIndex = (sourceY * source.width + sourceX) * 4
        const alpha = source.data[sourceIndex + 3] / 255
        if (alpha < 0.08) continue
        const r = source.data[sourceIndex]
        const g = source.data[sourceIndex + 1]
        const b = source.data[sourceIndex + 2]
        const luminance = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 255
        const noise = hash(column, row)
        const darkness = 1 - luminance
        const visibility = clamp(maskValue * 0.78 + darkness * 0.2 + 0.12)
        if (noise > 0.72 + visibility * 0.28) continue

        const sizeFactor = clamp(0.12 + darkness * 0.54 + maskValue * 0.34)
        const fontSize = settings.minFontSize + (settings.maxFontSize - settings.minFontSize) * sizeFactor
        const jitterX = (hash(column + 9, row + 4) - 0.5) * cellWidth * 0.16
        const jitterY = (hash(column + 17, row + 13) - 0.5) * rowStep * 0.12

        cells.push({
          x: x + jitterX,
          y: y + jitterY,
          char: characters[(row * columns + column) % characters.length],
          fill: vibrantSample(r, g, b, luminance),
          fontSize,
          opacity: settings.opacity * alpha * (0.34 + maskValue * 0.42 + darkness * 0.24),
          rotation: (hash(column + 31, row + 7) - 0.5) * 4,
          weight: Math.round(480 + (luminance * 180 + maskValue * 110) / 10) * 10,
        })
      }
    }

    const ordered = cells.sort((a, b) => {
        const aOrder = (a.y / stageHeight) * 0.78 + (a.x / stageWidth) * 0.22 + hash(a.x, a.y) * 0.035
        const bOrder = (b.y / stageHeight) * 0.78 + (b.x / stageWidth) * 0.22 + hash(b.x, b.y) * 0.035
        return aOrder - bOrder
      })
    const maxCells = typeof window !== 'undefined' && window.innerWidth < 720 ? 1400 : 2400
    const limited = ordered.length <= maxCells
      ? ordered
      : ordered.filter((_, index) => index % Math.ceil(ordered.length / maxCells) === 0).slice(0, maxCells)
    return limited.map((cell, index) => ({ ...cell, id: index, order: index }))
  }
}
