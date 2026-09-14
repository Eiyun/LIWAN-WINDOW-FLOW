import type { DetectionResult, DetectionSettings } from '../types'
import { resizeImageData } from '../utils/image'

const ANALYSIS_WIDTH = 96

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value))
const smoothstep = (edge0: number, edge1: number, value: number) => {
  if (Math.abs(edge1 - edge0) < 0.00001) return value >= edge1 ? 1 : 0
  const x = clamp((value - edge0) / (edge1 - edge0))
  return x * x * (3 - 2 * x)
}

function boxBlur(input: Float32Array, width: number, height: number, radius: number) {
  const output = new Float32Array(input.length)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let total = 0
      let count = 0
      for (let oy = -radius; oy <= radius; oy += 1) {
        const sy = Math.max(0, Math.min(height - 1, y + oy))
        for (let ox = -radius; ox <= radius; ox += 1) {
          const sx = Math.max(0, Math.min(width - 1, x + ox))
          total += input[sy * width + sx]
          count += 1
        }
      }
      output[y * width + x] = total / count
    }
  }
  return output
}

function percentile(values: Float32Array, ratio: number) {
  const sorted = Array.from(values).sort((a, b) => a - b)
  return sorted[Math.floor(clamp(ratio) * (sorted.length - 1))]
}

function normalize(values: Float32Array) {
  const low = percentile(values, 0.04)
  const high = percentile(values, 0.96)
  const range = Math.max(0.0001, high - low)
  return Float32Array.from(values, (value) => clamp((value - low) / range))
}

function bestConnectedRegion(score: Float32Array, threshold: number, width: number, height: number) {
  const visited = new Uint8Array(score.length)
  let winner: number[] = []
  let winnerRank = -Infinity
  const directions = [-1, 1, -width, width, -width - 1, -width + 1, width - 1, width + 1]

  for (let start = 0; start < score.length; start += 1) {
    if (visited[start] || score[start] <= threshold) continue
    const queue = [start]
    const region: number[] = []
    visited[start] = 1
    let cursor = 0
    let centerAffinity = 0
    let scoreTotal = 0

    while (cursor < queue.length) {
      const index = queue[cursor++]
      region.push(index)
      const x = index % width
      const y = Math.floor(index / width)
      const nx = (x / (width - 1) - 0.5) / 0.5
      const ny = (y / (height - 1) - 0.5) / 0.5
      centerAffinity += Math.exp(-(nx * nx * 1.45 + ny * ny * 0.78) * 1.7)
      scoreTotal += score[index]

      for (const delta of directions) {
        const next = index + delta
        if (next < 0 || next >= score.length || visited[next] || score[next] <= threshold) continue
        const nextX = next % width
        if (Math.abs(nextX - x) > 1) continue
        visited[next] = 1
        queue.push(next)
      }
    }

    const areaRatio = region.length / score.length
    const rank = region.length * (0.55 + centerAffinity / region.length) * (0.6 + scoreTotal / region.length)
    if (areaRatio < 0.72 && rank > winnerRank) {
      winner = region
      winnerRank = rank
    }
  }
  return winner
}

export class SubjectDetector {
  detect(source: ImageData, settings: DetectionSettings): DetectionResult {
    const analysisHeight = Math.max(72, Math.round(ANALYSIS_WIDTH * source.height / source.width))
    const sample = resizeImageData(source, ANALYSIS_WIDTH, analysisHeight)
    const length = ANALYSIS_WIDTH * analysisHeight
    const luminance = new Float32Array(length)
    const saturation = new Float32Array(length)
    const center = new Float32Array(length)
    const alpha = new Float32Array(length)

    for (let index = 0; index < length; index += 1) {
      const offset = index * 4
      const r = sample.data[offset] / 255
      const g = sample.data[offset + 1] / 255
      const b = sample.data[offset + 2] / 255
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      alpha[index] = sample.data[offset + 3] / 255
      luminance[index] = r * 0.2126 + g * 0.7152 + b * 0.0722
      saturation[index] = max === 0 ? 0 : (max - min) / max

      const x = index % ANALYSIS_WIDTH
      const y = Math.floor(index / ANALYSIS_WIDTH)
      const nx = (x / (ANALYSIS_WIDTH - 1) - 0.5) / 0.5
      const ny = (y / (analysisHeight - 1) - 0.5) / 0.5
      center[index] = Math.exp(-(nx * nx * 1.5 + ny * ny * 0.82) * 1.9)
    }

    const localAverage = boxBlur(luminance, ANALYSIS_WIDTH, analysisHeight, 4)
    const contrast = new Float32Array(length)
    for (let i = 0; i < length; i += 1) contrast[i] = Math.abs(luminance[i] - localAverage[i])

    const normalizedContrast = normalize(contrast)
    const normalizedSaturation = normalize(saturation)
    const score = new Float32Array(length)
    for (let i = 0; i < length; i += 1) {
      const bright = Math.pow(luminance[i], 0.78)
      score[i] = alpha[i] * (
        normalizedContrast[i] * 0.42 +
        normalizedSaturation[i] * 0.16 +
        bright * (0.12 + settings.brightnessPriority * 0.22) +
        center[i] * (0.11 + settings.centerPriority * 0.34))
    }

    const smoothedScore = normalize(boxBlur(score, ANALYSIS_WIDTH, analysisHeight, 1))
    let threshold = percentile(smoothedScore, 0.78 - settings.sensitivity * 0.34)
    let region = bestConnectedRegion(smoothedScore, threshold, ANALYSIS_WIDTH, analysisHeight)

    if (region.length < length * 0.035) {
      threshold = percentile(smoothedScore, 0.48)
      region = bestConnectedRegion(smoothedScore, threshold, ANALYSIS_WIDTH, analysisHeight)
    }

    const binary = new Float32Array(length)
    region.forEach((index) => { binary[index] = 1 })
    const softened = boxBlur(boxBlur(binary, ANALYSIS_WIDTH, analysisHeight, 1), ANALYSIS_WIDTH, analysisHeight, 2)
    const mask = new Float32Array(length)
    let maskTotal = 0
    for (let i = 0; i < length; i += 1) {
      mask[i] = alpha[i] * smoothstep(0.06, 0.72, softened[i]) * smoothstep(threshold * 0.55, threshold, smoothedScore[i] + 0.12)
      maskTotal += mask[i]
    }

    const canvas = document.createElement('canvas')
    canvas.width = ANALYSIS_WIDTH
    canvas.height = analysisHeight
    const context = canvas.getContext('2d')
    if (!context) throw new Error('无法生成主体蒙版。')
    const imageData = context.createImageData(ANALYSIS_WIDTH, analysisHeight)
    for (let i = 0; i < length; i += 1) {
      const offset = i * 4
      imageData.data[offset] = 255
      imageData.data[offset + 1] = 255
      imageData.data[offset + 2] = 255
      imageData.data[offset + 3] = Math.round(mask[i] * 255)
    }
    context.putImageData(imageData, 0, 0)

    const coverage = maskTotal / length
    const confidence = clamp(1 - Math.abs(coverage - 0.28) * 1.7) * 0.72 + clamp(region.length / (length * 0.18)) * 0.28
    return {
      mask,
      width: ANALYSIS_WIDTH,
      height: analysisHeight,
      maskDataUrl: canvas.toDataURL('image/png'),
      confidence: clamp(confidence),
      coverage,
    }
  }
}
