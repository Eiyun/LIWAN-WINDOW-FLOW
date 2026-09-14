import { Crosshair, Expand, Maximize, Move, RotateCcw } from 'lucide-react'
import { imagePositionLimits, MAX_IMAGE_SCALE, MIN_IMAGE_SCALE } from '../core/imageTransform'
import type { CanvasDimensions, ImageTransform } from '../types'

interface ImageTransformControlsProps {
  active: boolean
  disabled: boolean
  transform: ImageTransform
  dimensions: CanvasDimensions
  onActiveChange: (active: boolean) => void
  onTransformChange: (transform: ImageTransform) => void
  onFit: () => void
  onFill: () => void
  onCenter: () => void
  onReset: () => void
}

function TransformSlider({ label, english, value, min, max, step, suffix, disabled = false, onChange }: {
  label: string
  english: string
  value: number
  min: number
  max: number
  step: number
  suffix: string
  disabled?: boolean
  onChange: (value: number) => void
}) {
  const progress = ((value - min) / (max - min)) * 100
  return <label className="slider-field image-transform-slider">
    <span><b>{label}<small>{english}</small></b><output>{Number(value.toFixed(step < 1 ? 2 : 0))}{suffix}</output></span>
    <input type="range" min={min} max={max} step={step} value={value} disabled={disabled} onChange={(event) => onChange(Number(event.target.value))} style={{ '--progress': `${progress}%` } as React.CSSProperties} />
  </label>
}

export function ImageTransformControls(props: ImageTransformControlsProps) {
  const limits = imagePositionLimits(props.dimensions)
  return <div className={`image-transform-controls ${props.active ? 'active' : ''}`}>
    <button className={`adjust-image-button ${props.active ? 'active' : ''}`} disabled={props.disabled} onClick={() => props.onActiveChange(!props.active)}>
      <Move size={16} /><span>调整图片<small>Adjust Image</small></span>
      <i>{props.active ? '开启 ON' : '关闭 OFF'}</i>
    </button>
    <p className="image-transform-hint">开启后可在画布直接拖动；桌面端可使用鼠标滚轮缩放。<small>Drag on canvas · Wheel to zoom</small></p>
    <TransformSlider label="图片缩放" english="Image Scale" value={props.transform.scale} min={MIN_IMAGE_SCALE} max={MAX_IMAGE_SCALE} step={0.01} suffix="×" disabled={props.disabled} onChange={(scale) => props.onTransformChange({ ...props.transform, scale })} />
    <TransformSlider label="水平位置" english="Position X" value={Math.round(props.transform.x)} min={-limits.x} max={limits.x} step={1} suffix="px" disabled={props.disabled} onChange={(x) => props.onTransformChange({ ...props.transform, x })} />
    <TransformSlider label="垂直位置" english="Position Y" value={Math.round(props.transform.y)} min={-limits.y} max={limits.y} step={1} suffix="px" disabled={props.disabled} onChange={(y) => props.onTransformChange({ ...props.transform, y })} />
    <div className="image-transform-actions">
      <button disabled={props.disabled} onClick={props.onFit}><Expand size={14} /><span>适应画布<small>Fit</small></span></button>
      <button disabled={props.disabled} onClick={props.onFill}><Maximize size={14} /><span>填满画布<small>Fill</small></span></button>
      <button disabled={props.disabled} onClick={props.onCenter}><Crosshair size={14} /><span>居中图片<small>Center</small></span></button>
      <button disabled={props.disabled} onClick={props.onReset}><RotateCcw size={14} /><span>重置图片<small>Reset</small></span></button>
    </div>
  </div>
}
