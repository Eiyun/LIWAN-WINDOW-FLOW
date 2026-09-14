import type { AnimationSettings, CanvasDimensions } from '../types'

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value))
const hash = (value: number) => {
  const result = Math.sin(value * 91.3458 + 12.345) * 47453.5453
  return result - Math.floor(result)
}
const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3)

export class TextRainAnimation {
  applyEnter(nodes: SVGTextElement[], progress: number, settings: AnimationSettings, dimensions: CanvasDimensions) {
    nodes.forEach((node, index) => {
      const targetY = Number(node.dataset.cellY || 0)
      const baseTransform = node.dataset.cellBaseTransform || ''
      const baseOpacity = Number(node.dataset.cellOpacity || 1)
      const r1 = hash(index + 1)
      const r2 = hash(index + 71)
      const r3 = hash(index + 173)
      const normalizedOrder = index / Math.max(1, nodes.length - 1)
      const densityDelay = (1 - settings.rainDensity) * .48
      const delay = normalizedOrder * (.08 + densityDelay * .18) + r1 * densityDelay + r2 * .08 * settings.randomness
      // Delay controls when each glyph enters. The easing exponent controls speed,
      // while keeping local === 1 at the end of the enter phase so every glyph
      // always settles into the final typographic image.
      const delayedProgress = clamp((progress - delay) / Math.max(.12, 1 - delay))
      const speed = Math.max(.2, settings.rainSpeed * (.7 + settings.settleSpeed * .3))
      const local = Math.pow(delayedProgress, 1 / speed)
      const eased = easeOutCubic(local)
      const startY = -(targetY + 90 + r2 * 420 * settings.randomness)
      const startX = (r1 * 2 - 1) * dimensions.width * settings.horizontalDrift * (1 + settings.randomness)
      const sway = Math.sin(local * Math.PI * (2 + r3 * 2) + r1 * 8) * 80 * settings.horizontalDrift * (1 - local)
      const translateX = startX * (1 - eased) + sway
      const translateY = startY * (1 - eased)
      const opacity = baseOpacity * clamp(local * 4)
      node.setAttribute('opacity', opacity.toFixed(4))
      node.setAttribute('transform', `translate(${translateX.toFixed(2)} ${translateY.toFixed(2)}) ${baseTransform}`)
    })
  }
}
