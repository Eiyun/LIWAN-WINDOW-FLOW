export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function svgDimensions(svg: SVGSVGElement) {
  const box = svg.viewBox.baseVal
  return { width: box.width || 1080, height: box.height || 1920 }
}

export function serializeSvgInPlace(svg: SVGSVGElement) {
  const dimensions = svgDimensions(svg)
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')
  svg.setAttribute('width', String(dimensions.width))
  svg.setAttribute('height', String(dimensions.height))
  return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(svg)}`
}

export function serializeSvg(svg: SVGSVGElement, settleAnimation = true, omitFrame = false) {
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.querySelectorAll('[data-export-ignore]').forEach((node) => node.remove())
  if (omitFrame) clone.querySelectorAll('[data-layer="window-frame-png"]').forEach((node) => node.remove())
  if (settleAnimation) clone.querySelectorAll<SVGTextElement>('[data-cell-opacity]').forEach((node) => {
      node.setAttribute('opacity', node.dataset.cellOpacity || '1')
      node.setAttribute('transform', node.dataset.cellBaseTransform || '')
    })
  clone.querySelectorAll<SVGGElement>('[data-layer="subject-typographic"]').forEach((node) => node.setAttribute('opacity', '1'))
  return serializeSvgInPlace(clone)
}

export class Exporter {
  static exportSvg(svg: SVGSVGElement, filename = 'lichuang-liuying.svg') {
    downloadBlob(new Blob([serializeSvg(svg)], { type: 'image/svg+xml;charset=utf-8' }), filename)
  }

  static async exportPng(svg: SVGSVGElement, filename = 'lichuang-liuying.png') {
    await document.fonts?.ready
    const dimensions = svgDimensions(svg)
    const blob = new Blob([serializeSvg(svg)], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const element = new Image()
        element.onload = () => resolve(element)
        element.onerror = () => reject(new Error('PNG 渲染失败。'))
        element.src = url
      })
      const canvas = document.createElement('canvas')
      canvas.width = dimensions.width
      canvas.height = dimensions.height
      const context = canvas.getContext('2d')
      if (!context) throw new Error('PNG 导出失败。')
      context.drawImage(image, 0, 0, dimensions.width, dimensions.height)
      const png = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => result ? resolve(result) : reject(new Error('PNG 导出失败。')), 'image/png', 1)
      })
      downloadBlob(png, filename)
    } finally {
      URL.revokeObjectURL(url)
    }
  }
}
