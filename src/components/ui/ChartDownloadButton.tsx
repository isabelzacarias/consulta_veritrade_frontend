import { useRef, useState } from 'react'
import { Download } from 'lucide-react'

const SVG_STYLE_PROPERTIES = [
  'color',
  'display',
  'fill',
  'fill-opacity',
  'font-family',
  'font-size',
  'font-style',
  'font-weight',
  'opacity',
  'paint-order',
  'stroke',
  'stroke-dasharray',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-opacity',
  'stroke-width',
  'text-anchor',
  'visibility',
]
const BAR_TONE_COLORS: Record<string, string> = {
  teal: '#5b2480',
  sky: '#06b6d4',
  amber: '#f59e0b',
  indigo: '#7c3aed',
}

function appendSvgText(
  svg: SVGSVGElement,
  text: string,
  x: number,
  y: number,
  options: { size?: number; weight?: number; fill?: string; anchor?: string } = {},
) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  node.textContent = text
  node.setAttribute('x', String(x))
  node.setAttribute('y', String(y))
  node.setAttribute('fill', options.fill ?? '#334155')
  node.setAttribute('font-family', 'Arial, sans-serif')
  node.setAttribute('font-size', String(options.size ?? 14))
  node.setAttribute('font-weight', String(options.weight ?? 400))
  node.setAttribute('text-anchor', options.anchor ?? 'start')
  svg.appendChild(node)
}

function wrapText(text: string, maxCharacters: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''

  for (const word of words) {
    const pieces =
      word.length > maxCharacters
        ? word.match(new RegExp(`.{1,${maxCharacters}}`, 'g')) ?? [word]
        : [word]
    for (const piece of pieces) {
      if (line && `${line} ${piece}`.length > maxCharacters) {
        lines.push(line)
        line = piece
      } else {
        line = line ? `${line} ${piece}` : piece
      }
    }
  }
  if (line) lines.push(line)
  return lines
}

