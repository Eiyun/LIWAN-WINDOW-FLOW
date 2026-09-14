import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ControlPanel } from './components/ControlPanel'
import { PreviewStage } from './components/PreviewStage'
import { BrushMaskBuilder } from './core/brushMask'
import { Exporter } from './core/Exporter'
import { CANVAS_PRESETS, loadFrameDataUrl } from './core/FrameManifest'
import { getImageDrawRect, renderTransformedImage } from './core/imageTransform'
import { RegionMaskBuilder } from './core/RegionMask'
import { SubjectDetector } from './core/SubjectDetector'
import { TypographyRenderer } from './core/TypographyRenderer'
import { VideoExporter, type VideoFormat } from './core/VideoExporter'
import { useImageTransform } from './hooks/useImageTransform'
import type { AnimationSettings, BackgroundSettings, BrushSettings, BrushStroke, CanvasRatio, DetectionResult, DetectionSettings, FrameId, PreparedImage, RegionMode, SelectionRegion, SourceImage, TypographySettings } from './types'
import { loadSourceImage } from './utils/image'

const defaultDetection: DetectionSettings = { sensitivity: 0.62, centerPriority: 0.74, brightnessPriority: 0.58 }
const defaultTypography: TypographySettings = { density: 54, minFontSize: 14, maxFontSize: 34, opacity: 0.94, colorMode: 'sampled' }
const defaultAnimation: AnimationSettings = {
  mode: 'typewriter',
  exitMode: 'fade-out',
  typeSpeed: 560,
  deleteSpeed: 820,
  fadeSpeed: 1200,
  pauseDuration: 1300,
  direction: 'left-to-right',
  loop: true,
  rainSpeed: 1,
  rainDensity: 0.75,
  horizontalDrift: 0.12,
  randomness: 0.25,
  settleSpeed: 0.8,
  enterDuration: 3200,
  holdDuration: 1800,
  exitDuration: 2200,
  loopDelay: 800,
  blossomCount: 5,
  gatherSpeed: 0.9,
  blossomRotation: 0.7,
  disappearSpeed: 1,
  scatterSpeed: 1,
  scatterDistance: 0.48,
  exitRandomness: 0.22,
}
const defaultBackground: BackgroundSettings = { mode: 'solid', color: '#204E8A' }
const defaultBrush: BrushSettings = { size: 70, hardness: 0.75, operation: 'add' }
const makeId = () => globalThis.crypto?.randomUUID?.() || `selection-${Date.now()}-${Math.random().toString(16).slice(2)}`

