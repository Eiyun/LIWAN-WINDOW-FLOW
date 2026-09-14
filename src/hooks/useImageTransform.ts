import { useCallback, useEffect, useState } from 'react'
import { clampImageTransform, fillImageTransform, fitImageTransform } from '../core/imageTransform'
import type { CanvasDimensions, ImageTransform, SourceImage } from '../types'

export function useImageTransform(source: SourceImage | null, dimensions: CanvasDimensions) {
  const [transform, setTransformState] = useState<ImageTransform>(fitImageTransform)

  useEffect(() => {
    setTransformState(fitImageTransform())
  }, [source, dimensions.width, dimensions.height])

  const setTransform = useCallback((next: ImageTransform | ((current: ImageTransform) => ImageTransform)) => {
    setTransformState((current) => clampImageTransform(typeof next === 'function' ? next(current) : next, dimensions))
  }, [dimensions])

  const fit = useCallback(() => setTransformState(fitImageTransform()), [])
  const fill = useCallback(() => {
    if (source) setTransformState(fillImageTransform(source, dimensions))
  }, [dimensions, source])
  const center = useCallback(() => setTransformState((current) => ({ ...current, x: 0, y: 0 })), [])
  const reset = useCallback(() => setTransformState(fitImageTransform()), [])

  return { transform, setTransform, fit, fill, center, reset }
}
