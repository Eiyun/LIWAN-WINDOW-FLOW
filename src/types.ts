export const STAGE_WIDTH = 1080
export const STAGE_HEIGHT = 1920

export type FrameStyle = 'meander' | 'octagon' | 'begonia' | 'square' | 'circular' | 'diamond'
export type FrameId = 'frame01' | 'frame02' | 'frame03' | 'frame04' | 'frame05'
export type CanvasRatio = '1x1' | '9x16' | '16x9'
export type BackgroundMode = 'solid'
export type RegionMode = 'auto' | 'rectangle' | 'brush'
export type SelectionShape = 'rectangle'
export type AnimationMode = 'typewriter' | 'fade' | 'wave' | 'flicker' | 'rain'
export type ExitAnimationMode = 'fade-out' | 'blossom' | 'scatter'
export type AnimationDirection = 'left-to-right' | 'top-to-bottom' | 'radial'
export type ColorMode = 'sampled'
export type BrushOperation = 'add' | 'erase'

export interface BackgroundSettings {
  mode: BackgroundMode
  color: string
}

export interface DetectionSettings {
  sensitivity: number
  centerPriority: number
  brightnessPriority: number
}

export interface TypographySettings {
  density: number
  minFontSize: number
  maxFontSize: number
  opacity: number
  colorMode: ColorMode
}

export interface AnimationSettings {
  mode: AnimationMode
  exitMode: ExitAnimationMode
  typeSpeed: number
  deleteSpeed: number
  fadeSpeed: number
  pauseDuration: number
  direction: AnimationDirection
  loop: boolean
  rainSpeed: number
  rainDensity: number
  horizontalDrift: number
  randomness: number
  settleSpeed: number
  enterDuration: number
  holdDuration: number
  exitDuration: number
  loopDelay: number
  blossomCount: number
  gatherSpeed: number
  blossomRotation: number
  disappearSpeed: number
  scatterSpeed: number
  scatterDistance: number
  exitRandomness: number
}

export interface CanvasDimensions {
  width: number
  height: number
}

export interface ImageTransform {
  scale: number
  x: number
  y: number
}

export interface SourceImage {
  dataUrl: string
  element: HTMLImageElement
  naturalWidth: number
  naturalHeight: number
  originalName: string
}

export interface ImageDrawRect {
  x: number
  y: number
  width: number
  height: number
}

export interface BrushSettings {
  size: number
  hardness: number
  operation: BrushOperation
}

export interface BrushPoint {
  x: number
  y: number
  pressure: number
}

export interface BrushStroke {
  id: string
  operation: BrushOperation
  size: number
  hardness: number
  points: BrushPoint[]
}

export interface SelectionRegion {
  id: string
  shape: SelectionShape
  x: number
  y: number
  width: number
  height: number
}

export interface DetectionResult {
  mask: Float32Array
  width: number
  height: number
  maskDataUrl: string
  confidence: number
  coverage: number
}

export interface TypographyCell {
  id: number
  x: number
  y: number
  char: string
  fill: string
  fontSize: number
  opacity: number
  rotation: number
  weight: number
  order: number
}

export interface PreparedImage {
  imageData: ImageData
  originalName: string
}
