import {
  Bot,
  Brush,
  Download,
  Eraser,
  Focus,
  ImagePlus,
  Layers3,
  LoaderCircle,
  MousePointer2,
  Palette,
  RefreshCw,
  Redo2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Undo2,
  X,
} from 'lucide-react'
import type {
  AnimationSettings,
  BackgroundSettings,
  BrushSettings,
  CanvasDimensions,
  CanvasRatio,
  DetectionResult,
  DetectionSettings,
  FrameId,
  ImageTransform,
  RegionMode,
  SelectionRegion,
  TypographySettings,
} from '../types'
import { FRAME_MANIFEST, frameUrl } from '../core/FrameManifest'
import type { VideoFormat } from '../core/VideoExporter'
import { ImageTransformControls } from './ImageTransformControls'

interface ControlPanelProps {
  text: string
  onTextChange: (value: string) => void
  imageTransform: ImageTransform
  onImageTransformChange: (transform: ImageTransform) => void
  imageAdjustActive: boolean
  onImageAdjustActiveChange: (active: boolean) => void
  onImageFit: () => void
  onImageFill: () => void
  onImageCenter: () => void
  onImageReset: () => void
  dimensions: CanvasDimensions
  detectionSettings: DetectionSettings
  onDetectionChange: (settings: DetectionSettings) => void
  typography: TypographySettings
  onTypographyChange: (settings: TypographySettings) => void
  animation: AnimationSettings
  onAnimationChange: (settings: AnimationSettings) => void
  canvasRatio: CanvasRatio
  onCanvasRatioChange: (ratio: CanvasRatio) => void
  frameId: FrameId
  onFrameIdChange: (frameId: FrameId) => void
  background: BackgroundSettings
  onBackgroundChange: (settings: BackgroundSettings) => void
  regionMode: RegionMode
  onRegionModeChange: (mode: RegionMode) => void
  selections: SelectionRegion[]
  brush: BrushSettings
  onBrushChange: (settings: BrushSettings) => void
  brushStrokeCount: number
  canUndoBrush: boolean
  canRedoBrush: boolean
  onUndoBrush: () => void
  onRedoBrush: () => void
  onClearBrush: () => void
  onDeleteSelection: (id: string) => void
  onClearSelections: () => void
  onUpload: (file: File) => void
  onDetect: () => void
  onExportPng: () => void
  onExportSvg: () => void
  onExportVideo: () => void
  onCancelVideo: () => void
  videoDuration: 15 | 30 | 45 | 60
  onVideoDurationChange: (duration: 15 | 30 | 45 | 60) => void
  videoFormat: VideoFormat
  onVideoFormatChange: (format: VideoFormat) => void
  videoProgress: number | null
  videoNotice: string | null
  mp4Supported: boolean
  detection: DetectionResult | null
  imageName: string | null
  isBusy: boolean
  error: string | null
}

interface SliderProps {
  label: string
  english: string
  value: number
  min: number
  max: number
  step?: number
  suffix?: string
  onChange: (value: number) => void
}

function Slider({ label, english, value, min, max, step = 1, suffix = '', onChange }: SliderProps) {
  const progress = ((value - min) / (max - min)) * 100
  return (
    <label className="slider-field">
      <span><b>{label}<small>{english}</small></b><output>{value}{suffix}</output></span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{ '--progress': `${progress}%` } as React.CSSProperties}
      />
    </label>
  )
}

function ColorField({ label, english, value, onChange }: { label: string; english: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="color-field">
      <span>{label}<small>{english}</small></span>
      <div>
        <i style={{ backgroundColor: value }} />
        <b>{value.toUpperCase()}</b>
        <Palette size={14} />
        <input type="color" value={value} onChange={(event) => onChange(event.target.value)} aria-label={`${label} ${english}`} />
      </div>
    </label>
  )
}

