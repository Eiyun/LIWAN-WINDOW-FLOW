import type { AnimationSettings, CanvasDimensions } from '../types'
import { AnimationTimeline, type TimelinePhase } from './AnimationTimeline'
import { TextRainAnimation } from './TextRainAnimation'

export type AnimationPhase = TimelinePhase

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value))
const smooth = (value: number) => value * value * (3 - 2 * value)
const hash = (value: number) => {
  const result = Math.sin(value * 127.1 + 311.7) * 43758.5453
  return result - Math.floor(result)
}

function showBase(node: SVGTextElement, opacityMultiplier = 1) {
  node.setAttribute('opacity', (Number(node.dataset.cellOpacity || 1) * opacityMultiplier).toFixed(4))
  node.setAttribute('transform', node.dataset.cellBaseTransform || '')
}

function transformNode(node: SVGTextElement, opacity: number, x: number, y: number, rotation: number, scale: number) {
  const cx = Number(node.dataset.cellX || 0)
  const cy = Number(node.dataset.cellY || 0)
  const base = node.dataset.cellBaseTransform || ''
  node.setAttribute('opacity', clamp(opacity).toFixed(4))
  node.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${rotation.toFixed(2)} ${cx} ${cy}) translate(${cx} ${cy}) scale(${scale.toFixed(4)}) translate(${-cx} ${-cy}) ${base}`)
}

export class AnimationEngine {
  private readonly timeline = new AnimationTimeline()
  private readonly rain = new TextRainAnimation()

  apply(nodes: SVGTextElement[], elapsedMs: number, settings: AnimationSettings, dimensions: CanvasDimensions): AnimationPhase {
    const frame = this.timeline.frameAt(elapsedMs, settings)
    if (frame.phase === 'enter') this.applyEnter(nodes, frame.progress, settings, dimensions)
    else if (frame.phase === 'hold') nodes.forEach((node) => showBase(node))
    else if (frame.phase === 'exit') this.applyExit(nodes, frame.progress, settings, dimensions)
    else nodes.forEach((node) => showBase(node, 0))
    return frame.phase
  }

  private applyEnter(nodes: SVGTextElement[], progress: number, settings: AnimationSettings, dimensions: CanvasDimensions) {
    if (settings.mode === 'rain') {
      this.rain.applyEnter(nodes, progress, settings, dimensions)
      return
    }
    nodes.forEach((node, index) => {
      const baseOpacity = Number(node.dataset.cellOpacity || 1)
      const x = Number(node.dataset.cellX || 0)
      const y = Number(node.dataset.cellY || 0)
      let order = index / Math.max(1, nodes.length - 1)
      if (settings.mode === 'wave') {
        if (settings.direction === 'left-to-right') order = x / dimensions.width
        else if (settings.direction === 'top-to-bottom') order = y / dimensions.height
        else order = Math.hypot(x - dimensions.width / 2, y - dimensions.height / 2) / Math.hypot(dimensions.width / 2, dimensions.height / 2)
      }
      const stagger = settings.mode === 'fade' ? .42 : settings.mode === 'flicker' ? .62 : .88
      const local = clamp((progress - order * stagger) / Math.max(.05, 1 - stagger))
      if (settings.mode === 'flicker' && local < 1) {
        const flicker = hash(index + Math.floor(progress * 48) * 19)
        showBase(node, flicker > .48 ? clamp(local * 1.8) : flicker * .18)
      } else if (settings.mode === 'fade') showBase(node, smooth(local))
      else showBase(node, local > .04 ? 1 : 0)
      if (settings.mode === 'wave' && local > 0 && local < .28) node.setAttribute('opacity', (baseOpacity * local / .28).toFixed(4))
    })
  }

  private applyExit(nodes: SVGTextElement[], progress: number, settings: AnimationSettings, dimensions: CanvasDimensions) {
    if (settings.exitMode === 'fade-out') {
      nodes.forEach((node, index) => {
        const delay = hash(index + 41) * .2
        const local = clamp((progress - delay) / (1 - delay))
        showBase(node, 1 - smooth(clamp(local * settings.disappearSpeed)))
      })
      return
    }
    if (settings.exitMode === 'scatter') {
      nodes.forEach((node, index) => {
        const x = Number(node.dataset.cellX || 0)
        const y = Number(node.dataset.cellY || 0)
        const baseOpacity = Number(node.dataset.cellOpacity || 1)
        const randomAngle = (hash(index + 93) - .5) * Math.PI * settings.exitRandomness
        const angle = Math.atan2(y - dimensions.height / 2, x - dimensions.width / 2) + randomAngle
        const local = smooth(clamp(progress * settings.scatterSpeed))
        const distance = settings.scatterDistance * Math.max(dimensions.width, dimensions.height) * (.68 + hash(index + 7) * .5)
        transformNode(node, baseOpacity * (1 - smooth(local)), Math.cos(angle) * distance * local, Math.sin(angle) * distance * local, (hash(index + 18) - .5) * 90 * local, 1 - local * .62)
      })
      return
    }

    const count = Math.max(2, Math.round(settings.blossomCount))
    nodes.forEach((node, index) => {
      const x = Number(node.dataset.cellX || 0)
      const y = Number(node.dataset.cellY || 0)
      const baseOpacity = Number(node.dataset.cellOpacity || 1)
      const group = index % count
      const centerAngle = group / count * Math.PI * 2 - Math.PI / 2
      const centerX = dimensions.width / 2 + Math.cos(centerAngle) * dimensions.width * .19
      const centerY = dimensions.height / 2 + Math.sin(centerAngle) * dimensions.height * .18
      const petalAngle = hash(index + 29) * Math.PI * 2
      const petalRadius = (22 + hash(index + 61) * 82) * Math.min(dimensions.width, dimensions.height) / 1080
      const targetX = centerX + Math.cos(petalAngle) * petalRadius
      const targetY = centerY + Math.sin(petalAngle) * petalRadius
      const gatherEnd = clamp(.62 / Math.max(.35, settings.gatherSpeed), .36, .78)
      const gather = smooth(clamp(progress / gatherEnd))
      const vanish = smooth(clamp((progress - gatherEnd * .78) / Math.max(.12, 1 - gatherEnd * .78)))
      transformNode(node, baseOpacity * (1 - vanish * settings.disappearSpeed), (targetX - x) * gather, (targetY - y) * gather, (petalAngle * 180 / Math.PI + progress * 180 * settings.blossomRotation) * gather, 1 - vanish * .82)
    })
  }
}
