import type { CanvasDimensions, ImageDrawRect, RegionMode, SelectionRegion } from '../types'

interface SelectionOverlayProps {
  mode: RegionMode
  imageUrl: string
  imageRect: ImageDrawRect
  imageMaskId: string | null
  adjustingImage: boolean
  selections: SelectionRegion[]
  draft: Omit<SelectionRegion, 'id'> | null
  onSelectionDelete: (id: string) => void
  dimensions: CanvasDimensions
}

export function SelectionOverlay({ mode, imageUrl, imageRect, imageMaskId, adjustingImage, selections, draft, onSelectionDelete, dimensions }: SelectionOverlayProps) {
  if (mode === 'auto' && !adjustingImage) return null
  const label = adjustingImage ? '拖动调整位置 · 滚轮缩放图片' : mode === 'brush' ? '直接涂抹 · 绿色添加 / 红色擦除' : '拖拽框选 · 参考图不会导出'
  const margin = Math.min(dimensions.width, dimensions.height) * .04

  return (
    <g data-export-ignore="true" className="selection-overlay">
      <image href={imageUrl} x={imageRect.x} y={imageRect.y} width={imageRect.width} height={imageRect.height} preserveAspectRatio="none" mask={imageMaskId ? `url(#${imageMaskId})` : undefined} filter="url(#sampling-guide)" />
      <rect x={margin} y={margin} width={dimensions.width - margin * 2} height={dimensions.height - margin * 2} rx="8" fill="none" stroke="#dff7e7" strokeWidth="3" strokeDasharray="12 12" opacity=".5" />
      <g transform={`translate(${dimensions.width / 2} ${margin + 43})`}>
        <rect x="-228" y="-29" width="456" height="58" rx="29" fill="#071d28" opacity=".88" />
        <text y="8" textAnchor="middle" fill="#e9f8ef" fontFamily="sans-serif" fontSize="21" letterSpacing="1.5">{label}</text>
      </g>
      {adjustingImage && <g opacity=".72">
        <path d={`M${dimensions.width / 2 - 34} ${dimensions.height / 2}H${dimensions.width / 2 + 34}M${dimensions.width / 2} ${dimensions.height / 2 - 34}V${dimensions.height / 2 + 34}`} stroke="#e8fff0" strokeWidth="3" />
        <circle cx={dimensions.width / 2} cy={dimensions.height / 2} r="13" fill="none" stroke="#e8fff0" strokeWidth="2" />
      </g>}
      {!adjustingImage && mode === 'rectangle' && selections.map((selection, index) => (
        <g key={selection.id}>
          <rect x={selection.x} y={selection.y} width={selection.width} height={selection.height} fill="#62d48c" fillOpacity=".1" stroke="#baf5cd" strokeWidth="5" strokeDasharray="18 10" />
          <g transform={`translate(${selection.x + 8} ${selection.y + 8})`}>
            <rect width="78" height="42" rx="4" fill="#164f42" opacity=".95" />
            <text x="39" y="28" textAnchor="middle" fill="white" fontFamily="sans-serif" fontSize="20">选区 {index + 1}</text>
          </g>
          <g
            className="selection-delete"
            transform={`translate(${selection.x + selection.width - 25} ${selection.y + 25})`}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => { event.stopPropagation(); onSelectionDelete(selection.id) }}
          >
            <circle r="22" fill="#09272b" stroke="#c9f5d7" strokeWidth="3" />
            <path d="M-7 -7L7 7M7 -7L-7 7" stroke="white" strokeWidth="3" />
          </g>
        </g>
      ))}
      {!adjustingImage && mode === 'rectangle' && draft && <rect x={draft.x} y={draft.y} width={draft.width} height={draft.height} fill="#7ae29b" fillOpacity=".16" stroke="#ecfff1" strokeWidth="6" strokeDasharray="14 9" />}
    </g>
  )
}