function SectionTitle({ number, title, english, description }: { number: string; title: string; english: string; description: string }) {
  return (
    <div className="section-title">
      <span>{number}</span>
      <div><h2>{title}<small>{english}</small></h2><p>{description}</p></div>
    </div>
  )
}

export function ControlPanel(props: ControlPanelProps) {
  const updateDetection = (key: keyof DetectionSettings, value: number) => props.onDetectionChange({ ...props.detectionSettings, [key]: value })
  const updateTypography = (key: keyof TypographySettings, value: TypographySettings[typeof key]) => props.onTypographyChange({ ...props.typography, [key]: value })
  const updateAnimation = <K extends keyof AnimationSettings>(key: K, value: AnimationSettings[K]) => props.onAnimationChange({ ...props.animation, [key]: value })

  return (
    <aside className="control-panel">
      <header className="brand-block">
        <div className="brand-seal">荔</div>
        <div>
          <p>LIWAN · WINDOW FLOW</p>
          <h1>荔窗流影</h1>
        </div>
        <span className="version-pill">MVP 06</span>
      </header>

      <div className="privacy-note"><ShieldCheck size={14} /> 图片仅在本机处理 · Local processing only</div>

      <section className="control-section first-section">
        <SectionTitle number="01" title="图片设置" english="Image" description="选择主体清晰、明暗分明的图片" />
        <label className={`upload-zone ${props.imageName ? 'has-image' : ''}`}>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) props.onUpload(file)
              event.currentTarget.value = ''
            }}
          />
          {props.isBusy ? <LoaderCircle className="spinning" size={22} /> : <ImagePlus size={22} />}
          <span><b>{props.imageName || '上传图片 Upload Image'}</b><small>{props.imageName ? '点击替换 · Click to replace' : 'JPG / PNG / WebP · 最大 24MB'}</small></span>
        </label>
        <ImageTransformControls
          active={props.imageAdjustActive}
          disabled={!props.imageName}
          transform={props.imageTransform}
          dimensions={props.dimensions}
          onActiveChange={props.onImageAdjustActiveChange}
          onTransformChange={props.onImageTransformChange}
          onFit={props.onImageFit}
          onFill={props.onImageFill}
          onCenter={props.onImageCenter}
          onReset={props.onImageReset}
        />
        {props.error && <p className="error-message">{props.error}</p>}
      </section>

      <section className="control-section">
        <SectionTitle number="02" title="文字设置" english="Text" description="输入用于重构图像的循环文字" />
        <label className={`text-field ${Array.from(props.text).length >= 50 ? 'at-limit' : ''}`}>
          <span>文字内容 <small>Text Content</small></span>
          <textarea maxLength={50} rows={3} value={props.text} onChange={(event) => props.onTextChange(Array.from(event.target.value).slice(0, 50).join(''))} placeholder="荔湾" />
          <span className="character-count">字数 <small>Characters</small> {Array.from(props.text).length} / 50</span>
          {Array.from(props.text).length >= 50 && <em>已达到 50 字上限 · Limit reached</em>}
        </label>
      </section>

      <section className="control-section">
        <SectionTitle number="03" title="区域选择" english="Selection" description="自动主体、矩形框选或自由画笔统一生成蒙版" />
        <div className="mode-switch" role="group" aria-label="区域模式 Region Mode">
          <button className={props.regionMode === 'auto' ? 'active' : ''} onClick={() => props.onRegionModeChange('auto')}>
            <Bot size={16} /><span>自动主体<small>Auto Subject</small></span>
          </button>
          <button className={props.regionMode === 'rectangle' ? 'active' : ''} onClick={() => props.onRegionModeChange('rectangle')} disabled={!props.imageName}>
            <MousePointer2 size={16} /><span>矩形框选<small>Rectangle Selection</small></span>
          </button>
          <button className={props.regionMode === 'brush' ? 'active' : ''} onClick={() => props.onRegionModeChange('brush')} disabled={!props.imageName}>
            <Brush size={16} /><span>画笔涂抹<small>Brush Selection</small></span>
          </button>
        </div>
        <div className="region-actions">
          <button className="detect-button" onClick={() => { props.onRegionModeChange('auto'); props.onDetect() }} disabled={!props.imageName || props.isBusy}>
            {props.isBusy ? <LoaderCircle className="spinning" size={17} /> : <Focus size={17} />}
            <span>自动识别主体<small>Auto Detect Subject</small></span>
            <RefreshCw size={14} />
          </button>
          <button className="clear-button" onClick={props.onClearSelections} disabled={props.selections.length === 0 && props.brushStrokeCount === 0}>
            <Trash2 size={15} /><span>清空选区<small>Clear Selection</small></span>
          </button>
        </div>
        {props.regionMode === 'rectangle' && (
          <p className="manual-hint"><MousePointer2 size={13} /> 在右侧画布拖拽创建矩形选区；参考图与选区线不会导出。</p>
        )}
        {props.regionMode === 'brush' && (
          <div className="brush-controls">
            <p className="manual-hint"><Brush size={13} /> 使用鼠标、触控板、手指或触控笔直接涂抹；进入画笔模式后画布不会随手指滚动。</p>
            <Slider label="画笔大小" english="Brush Size" value={props.brush.size} min={20} max={220} suffix="px" onChange={(size) => props.onBrushChange({ ...props.brush, size })} />
            <Slider label="画笔硬度" english="Brush Hardness" value={Math.round(props.brush.hardness * 100)} min={10} max={100} suffix="%" onChange={(hardness) => props.onBrushChange({ ...props.brush, hardness: hardness / 100 })} />
            <div className="brush-mode-buttons" role="group" aria-label="画笔操作 Brush Operation">
              <button className={props.brush.operation === 'add' ? 'active' : ''} onClick={() => props.onBrushChange({ ...props.brush, operation: 'add' })}><Brush size={15} /><span>添加区域<small>Add</small></span></button>
              <button className={props.brush.operation === 'erase' ? 'active erase' : ''} onClick={() => props.onBrushChange({ ...props.brush, operation: 'erase' })}><Eraser size={15} /><span>擦除区域<small>Erase</small></span></button>
            </div>
            <div className="history-buttons">
              <button onClick={props.onUndoBrush} disabled={!props.canUndoBrush}><Undo2 size={14} /><span>撤销<small>Undo</small></span></button>
              <button onClick={props.onRedoBrush} disabled={!props.canRedoBrush}><Redo2 size={14} /><span>重做<small>Redo</small></span></button>
              <button onClick={props.onClearBrush} disabled={props.brushStrokeCount === 0}><Trash2 size={14} /><span>清除涂抹<small>Clear Brush</small></span></button>
            </div>
          </div>
        )}
        {props.regionMode === 'rectangle' && props.selections.length > 0 && (
          <div className="selection-list">
            {props.selections.map((selection, index) => (
              <div key={selection.id}>
                <span><i>{String(index + 1).padStart(2, '0')}</i>矩形选区 <small>{Math.round(selection.width)} × {Math.round(selection.height)}</small></span>
                <button onClick={() => props.onDeleteSelection(selection.id)} aria-label={`删除选区 ${index + 1}`}><X size={13} /></button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="control-section">
        <SectionTitle number="04" title="主体识别" english="Subject Detection" description="调节自动主体的显著性权重" />
        {props.detection && (
          <div className="detection-meter">
            <span>覆盖 {Math.round(props.detection.coverage * 100)}%</span>
            <i><em style={{ width: `${props.detection.confidence * 100}%` }} /></i>
            <span>置信度 {Math.round(props.detection.confidence * 100)}%</span>
          </div>
        )}
        <Slider label="识别灵敏度" english="Detection Sensitivity" value={Math.round(props.detectionSettings.sensitivity * 100)} min={20} max={95} suffix="%" onChange={(value) => updateDetection('sensitivity', value / 100)} />
        <Slider label="中心优先级" english="Center Priority" value={Math.round(props.detectionSettings.centerPriority * 100)} min={0} max={100} suffix="%" onChange={(value) => updateDetection('centerPriority', value / 100)} />
        <Slider label="亮度优先级" english="Brightness Priority" value={Math.round(props.detectionSettings.brightnessPriority * 100)} min={0} max={100} suffix="%" onChange={(value) => updateDetection('brightnessPriority', value / 100)} />
      </section>

      <section className="control-section">
        <SectionTitle number="05" title="文字图像" english="Typography" description="文字继承原图采样的色彩与明暗" />
        <label className="select-field">
          <span>颜色模式 <small>Color Mode</small></span>
          <div><Palette size={14} /><select value={props.typography.colorMode} onChange={(event) => updateTypography('colorMode', event.target.value as TypographySettings['colorMode'])}><option value="sampled">原图采样 Sampled Color</option></select></div>
        </label>
        <Slider label="文字密度" english="Typography Density" value={props.typography.density} min={28} max={78} onChange={(value) => updateTypography('density', value)} />
        <div className="dual-slider-row">
          <Slider label="最小字号" english="Min Font Size" value={props.typography.minFontSize} min={8} max={28} suffix="px" onChange={(value) => updateTypography('minFontSize', Math.min(value, props.typography.maxFontSize - 1))} />
          <Slider label="最大字号" english="Max Font Size" value={props.typography.maxFontSize} min={18} max={54} suffix="px" onChange={(value) => updateTypography('maxFontSize', Math.max(value, props.typography.minFontSize + 1))} />
        </div>
        <Slider label="文字透明度" english="Text Opacity" value={Math.round(props.typography.opacity * 100)} min={35} max={100} suffix="%" onChange={(value) => updateTypography('opacity', value / 100)} />
      </section>

      <section className="control-section">
        <SectionTitle number="06" title="动画设置" english="Animation" description="进入、停留、退场与循环间隔独立组合" />
        <label className="select-field">
          <span>进入动画 <small>Enter Animation</small></span>
          <div><Sparkles size={14} /><select value={props.animation.mode} onChange={(event) => updateAnimation('mode', event.target.value as AnimationSettings['mode'])}>
            <option value="typewriter">打字机 Typewriter</option>
            <option value="fade">淡入淡出 Fade In / Out</option>
            <option value="wave">波浪填充 Wave Fill</option>
            <option value="flicker">随机闪烁 Random Flicker</option>
            <option value="rain">文字雨 Text Rain</option>
          </select></div>
        </label>
        <label className="select-field">
          <span>退场动画 <small>Exit Animation</small></span>
          <div><Sparkles size={14} /><select value={props.animation.exitMode} onChange={(event) => updateAnimation('exitMode', event.target.value as AnimationSettings['exitMode'])}>
            <option value="fade-out">渐隐 Fade Out</option>
            <option value="blossom">文字成花 Blossom</option>
            <option value="scatter">四周扩散 Scatter</option>
          </select></div>
        </label>
        {props.animation.mode === 'wave' && <label className="select-field">
          <span>动画方向 <small>Animation Direction</small></span>
          <div><Layers3 size={14} /><select value={props.animation.direction} onChange={(event) => updateAnimation('direction', event.target.value as AnimationSettings['direction'])}>
            <option value="left-to-right">从左到右 Left → Right</option>
            <option value="top-to-bottom">从上到下 Top → Bottom</option>
            <option value="radial">中心扩散 Radial</option>
          </select></div>
        </label>}
        {props.animation.mode === 'rain' && <div className="rain-controls">
          <Slider label="下落速度" english="Rain Speed" value={props.animation.rainSpeed} min={0.4} max={2} step={0.05} suffix="×" onChange={(value) => updateAnimation('rainSpeed', value)} />
          <Slider label="文字雨密度" english="Rain Density" value={Math.round(props.animation.rainDensity * 100)} min={20} max={100} suffix="%" onChange={(value) => updateAnimation('rainDensity', value / 100)} />
          <Slider label="水平漂移" english="Horizontal Drift" value={Math.round(props.animation.horizontalDrift * 100)} min={0} max={40} suffix="%" onChange={(value) => updateAnimation('horizontalDrift', value / 100)} />
          <Slider label="随机程度" english="Randomness" value={Math.round(props.animation.randomness * 100)} min={0} max={80} suffix="%" onChange={(value) => updateAnimation('randomness', value / 100)} />
          <Slider label="聚合速度" english="Settle Speed" value={props.animation.settleSpeed} min={0.3} max={1.5} step={0.05} suffix="×" onChange={(value) => updateAnimation('settleSpeed', value)} />
        </div>}
        {props.animation.exitMode === 'fade-out' && <Slider label="渐隐速度" english="Fade Out Speed" value={props.animation.disappearSpeed} min={0.5} max={1.8} step={0.05} suffix="×" onChange={(value) => updateAnimation('disappearSpeed', value)} />}
        {props.animation.exitMode === 'blossom' && <div className="exit-controls">
          <Slider label="花朵数量" english="Blossom Count" value={props.animation.blossomCount} min={2} max={9} onChange={(value) => updateAnimation('blossomCount', value)} />
          <Slider label="聚合速度" english="Gather Speed" value={props.animation.gatherSpeed} min={0.4} max={1.6} step={0.05} suffix="×" onChange={(value) => updateAnimation('gatherSpeed', value)} />
          <Slider label="旋转强度" english="Rotation" value={props.animation.blossomRotation} min={0} max={1.5} step={0.05} suffix="×" onChange={(value) => updateAnimation('blossomRotation', value)} />
          <Slider label="消失速度" english="Disappear Speed" value={props.animation.disappearSpeed} min={0.5} max={1.5} step={0.05} suffix="×" onChange={(value) => updateAnimation('disappearSpeed', value)} />
        </div>}
        {props.animation.exitMode === 'scatter' && <div className="exit-controls">
          <Slider label="扩散速度" english="Scatter Speed" value={props.animation.scatterSpeed} min={0.5} max={1.8} step={0.05} suffix="×" onChange={(value) => updateAnimation('scatterSpeed', value)} />
          <Slider label="扩散范围" english="Scatter Distance" value={Math.round(props.animation.scatterDistance * 100)} min={15} max={80} suffix="%" onChange={(value) => updateAnimation('scatterDistance', value / 100)} />
          <Slider label="随机程度" english="Randomness" value={Math.round(props.animation.exitRandomness * 100)} min={0} max={80} suffix="%" onChange={(value) => updateAnimation('exitRandomness', value / 100)} />
          <Slider label="消失速度" english="Fade Speed" value={props.animation.disappearSpeed} min={0.5} max={1.5} step={0.05} suffix="×" onChange={(value) => updateAnimation('disappearSpeed', value)} />
        </div>}
        <div className="field-label timeline-label">时间线 <small>Timeline</small></div>
        <div className="dual-slider-row">
          <Slider label="进入时长" english="Enter Duration" value={props.animation.enterDuration} min={800} max={8000} step={100} suffix="ms" onChange={(value) => updateAnimation('enterDuration', value)} />
          <Slider label="停留时长" english="Hold Duration" value={props.animation.holdDuration} min={300} max={6000} step={100} suffix="ms" onChange={(value) => updateAnimation('holdDuration', value)} />
          <Slider label="退场时长" english="Exit Duration" value={props.animation.exitDuration} min={800} max={8000} step={100} suffix="ms" onChange={(value) => updateAnimation('exitDuration', value)} />
          <Slider label="循环间隔" english="Loop Delay" value={props.animation.loopDelay} min={0} max={4000} step={100} suffix="ms" onChange={(value) => updateAnimation('loopDelay', value)} />
        </div>
        <label className="toggle-field">
          <span>循环播放 <small>Loop</small></span>
          <input type="checkbox" checked={props.animation.loop} onChange={(event) => updateAnimation('loop', event.target.checked)} />
          <i />
        </label>
      </section>

      <section className="control-section">
        <SectionTitle number="07" title="花窗与背景" english="Frame & Background" description="同一 Frame ID 自动匹配三种画布比例" />
        <div className="field-label">画布比例 <small>Canvas Ratio</small></div>
        <div className="ratio-options">
          {([['1x1', '正方形', '1:1'], ['9x16', '竖版', '9:16'], ['16x9', '横版', '16:9']] as const).map(([ratio, label, english]) => <button key={ratio} className={props.canvasRatio === ratio ? 'active' : ''} onClick={() => props.onCanvasRatioChange(ratio)}><span>{label}<small>{english}</small></span></button>)}
        </div>
        <div className="field-label">花窗选择 <small>Window Frame</small></div>
        <div className="frame-thumbnails">
          {FRAME_MANIFEST.map((frame) => (
            <button key={frame.id} className={props.frameId === frame.id ? 'active' : ''} onClick={() => props.onFrameIdChange(frame.id)}>
              <img src={frameUrl(props.canvasRatio, frame.id)} alt="" draggable={false} />
              <span>{frame.name}<small>{frame.id.replace('frame', 'Frame ')}</small></span>
            </button>
          ))}
        </div>
        <ColorField label="背景颜色" english="Background Color" value={props.background.color} onChange={(color) => props.onBackgroundChange({ ...props.background, color })} />
      </section>

      <section className="export-section">
        <div><Sparkles size={15} /><span>{props.detection ? '文字图像已生成' : '等待图片或选区'}<b>{props.detection ? 'READY TO EXPORT' : 'UPLOAD OR SELECT FIRST'}</b></span></div>
        <div className="export-actions">
          <button onClick={props.onExportPng} disabled={!props.detection || props.isBusy}><Download size={16} /><span>导出 PNG<small>Export PNG</small></span></button>
          <button onClick={props.onExportSvg} disabled={!props.detection || props.isBusy}><Download size={16} /><span>导出 SVG<small>Export SVG</small></span></button>
        </div>
        <div className="video-export-settings">
          <div className="field-label">视频时长 <small>Video Duration</small></div>
          <div className="video-duration-options">{([15, 30, 45, 60] as const).map((duration) => <button key={duration} className={props.videoDuration === duration ? 'active' : ''} onClick={() => props.onVideoDurationChange(duration)}>{duration}秒<small>{duration}s</small></button>)}</div>
          <label className="select-field"><span>视频格式 <small>Video Format</small></span><div><Download size={14} /><select value={props.videoFormat} onChange={(event) => props.onVideoFormatChange(event.target.value as VideoFormat)}><option value="mp4">MP4 {props.mp4Supported ? '（推荐）' : '（浏览器需支持 H.264）'}</option><option value="webm">WebM</option></select></div></label>
          {props.videoProgress === null ? <button className="video-export-button" onClick={props.onExportVideo} disabled={!props.detection || props.isBusy}><Download size={16} /><span>导出视频<small>Export Video</small></span></button> : <div className="video-progress"><div><span>导出进度 <small>Export Progress</small></span><b>{Math.round(props.videoProgress * 100)}%</b></div><i><em style={{ width: `${props.videoProgress * 100}%` }} /></i><button onClick={props.onCancelVideo}>取消导出 <small>Cancel Export</small></button></div>}
          {props.videoNotice && <p className="video-notice">{props.videoNotice}</p>}
        </div>
      </section>
    </aside>
  )
}
