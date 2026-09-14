import { forwardRef, useEffect, useMemo, useRef, useState } from 'react'
import { AnimationEngine, type AnimationPhase } from '../core/AnimationEngine'
import { zoomImageTransformAtPoint } from '../core/imageTransform'
import { clientPointToCanvas } from '../core/transformCoordinates'
import type {
  AnimationSettings,
  BackgroundSettings,
  BrushSettings,
  BrushStroke,
  CanvasDimensions,
  DetectionResult,
  ImageDrawRect,
  ImageTransform,
  RegionMode,
  SelectionRegion,
  TypographyCell,
} from '../types'
import { BrushSelection } from './BrushSelection'
import { SelectionOverlay } from './SelectionOverlay'

interface PreviewStageProps {
  imageUrl: string | null
  imageDrawRect: ImageDrawRect | null
  imageTransform: ImageTransform
  onImageTransformChange: (transform: ImageTransform) => void
  imageAdjustActive: boolean
  detection: DetectionResult | null
  cells: TypographyCell[]
  animation: AnimationSettings
  background: BackgroundSettings
  dimensions: CanvasDimensions
  frameDataUrl: string | null
  regionMode: RegionMode
  selections: SelectionRegion[]
  brush: BrushSettings
  brushStrokes: BrushStroke[]
  onBrushStrokeComplete: (stroke: BrushStroke) => void
  onSelectionAdd: (selection: Omit<SelectionRegion, 'id'>) => void
  onSelectionDelete: (id: string) => void
  isDetecting: boolean
}

type DraftSelection = Omit<SelectionRegion, 'id'>