function App() {
  const detector = useMemo(() => new SubjectDetector(), [])
  const renderer = useMemo(() => new TypographyRenderer(), [])
  const svgRef = useRef<SVGSVGElement>(null)
  const videoAbortRef = useRef<AbortController | null>(null)
  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [sourceImage, setSourceImage] = useState<SourceImage | null>(null)
  const [prepared, setPrepared] = useState<PreparedImage | null>(null)
  const [detection, setDetection] = useState<DetectionResult | null>(null)
  const [detectionSettings, setDetectionSettings] = useState(defaultDetection)
  const [typography, setTypography] = useState(defaultTypography)
  const [animation, setAnimation] = useState(defaultAnimation)
  const [text, setText] = useState('荔湾')
  const [canvasRatio, setCanvasRatio] = useState<CanvasRatio>('9x16')
  const [frameId, setFrameId] = useState<FrameId>('frame01')
  const [frameDataUrl, setFrameDataUrl] = useState<string | null>(null)
  const [background, setBackground] = useState(defaultBackground)
  const [regionMode, setRegionMode] = useState<RegionMode>('auto')
  const [selections, setSelections] = useState<SelectionRegion[]>([])
  const [brush, setBrush] = useState<BrushSettings>(defaultBrush)
  const [brushStrokes, setBrushStrokes] = useState<BrushStroke[]>([])
  const [redoStrokes, setRedoStrokes] = useState<BrushStroke[]>([])
  const [imageAdjustActive, setImageAdjustActive] = useState(false)
  const [isLoadingImage, setIsLoadingImage] = useState(false)
  const [isTransformingImage, setIsTransformingImage] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detectionRevision, setDetectionRevision] = useState(0)
  const [videoDuration, setVideoDuration] = useState<15 | 30 | 45 | 60>(15)
  const [videoFormat, setVideoFormat] = useState<VideoFormat>('webm')
  const [videoProgress, setVideoProgress] = useState<number | null>(null)
  const [videoNotice, setVideoNotice] = useState<string | null>(null)
  const dimensions = CANVAS_PRESETS[canvasRatio]
  const imageTransform = useImageTransform(sourceImage, dimensions)
  const imageDrawRect = useMemo(() => sourceImage ? getImageDrawRect(sourceImage, dimensions, imageTransform.transform) : null, [dimensions, imageTransform.transform, sourceImage])
  const isBusy = isLoadingImage || isTransformingImage || isDetecting

  const handleTextChange = useCallback((value: string) => {
    setText(Array.from(value).slice(0, 50).join(''))
  }, [])

  const handleUpload = (file: File) => {
    setError(null)
    setSourceFile(file)
    setSourceImage(null)
    setPrepared(null)
    setDetection(null)
    setSelections([])
    setBrushStrokes([])
    setRedoStrokes([])
    setImageAdjustActive(false)
  }

  useEffect(() => {
    let cancelled = false
    if (!sourceFile) return
    setIsLoadingImage(true)
    loadSourceImage(sourceFile)
      .then((image) => {
        if (cancelled) return
        setSourceImage(image)
      })
      .catch((reason) => {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : '图片读取失败。')
          setIsLoadingImage(false)
        }
      })
    return () => { cancelled = true }
  }, [sourceFile])

  useEffect(() => {
    if (!sourceImage) return
    setIsTransformingImage(true)
    const timer = window.setTimeout(() => {
      try {
        setPrepared(renderTransformedImage(sourceImage, dimensions, imageTransform.transform))
        setIsLoadingImage(false)
        setError(null)
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : '图片调整失败。')
        setIsLoadingImage(false)
      } finally {
        setIsTransformingImage(false)
      }
    }, 36)
    return () => window.clearTimeout(timer)
  }, [dimensions, imageTransform.transform, sourceImage])

  useEffect(() => {
    if (!prepared || regionMode !== 'auto') return
    setIsDetecting(true)
    const timer = window.setTimeout(() => {
      try {
        setDetection(detector.detect(prepared.imageData, detectionSettings))
        setError(null)
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : '主体识别失败。')
      } finally {
        setIsDetecting(false)
      }
    }, 90)
    return () => {
      window.clearTimeout(timer)
      setIsDetecting(false)
    }
  }, [detectionRevision, detectionSettings, detector, prepared, regionMode])

  useEffect(() => {
    let cancelled = false
    setFrameDataUrl(null)
    loadFrameDataUrl(canvasRatio, frameId)
      .then((url) => { if (!cancelled) setFrameDataUrl(url) })
      .catch((reason) => { if (!cancelled) setError(reason instanceof Error ? reason.message : '花窗加载失败。') })
    return () => { cancelled = true }
  }, [canvasRatio, frameId])

  const changeCanvasRatio = (ratio: CanvasRatio) => {
    setCanvasRatio(ratio)
    setSelections([])
    setBrushStrokes([])
    setRedoStrokes([])
    setImageAdjustActive(false)
  }

  const changeRegionMode = (mode: RegionMode) => {
    setImageAdjustActive(false)
    setRegionMode(mode)
  }

  const rectangleDetection = useMemo(() => RegionMaskBuilder.fromSelections(selections, dimensions), [dimensions, selections])
  const brushDetection = useMemo(() => BrushMaskBuilder.fromStrokes(brushStrokes, dimensions), [brushStrokes, dimensions])
  const activeDetection = regionMode === 'rectangle' ? rectangleDetection : regionMode === 'brush' ? brushDetection : detection

  const cells = useMemo(() => {
    if (!prepared || !activeDetection) return []
    return renderer.render(prepared.imageData, activeDetection, text, typography)
  }, [activeDetection, prepared, renderer, text, typography])

  const addSelection = (selection: Omit<SelectionRegion, 'id'>) => {
    setSelections((current) => [...current, { ...selection, id: makeId() }])
  }

  const addBrushStroke = (stroke: BrushStroke) => {
    setBrushStrokes((current) => [...current, stroke])
    setRedoStrokes([])
  }

  const undoBrush = () => {
    const stroke = brushStrokes.at(-1)
    if (!stroke) return
    setBrushStrokes(brushStrokes.slice(0, -1))
    setRedoStrokes([...redoStrokes, stroke])
  }

  const redoBrush = () => {
    const stroke = redoStrokes.at(-1)
    if (!stroke) return
    setRedoStrokes(redoStrokes.slice(0, -1))
    setBrushStrokes([...brushStrokes, stroke])
  }

  const exportSvg = () => {
    if (svgRef.current) Exporter.exportSvg(svgRef.current, `荔窗流影_${canvasRatio}.svg`)
  }

  const exportPng = async () => {
    if (!svgRef.current) return
    try {
      await Exporter.exportPng(svgRef.current, `荔窗流影_${canvasRatio}.png`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '导出失败。')
    }
  }

  const exportVideo = async () => {
    if (!svgRef.current || videoProgress !== null) return
    const controller = new AbortController()
    videoAbortRef.current = controller
    setVideoProgress(0)
    setVideoNotice(null)
    setError(null)
    try {
      const actualFormat = await VideoExporter.export(svgRef.current, {
        durationSeconds: videoDuration,
        format: videoFormat,
        filename: `荔窗流影_${canvasRatio}_${videoDuration}s.${videoFormat}`,
        signal: controller.signal,
        onProgress: setVideoProgress,
      })
      if (actualFormat !== videoFormat) setVideoNotice('当前浏览器不支持 MP4，已自动导出 WebM。')
      else setVideoNotice(`视频已导出 · ${actualFormat.toUpperCase()}`)
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === 'AbortError') setVideoNotice('视频导出已取消。')
      else setError(reason instanceof Error ? reason.message : '视频导出失败。')
    } finally {
      videoAbortRef.current = null
      setVideoProgress(null)
    }
  }

  const cancelVideo = () => videoAbortRef.current?.abort()

  return (
    <main className="app-shell">
      <ControlPanel
        text={text}
        onTextChange={handleTextChange}
        imageTransform={imageTransform.transform}
        onImageTransformChange={imageTransform.setTransform}
        imageAdjustActive={imageAdjustActive}
        onImageAdjustActiveChange={setImageAdjustActive}
        onImageFit={imageTransform.fit}
        onImageFill={imageTransform.fill}
        onImageCenter={imageTransform.center}
        onImageReset={imageTransform.reset}
        dimensions={dimensions}
        detectionSettings={detectionSettings}
        onDetectionChange={setDetectionSettings}
        typography={typography}
        onTypographyChange={setTypography}
        animation={animation}
        onAnimationChange={setAnimation}
        canvasRatio={canvasRatio}
        onCanvasRatioChange={changeCanvasRatio}
        frameId={frameId}
        onFrameIdChange={setFrameId}
        background={background}
        onBackgroundChange={setBackground}
        regionMode={regionMode}
        onRegionModeChange={changeRegionMode}
        selections={selections}
        brush={brush}
        onBrushChange={setBrush}
        brushStrokeCount={brushStrokes.length}
        canUndoBrush={brushStrokes.length > 0}
        canRedoBrush={redoStrokes.length > 0}
        onUndoBrush={undoBrush}
        onRedoBrush={redoBrush}
        onClearBrush={() => { setBrushStrokes([]); setRedoStrokes([]) }}
        onDeleteSelection={(id) => setSelections((current) => current.filter((selection) => selection.id !== id))}
        onClearSelections={() => { setSelections([]); setBrushStrokes([]); setRedoStrokes([]) }}
        onUpload={handleUpload}
        onDetect={() => { setImageAdjustActive(false); setRegionMode('auto'); setDetectionRevision((current) => current + 1) }}
        onExportPng={exportPng}
        onExportSvg={exportSvg}
        onExportVideo={exportVideo}
        onCancelVideo={cancelVideo}
        videoDuration={videoDuration}
        onVideoDurationChange={setVideoDuration}
        videoFormat={videoFormat}
        onVideoFormatChange={setVideoFormat}
        videoProgress={videoProgress}
        videoNotice={videoNotice}
        mp4Supported={VideoExporter.supportsMp4()}
        detection={activeDetection}
        imageName={sourceFile?.name || prepared?.originalName || null}
        isBusy={isBusy}
        error={error}
      />
      <section className="workspace">
        <div className="workspace-heading">
          <div><p>实时构图 · LIVE COMPOSITION</p><h2>文字正在成为图像</h2></div>
          <div className="cell-counter"><span>{cells.length.toLocaleString()}</span>文字单元 · {dimensions.width} × {dimensions.height}</div>
        </div>
        <PreviewStage
          ref={svgRef}
          imageUrl={sourceImage?.dataUrl || null}
          imageDrawRect={imageDrawRect}
          imageTransform={imageTransform.transform}
          onImageTransformChange={imageTransform.setTransform}
          imageAdjustActive={imageAdjustActive}
          detection={activeDetection}
          cells={cells}
          animation={animation}
          background={background}
          dimensions={dimensions}
          frameDataUrl={frameDataUrl}
          regionMode={regionMode}
          selections={selections}
          brush={brush}
          brushStrokes={brushStrokes}
          onBrushStrokeComplete={addBrushStroke}
          onSelectionAdd={addSelection}
          onSelectionDelete={(id) => setSelections((current) => current.filter((selection) => selection.id !== id))}
          isDetecting={isDetecting}
        />
      </section>
    </main>
  )
}

export default App