function createBarListSvg(
  list: HTMLOListElement,
  title: string,
  subtitle: string,
): SVGSVGElement {
  const namespace = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(namespace, 'svg')
  const items = [...list.querySelectorAll(':scope > li')]
  const width = 1200
  const rowHeight = 66
  const top = 108
  const height = Math.max(180, top + items.length * rowHeight + 20)
  svg.setAttribute('xmlns', namespace)
  svg.setAttribute('width', String(width))
  svg.setAttribute('height', String(height))
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`)

  const background = document.createElementNS(namespace, 'rect')
  background.setAttribute('width', String(width))
  background.setAttribute('height', String(height))
  background.setAttribute('fill', '#ffffff')
  svg.appendChild(background)

  appendSvgText(svg, title, 28, 38, { size: 20, weight: 700, fill: '#0f172a' })
  if (subtitle) {
    appendSvgText(svg, subtitle, 28, 64, { size: 13, fill: '#64748b' })
  }

  const tone = BAR_TONE_COLORS[list.dataset.chartTone ?? ''] ?? '#5b2480'
  items.forEach((item, index) => {
    const labelNode = item.querySelector('p')
    const label =
      labelNode?.getAttribute('title') ?? labelNode?.textContent?.trim() ?? ''
    const topRow = item.querySelector(':scope > div')
    const value = topRow?.querySelector(':scope > span')?.textContent?.trim() ?? ''
    const meta = labelNode?.parentElement?.querySelector(':scope > div')?.textContent?.trim() ?? ''
    const barRow = item.querySelector(':scope > div:nth-child(2)')
    const barFill = barRow?.querySelector(':scope > div > div')
    const pct = barRow?.querySelector(':scope > span')?.textContent?.trim()
    const y = top + index * rowHeight
    const trackWidth = pct ? 1000 : 1120
    const barWidth = Math.max(
      0,
      Math.min(
        trackWidth,
        (Number.parseFloat(barFill?.getAttribute('style')?.match(/width:\s*([\d.]+)%/)?.[1] ?? '0') /
          100) *
          trackWidth,
      ),
    )

    appendSvgText(svg, label, 28, y, { size: 14, weight: 600 })
    appendSvgText(svg, value, width - 28, y, {
      size: 13,
      fill: '#64748b',
      anchor: 'end',
    })
    if (meta) appendSvgText(svg, meta, 28, y + 18, { size: 11, fill: '#94a3b8' })

    const track = document.createElementNS(namespace, 'rect')
    track.setAttribute('x', '28')
    track.setAttribute('y', String(y + 28))
    track.setAttribute('width', String(trackWidth))
    track.setAttribute('height', '10')
    track.setAttribute('rx', '5')
    track.setAttribute('fill', '#f1f5f9')
    svg.appendChild(track)

    const bar = document.createElementNS(namespace, 'rect')
    bar.setAttribute('x', '28')
    bar.setAttribute('y', String(y + 28))
    bar.setAttribute('width', String(barWidth))
    bar.setAttribute('height', '10')
    bar.setAttribute('rx', '5')
    bar.setAttribute('fill', tone)
    svg.appendChild(bar)

    if (pct) {
      appendSvgText(svg, pct, width - 28, y + 37, {
        size: 11,
        weight: 600,
        fill: tone,
        anchor: 'end',
      })
    }

    if (index < items.length - 1) {
      const separator = document.createElementNS(namespace, 'line')
      separator.setAttribute('x1', '28')
      separator.setAttribute('x2', String(width - 28))
      separator.setAttribute('y1', String(y + 52))
      separator.setAttribute('y2', String(y + 52))
      separator.setAttribute('stroke', '#e2e8f0')
      svg.appendChild(separator)
    }
  })

  return svg
}

async function downloadSvgAsPng(
  svg: SVGSVGElement,
  fileName: string,
  title?: string,
  subtitle?: string,
  footerLines: string[] = [],
): Promise<void> {
  const bounds = svg.getBoundingClientRect()
  const width = Math.round(
    bounds.width || Number(svg.getAttribute('width')),
  )
  const height = Math.round(
    bounds.height || Number(svg.getAttribute('height')),
  )
  if (width <= 0 || height <= 0) {
    throw new Error('La gráfica no tiene dimensiones para exportar.')
  }

  const clone = svg.cloneNode(true) as SVGSVGElement
  const sourceNodes = [svg, ...svg.querySelectorAll('*')]
  const clonedNodes = [clone, ...clone.querySelectorAll('*')]

  sourceNodes.forEach((source, index) => {
    const target = clonedNodes[index]
    if (!(target instanceof SVGElement)) return
    const computed = window.getComputedStyle(source)
    for (const property of SVG_STYLE_PROPERTIES) {
      const value = computed.getPropertyValue(property)
      if (value) target.style.setProperty(property, value)
    }
  })

  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', String(width))
  clone.setAttribute('height', String(height))
  if (!clone.hasAttribute('viewBox')) {
    clone.setAttribute('viewBox', `0 0 ${width} ${height}`)
  }

  const overlay = svg
    .closest('section')
    ?.querySelector<HTMLElement>('[data-chart-overlay]')
  if (overlay) {
    const overlayBounds = overlay.getBoundingClientRect()
    const viewBox = clone.viewBox.baseVal
    const scaleX = viewBox.width / bounds.width
    const scaleY = viewBox.height / bounds.height
    const centerX =
      ((overlayBounds.left + overlayBounds.width / 2 - bounds.left) * scaleX)
    const centerY =
      ((overlayBounds.top + overlayBounds.height / 2 - bounds.top) * scaleY)
    const lines = [...overlay.querySelectorAll<HTMLElement>(':scope > span')]
    const lineHeight = 16 * scaleY
    const firstLineY = centerY - ((lines.length - 1) * lineHeight) / 2

    lines.forEach((line, index) => {
      const style = window.getComputedStyle(line)
      const text = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'text',
      )
      text.textContent = line.textContent?.trim() ?? ''
      text.setAttribute('x', String(centerX))
      text.setAttribute('y', String(firstLineY + index * lineHeight))
      text.setAttribute('text-anchor', 'middle')
      text.setAttribute('dominant-baseline', 'middle')
      text.style.fill = style.color
      text.style.fontFamily = style.fontFamily
      text.style.fontSize = `${Number.parseFloat(style.fontSize) * scaleY}px`
      text.style.fontWeight = style.fontWeight
      clone.appendChild(text)
    })
  }

  let exportSvg = clone
  let exportHeight = height

  if (title) {
    const namespace = 'http://www.w3.org/2000/svg'
    const titleLines = wrapText(title, Math.max(16, Math.floor((width - 48) / 10)))
    const subtitleLines = subtitle
      ? wrapText(subtitle, Math.max(20, Math.floor((width - 48) / 7)))
      : []
    const wrappedFooter = footerLines.flatMap((line) =>
      wrapText(line, Math.max(24, Math.floor((width - 48) / 6))),
    )
    const titleHeight = titleLines.length * 24
    const subtitleHeight = subtitleLines.length ? subtitleLines.length * 16 + 6 : 0
    const headerHeight = 16 + titleHeight + subtitleHeight + 10
    const footerHeight = wrappedFooter.length ? 20 + wrappedFooter.length * 17 : 0
    exportHeight = headerHeight + height + footerHeight

    const composite = document.createElementNS(namespace, 'svg')
    composite.setAttribute('xmlns', namespace)
    composite.setAttribute('width', String(width))
    composite.setAttribute('height', String(exportHeight))
    composite.setAttribute('viewBox', `0 0 ${width} ${exportHeight}`)

    const background = document.createElementNS(namespace, 'rect')
    background.setAttribute('width', String(width))
    background.setAttribute('height', String(exportHeight))
    background.setAttribute('fill', '#ffffff')
    composite.appendChild(background)
    titleLines.forEach((line, index) =>
      appendSvgText(composite, line, 24, 20 + index * 24, {
        size: 20,
        weight: 700,
        fill: '#0f172a',
      }),
    )
    subtitleLines.forEach((line, index) =>
      appendSvgText(
        composite,
        line,
        24,
        16 + titleHeight + 8 + index * 16,
        { size: 12, fill: '#64748b' },
      ),
    )

    clone.setAttribute('x', '0')
    clone.setAttribute('y', String(headerHeight))
    composite.appendChild(clone)
    wrappedFooter.forEach((line, index) => {
      appendSvgText(
        composite,
        line,
        24,
        headerHeight + height + 20 + index * 17,
        { size: 11, fill: '#475569' },
      )
    })
    exportSvg = composite
  }

  const serialized = new XMLSerializer().serializeToString(exportSvg)
  const imageUrl = URL.createObjectURL(
    new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' }),
  )

  try {
    const image = new Image()
    image.src = imageUrl
    await image.decode()

    const scale = 2
    const canvas = document.createElement('canvas')
    canvas.width = width * scale
    canvas.height = exportHeight * scale
    const context = canvas.getContext('2d')
    if (!context) throw new Error('No se pudo preparar la imagen PNG.')

    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.scale(scale, scale)
    context.drawImage(image, 0, 0, width, exportHeight)

    const png = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error('No se pudo generar la imagen PNG.'))
      }, 'image/png')
    })
    const downloadUrl = URL.createObjectURL(png)
    try {
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `${fileName}.png`
      link.click()
    } finally {
      URL.revokeObjectURL(downloadUrl)
    }
  } finally {
    URL.revokeObjectURL(imageUrl)
  }
}

interface ChartDownloadButtonProps {
  fileName: string
}

export function ChartDownloadButton({
  fileName,
}: ChartDownloadButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDownload = async () => {
    const section = buttonRef.current?.closest('section')
    const chart = section
      ? [...section.querySelectorAll<SVGSVGElement>('svg.recharts-surface')]
          .sort((a, b) => {
            const boundsA = a.getBoundingClientRect()
            const boundsB = b.getBoundingClientRect()
            return (
              boundsB.width * boundsB.height - boundsA.width * boundsA.height
            )
          })[0]
      : undefined
    const list = section?.querySelector<HTMLOListElement>(
      'ol[data-chart-export-list]',
    )
    const isBarList = !chart && Boolean(list)
    const svg =
      chart ??
      (list
        ? createBarListSvg(
            list,
            section?.querySelector('h2')?.textContent?.trim() ?? fileName,
            section?.querySelector('header p')?.textContent?.trim() ?? '',
          )
        : null)
    if (!svg) {
      setError('No se encontró la gráfica para descargar.')
      return
    }

    setError(null)
    setIsDownloading(true)
    try {
      const footerLines = isBarList || !section
        ? []
        : [...section.querySelectorAll<HTMLElement>('[data-chart-export-footer]')]
            .flatMap((element) => {
              const titledItems = [
                ...element.querySelectorAll<HTMLElement>(':scope [title]'),
              ]
              if (titledItems.length) {
                return titledItems.map((item) => {
                  const title = item.getAttribute('title')
                  const text = item.innerText.trim()
                  return title ? `${text} — ${title}` : text
                })
              }
              const rows = [...element.querySelectorAll<HTMLElement>(':scope > li')]
              if (rows.length) {
                return rows.map((row) => {
                  const detail = row.getAttribute('title')
                  const text = row.innerText.trim()
                  return detail ? `${text} — ${detail}` : text
                })
              }
              return element.innerText
                .split('\n')
                .map((line) => line.trim())
                .filter(Boolean)
            })
      const title = section?.querySelector('h2')?.textContent?.trim()
      const subtitle = section?.querySelector('header p')?.textContent?.trim()
      await downloadSvgAsPng(
        svg,
        fileName,
        isBarList ? undefined : title,
        isBarList ? undefined : subtitle,
        footerLines,
      )
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : 'No se pudo descargar la gráfica.',
      )
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleDownload}
        disabled={isDownloading}
        aria-label={`Descargar gráfica ${fileName} como PNG`}
        title="Descargar gráfica como PNG"
        className="inline-flex size-8 items-center justify-center rounded-lg border border-brand-200 bg-white text-brand-700 transition hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-wait disabled:opacity-60"
      >
        <Download className="size-4" />
      </button>
      {error && (
        <span role="alert" className="max-w-40 text-[10px] text-red-700">
          {error}
        </span>
      )}
    </span>
  )
}