const phaseLabels: Record<AnimationPhase, string> = {
  enter: '文字正在进入 · Entering',
  hold: '完整呈现 · Holding',
  exit: '文字正在退场 · Exiting',
  delay: '等待下一循环 · Loop delay',
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

export const PreviewStage = forwardRef<SVGSVGElement, PreviewStageProps>(function PreviewStage(
  {
    imageUrl,
    imageDrawRect,
    imageTransform,
    onImageTransformChange,
    imageAdjustActive,
    detection,
    cells,
    animation,
    background,
    dimensions,
    frameDataUrl,
    regionMode,
    selections,
    brush,
    brushStrokes,
    onBrushStrokeComplete,
    onSelectionAdd,
    onSelectionDelete,
    isDetecting,
  },
  forwardedRef,
) {
  const engine = useMemo(() => new AnimationEngine(), [])
  const svgRef = useRef<SVGSVGElement | null>(null)
  const startedAt = useRef(performance.now())
  const dragOrigin = useRef<{ x: number; y: number } | null>(null)
  const imageDragOrigin = useRef<{ point: { x: number; y: number }; transform: ImageTransform } | null>(null)
  const typographyGroupRef = useRef<SVGGElement>(null)
  const [phase, setPhase] = useState<AnimationPhase>('hold')
  const [draft, setDraft] = useState<DraftSelection | null>(null)
  const hasComposition = Boolean(imageUrl && detection && cells.length)
  const canSelect = Boolean(imageUrl && regionMode === 'rectangle' && !isDetecting)
  const canBrush = Boolean(imageUrl && regionMode === 'brush' && !isDetecting)
  const canAdjustImage = Boolean(imageUrl && imageAdjustActive)
  const shortSide = Math.min(dimensions.width, dimensions.height)
  const margin = shortSide * .04
  const ratioClass = dimensions.width === dimensions.height ? 'ratio-square' : dimensions.width > dimensions.height ? 'ratio-landscape' : 'ratio-portrait'

  const setSvgRef = (node: SVGSVGElement | null) => {
    svgRef.current = node
    if (typeof forwardedRef === 'function') forwardedRef(node)
    else if (forwardedRef) forwardedRef.current = node
  }

  useEffect(() => {
    startedAt.current = performance.now()
    let frameId = 0
    let previousPhase: AnimationPhase | null = null
    const group = typographyGroupRef.current
    const nodes = Array.from(group?.querySelectorAll<SVGTextElement>('[data-cell-opacity]') || [])

    const restart = () => { startedAt.current = performance.now(); previousPhase = null }
    const svg = svgRef.current
    svg?.addEventListener('liwan-animation-restart', restart)

    const tick = (now: number) => {
      const nextPhase = engine.apply(nodes, now - startedAt.current, animation, dimensions)
      if (nextPhase !== previousPhase) {
        previousPhase = nextPhase
        setPhase(nextPhase)
      }
      frameId = requestAnimationFrame(tick)
    }
    frameId = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frameId)
      svg?.removeEventListener('liwan-animation-restart', restart)
    }
  }, [animation, cells, dimensions, engine])

  const rawPointerPosition = (event: { clientX: number; clientY: number; currentTarget: SVGSVGElement }) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    return clientPointToCanvas(event, bounds, dimensions)
  }

  const pointerPosition = (event: React.PointerEvent<SVGSVGElement>) => {
    const point = rawPointerPosition(event)
    return {
      x: clamp(point.x, margin, dimensions.width - margin),
      y: clamp(point.y, margin, dimensions.height - margin),
    }
  }

  const selectionFromPoints = (start: { x: number; y: number }, end: { x: number; y: number }): DraftSelection => ({
    shape: 'rectangle',
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  })

  const handlePointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    if (canAdjustImage && event.button === 0) {
      event.preventDefault()
      imageDragOrigin.current = { point: rawPointerPosition(event), transform: imageTransform }
      event.currentTarget.setPointerCapture(event.pointerId)
      return
    }
    if (!canSelect || event.button !== 0) return
    event.preventDefault()
    const point = pointerPosition(event)
    dragOrigin.current = point
    setDraft(selectionFromPoints(point, point))
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (imageDragOrigin.current) {
      event.preventDefault()
      const point = rawPointerPosition(event)
      const origin = imageDragOrigin.current
      onImageTransformChange({
        ...origin.transform,
        x: origin.transform.x + point.x - origin.point.x,
        y: origin.transform.y + point.y - origin.point.y,
      })
      return
    }
    if (!dragOrigin.current) return
    event.preventDefault()
    setDraft(selectionFromPoints(dragOrigin.current, pointerPosition(event)))
  }

  const finishSelection = (event: React.PointerEvent<SVGSVGElement>) => {
    if (imageDragOrigin.current) {
      imageDragOrigin.current = null
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
      return
    }
    if (!dragOrigin.current) return
    const selection = selectionFromPoints(dragOrigin.current, pointerPosition(event))
    dragOrigin.current = null
    setDraft(null)
    if (selection.width >= shortSide * .025 && selection.height >= shortSide * .025) onSelectionAdd(selection)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const handleWheel = (event: React.WheelEvent<SVGSVGElement>) => {
    if (!canAdjustImage) return
    event.preventDefault()
    const anchor = rawPointerPosition(event)
    const multiplier = Math.exp(-event.deltaY * 0.0015)
    onImageTransformChange(zoomImageTransformAtPoint(imageTransform, imageTransform.scale * multiplier, anchor, dimensions))
  }

  const status = !imageUrl
    ? '等待图片 · Waiting for image'
    : canAdjustImage
      ? '拖动图片 · 滚轮缩放 · Adjusting image'
    : isDetecting
      ? '正在识别主体 · Detecting'
      : regionMode === 'rectangle' && selections.length === 0
        ? '拖拽创建选区 · Drag to select'
        : regionMode === 'brush' && brushStrokes.length === 0
          ? '涂抹创建蒙版 · Paint to select'
          : hasComposition ? phaseLabels[phase] : '等待有效区域 · Select a region'

  return (
    <div className="preview-wrap">
      <div className="stage-toolbar">
        <span className="stage-label"><i /> {dimensions.width} × {dimensions.height}</span>
        <span className="animation-status">{status}</span>
      </div>
      <div
        className={`stage-shell ${ratioClass} ${isDetecting ? 'is-detecting' : ''} ${canSelect || canBrush || canAdjustImage ? 'selection-enabled' : ''} ${canBrush ? 'brush-enabled' : ''} ${canAdjustImage ? 'adjust-enabled' : ''}`}
        style={{ aspectRatio: `${dimensions.width} / ${dimensions.height}` }}
      >
        <svg
          ref={setSvgRef}
          className="preview-svg"
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          role="img"
          aria-label="荔窗流影实时预览"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishSelection}
          onPointerCancel={finishSelection}
          onWheel={handleWheel}
        >
          <defs>
            <filter id="letter-glow" x="-15%" y="-15%" width="130%" height="130%"><feGaussianBlur in="SourceAlpha" stdDeviation="1.05" result="blur" /><feFlood floodColor="#5FAF78" floodOpacity=".16" result="color" /><feComposite in="color" in2="blur" operator="in" result="shadow" /><feMerge><feMergeNode in="shadow" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            <filter id="sampling-guide" x="-2%" y="-2%" width="104%" height="104%"><feColorMatrix type="saturate" values=".6" /><feComponentTransfer><feFuncA type="linear" slope=".34" /></feComponentTransfer></filter>
          </defs>

          <rect width={dimensions.width} height={dimensions.height} fill={background.color} data-layer="solid-background" />

          {!imageUrl && <g data-export-ignore="true" transform={`translate(${dimensions.width / 2} ${dimensions.height / 2}) scale(${shortSide / 1080})`}>
            <circle r="245" fill="none" stroke="#5FAF78" strokeWidth="3" opacity=".48" />
            <circle r="205" fill="none" stroke="#d7efe0" strokeWidth="2" strokeDasharray="7 15" opacity=".28" />
            <text y="-60" textAnchor="middle" fill="#e9f3ec" fontFamily="serif" fontSize="154" opacity=".9">荔</text>
            <text y="93" textAnchor="middle" fill="#5FAF78" fontFamily="serif" fontSize="154" opacity=".96">窗</text>
            <text y="350" textAnchor="middle" fill="#eaf5ee" fontFamily="sans-serif" fontSize="28" letterSpacing="9" opacity=".72">上传图片开始创作</text>
            <text y="403" textAnchor="middle" fill="#eaf5ee" fontFamily="sans-serif" fontSize="17" letterSpacing="5" opacity=".4">UPLOAD TO CREATE</text>
          </g>}

          <g ref={typographyGroupRef} data-layer="subject-typographic" filter="url(#letter-glow)" fontFamily="'Noto Serif SC', 'Songti SC', 'SimSun', serif" textAnchor="middle">
            {cells.map((cell) => {
              const baseTransform = `rotate(${cell.rotation.toFixed(2)} ${cell.x.toFixed(2)} ${cell.y.toFixed(2)})`
              return <text key={cell.id} x={cell.x} y={cell.y} fill={cell.fill} fontSize={cell.fontSize} fontWeight={cell.weight} data-cell-opacity={cell.opacity.toFixed(4)} data-cell-x={cell.x.toFixed(2)} data-cell-y={cell.y.toFixed(2)} data-cell-base-transform={baseTransform} transform={baseTransform}>{cell.char}</text>
            })}
          </g>

          {imageUrl && imageDrawRect && <SelectionOverlay mode={regionMode} imageUrl={imageUrl} imageRect={imageDrawRect} adjustingImage={canAdjustImage} selections={selections} draft={draft} onSelectionDelete={onSelectionDelete} dimensions={dimensions} />}
          <BrushSelection active={canBrush} settings={brush} frameColor="#5FAF78" dimensions={dimensions} onStrokeComplete={onBrushStrokeComplete} />

          {frameDataUrl && <image href={frameDataUrl} width={dimensions.width} height={dimensions.height} preserveAspectRatio="none" data-layer="window-frame-png" pointerEvents="none" style={{ userSelect: 'none' }} />}
        </svg>
        {isDetecting && <div className="scan-line" />}
      </div>
      <p className="preview-caption">远观成像 · 近看成字 · 编辑参考层不会进入导出文件</p>
    </div>
  )
})
