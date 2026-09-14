import type { FrameStyle } from '../types'
import { CircularWindowTemplate, DiamondWindowTemplate, SquareWindowTemplate } from './frameTemplates'

interface WindowFrameProps {
  style: FrameStyle
  thickness: number
  color: string
}

interface FramePartProps {
  thickness: number
}

const lineStyle = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'square' as const,
  strokeLinejoin: 'miter' as const,
}

function LayeredRails({ thickness }: FramePartProps) {
  return (
    <g {...lineStyle}>
      <rect x="20" y="20" width="1040" height="1880" rx="5" strokeWidth={Math.max(5, thickness * 0.78)} />
      <rect x="42" y="42" width="996" height="1836" rx="3" strokeWidth={Math.max(2, thickness * 0.2)} opacity=".92" />
      <rect x="61" y="61" width="958" height="1798" rx="2" strokeWidth={Math.max(4, thickness * 0.46)} opacity=".64" />
      <rect x="79" y="79" width="922" height="1762" rx="2" strokeWidth={Math.max(2, thickness * 0.16)} opacity=".9" />
      <path d="M36 36H1044M36 1884H1044" stroke="#e8f5ec" strokeWidth={Math.max(1.5, thickness * 0.08)} opacity=".28" />
    </g>
  )
}

function CornerBloom() {
  return (
    <g {...lineStyle}>
      <path d="M78 278V78H278" strokeWidth="12" />
      <path d="M96 246V96H246" strokeWidth="3" opacity=".82" />
      <path d="M98 204H138V164H178V124H220" strokeWidth="8" />
      <path d="M112 112H190V190H151V151H190" strokeWidth="5" />
      <path d="M112 222L146 188L180 222L146 256Z" strokeWidth="5" />
      <path d="M222 112L188 146L222 180L256 146Z" strokeWidth="5" />
      <circle cx="146" cy="222" r="10" strokeWidth="4" />
      <circle cx="222" cy="146" r="10" strokeWidth="4" />
      <path d="M82 278L112 248M278 82L248 112" strokeWidth="4" opacity=".7" />
    </g>
  )
}

function FourCorners() {
  return (
    <g>
      <CornerBloom />
      <g transform="translate(1080 0) scale(-1 1)"><CornerBloom /></g>
      <g transform="translate(0 1920) scale(1 -1)"><CornerBloom /></g>
      <g transform="translate(1080 1920) scale(-1 -1)"><CornerBloom /></g>
    </g>
  )
}

function JadeKnot({ transform }: { transform: string }) {
  return (
    <g transform={transform} {...lineStyle}>
      <path d="M0 -31L31 0L0 31L-31 0Z" strokeWidth="7" />
      <path d="M0 -18L18 0L0 18L-18 0Z" strokeWidth="3" opacity=".8" />
      <circle r="5" fill="currentColor" stroke="none" />
      <path d="M-48 0H-31M31 0H48" strokeWidth="4" />
    </g>
  )
}

function CardinalKnots() {
  return (
    <g>
      <JadeKnot transform="translate(540 79)" />
      <JadeKnot transform="translate(540 1841) rotate(180)" />
      <JadeKnot transform="translate(79 960) rotate(90)" />
      <JadeKnot transform="translate(1001 960) rotate(-90)" />
    </g>
  )
}

function MeanderFrame({ thickness }: FramePartProps) {
  const unit = 64
  return (
    <g>
      <defs>
        <pattern id="meander-h" width={unit} height="58" patternUnits="userSpaceOnUse">
          <path d="M0 45H42V14H14V30H64" {...lineStyle} strokeWidth={Math.max(4, thickness * 0.32)} />
        </pattern>
        <pattern id="meander-v" width={unit} height="58" patternUnits="userSpaceOnUse" patternTransform="rotate(90)">
          <path d="M0 45H42V14H14V30H64" {...lineStyle} strokeWidth={Math.max(4, thickness * 0.32)} />
        </pattern>
      </defs>
      <LayeredRails thickness={thickness} />
      <g fill="currentColor">
        <rect x="126" y="88" width="828" height="58" fill="url(#meander-h)" />
        <rect x="126" y="1774" width="828" height="58" fill="url(#meander-h)" transform="rotate(180 540 1803)" />
        <rect x="88" y="148" width="58" height="1624" fill="url(#meander-v)" />
        <rect x="934" y="148" width="58" height="1624" fill="url(#meander-v)" transform="rotate(180 963 960)" />
      </g>
      <FourCorners />
      <CardinalKnots />
      <g {...lineStyle} strokeWidth={Math.max(3, thickness * 0.2)} opacity=".72">
        <path d="M242 117H470M610 117H838M242 1803H470M610 1803H838" />
        <path d="M117 286V800M117 1120V1634M963 286V800M963 1120V1634" />
      </g>
    </g>
  )
}

function OctagonFrame({ thickness }: FramePartProps) {
  const outer = 'M190 24H890L1056 190V1730L890 1896H190L24 1730V190L190 24Z'
  const middle = 'M212 61H868L1019 212V1708L868 1859H212L61 1708V212L212 61Z'
  const inner = 'M232 91H848L989 232V1688L848 1829H232L91 1688V232L232 91Z'
  return (
    <g {...lineStyle}>
      <path d={outer} strokeWidth={Math.max(6, thickness * 0.82)} />
      <path d={middle} strokeWidth={Math.max(3, thickness * 0.32)} opacity=".86" />
      <path d={inner} strokeWidth={Math.max(5, thickness * 0.54)} />
      <path d="M190 24V190H24M890 24V190H1056M190 1896V1730H24M890 1896V1730H1056" strokeWidth={Math.max(4, thickness * 0.36)} />
      <path d="M91 232L232 373V232H91ZM989 232L848 373V232H989ZM91 1688L232 1547V1688H91ZM989 1688L848 1547V1688H989Z" strokeWidth={Math.max(5, thickness * 0.42)} />
      <path d="M86 187L187 86L288 187L187 288ZM994 187L893 86L792 187L893 288ZM86 1733L187 1834L288 1733L187 1632ZM994 1733L893 1834L792 1733L893 1632Z" strokeWidth={Math.max(3, thickness * 0.25)} />
      <path d="M122 187H252M187 122V252M828 187H958M893 122V252M122 1733H252M187 1668V1798M828 1733H958M893 1668V1798" strokeWidth={Math.max(3, thickness * 0.22)} opacity=".8" />
      <CardinalKnots />
      <g strokeWidth={Math.max(3, thickness * 0.22)} opacity=".7">
        <path d="M286 91L326 131L366 91L406 131L446 91M634 91L674 131L714 91L754 131L794 91" />
        <path d="M286 1829L326 1789L366 1829L406 1789L446 1829M634 1829L674 1789L714 1829L754 1789L794 1829" />
        <path d="M91 420L131 460L91 500L131 540L91 580M91 1340L131 1380L91 1420L131 1460L91 1500" />
        <path d="M989 420L949 460L989 500L949 540L989 580M989 1340L949 1380L989 1420L949 1460L989 1500" />
      </g>
      <circle cx="187" cy="187" r="18" strokeWidth="5" />
      <circle cx="893" cy="187" r="18" strokeWidth="5" />
      <circle cx="187" cy="1733" r="18" strokeWidth="5" />
      <circle cx="893" cy="1733" r="18" strokeWidth="5" />
    </g>
  )
}

function PetalRosette({ x, y, rotation = 0 }: { x: number; y: number; rotation?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotation})`} {...lineStyle}>
      <path d="M0 -38C18 -38 30 -25 30 -10C45 -10 56 0 56 0C56 0 45 10 30 10C30 25 18 38 0 38C-18 38 -30 25 -30 10C-45 10 -56 0 -56 0C-56 0 -45 -10 -30 -10C-30 -25 -18 -38 0 -38Z" strokeWidth="5" />
      <path d="M0 -22L22 0L0 22L-22 0Z" strokeWidth="3" />
      <circle r="6" fill="currentColor" stroke="none" />
    </g>
  )
}

function BegoniaFrame({ thickness }: FramePartProps) {
  const outer = 'M315 25H765C765 122 838 195 935 195V675C1012 675 1055 783 1055 960C1055 1137 1012 1245 935 1245V1725C838 1725 765 1798 765 1895H315C315 1798 242 1725 145 1725V1245C68 1245 25 1137 25 960C25 783 68 675 145 675V195C242 195 315 122 315 25Z'
  const inner = 'M342 72H738C738 152 806 220 886 220V709C966 709 1008 800 1008 960C1008 1120 966 1211 886 1211V1700C806 1700 738 1768 738 1848H342C342 1768 274 1700 194 1700V1211C114 1211 72 1120 72 960C72 800 114 709 194 709V220C274 220 342 152 342 72Z'
  return (
    <g {...lineStyle}>
      <path d={outer} strokeWidth={Math.max(6, thickness * 0.82)} />
      <path d={inner} strokeWidth={Math.max(5, thickness * 0.48)} />
      <path d={inner} transform="translate(540 960) scale(.965 .975) translate(-540 -960)" strokeWidth={Math.max(2, thickness * 0.18)} opacity=".75" />
      <path d="M145 195L242 292H145V195ZM935 195L838 292H935V195ZM145 1725L242 1628H145V1725ZM935 1725L838 1628H935V1725Z" strokeWidth={Math.max(5, thickness * 0.42)} />
      <path d="M315 25L372 82L315 139L258 82ZM765 25L822 82L765 139L708 82ZM315 1895L372 1838L315 1781L258 1838ZM765 1895L822 1838L765 1781L708 1838Z" strokeWidth={Math.max(3, thickness * 0.25)} />
      <PetalRosette x={540} y={92} />
      <PetalRosette x={540} y={1828} rotation={180} />
      <PetalRosette x={104} y={960} rotation={90} />
      <PetalRosette x={976} y={960} rotation={-90} />
      <g strokeWidth={Math.max(3, thickness * 0.22)} opacity=".78">
        <path d="M372 92H478M602 92H708M372 1828H478M602 1828H708" />
        <path d="M119 736V848M119 1072V1184M961 736V848M961 1072V1184" />
        <path d="M194 302L242 350L194 398L242 446L194 494M886 302L838 350L886 398L838 446L886 494" />
        <path d="M194 1618L242 1570L194 1522L242 1474L194 1426M886 1618L838 1570L886 1522L838 1474L886 1426" />
      </g>
      <circle cx="194" cy="220" r="13" strokeWidth="4" />
      <circle cx="886" cy="220" r="13" strokeWidth="4" />
      <circle cx="194" cy="1700" r="13" strokeWidth="4" />
      <circle cx="886" cy="1700" r="13" strokeWidth="4" />
    </g>
  )
}

function FrameArtwork({ style, thickness }: { style: FrameStyle; thickness: number }) {
  if (style === 'octagon') return <OctagonFrame thickness={thickness} />
  if (style === 'begonia') return <BegoniaFrame thickness={thickness} />
  if (style === 'square') return <SquareWindowTemplate thickness={thickness} />
  if (style === 'circular') return <CircularWindowTemplate thickness={thickness} />
  if (style === 'diamond') return <DiamondWindowTemplate thickness={thickness} />
  return <MeanderFrame thickness={thickness} />
}

function FrameFoundation() {
  return (
    <g>
      <path
        d="M0 0H1080V58H0ZM0 1862H1080V1920H0ZM0 58H58V1862H0ZM1022 58H1080V1862H1022Z"
        fill="currentColor"
      />
      <path
        d="M46 46H174V174H46ZM906 46H1034V174H906ZM46 1746H174V1874H46ZM906 1746H1034V1874H906Z"
        fill="currentColor"
        opacity=".96"
      />
      <g fill="none" stroke="#0b3f43" strokeWidth="5" opacity=".76">
        <path d="M10 27H1070M10 1893H1070M27 10V1910M1053 10V1910" />
        <path d="M64 64H156V156H64L110 110L156 156M924 64H1016V156H924L970 110L924 64" />
        <path d="M64 1764H156V1856H64L110 1810L156 1764M924 1764H1016V1856H924L970 1810L924 1856" />
      </g>
      <g fill="none" stroke="#e2f3e7" strokeWidth="2" opacity=".34">
        <path d="M8 8H1072V1912H8Z" />
        <path d="M48 48H1032V1872H48Z" />
      </g>
    </g>
  )
}

export function WindowFrame({ style, thickness, color }: WindowFrameProps) {
  return (
    <g className="window-frame" data-layer="window-frame" style={{ color }} pointerEvents="none">
      <defs>
        <filter id="frame-carving-shadow" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="3" dy="5" stdDeviation="3.5" floodColor="#061b23" floodOpacity=".48" />
        </filter>
      </defs>
      <FrameFoundation />
      <g transform="translate(4 6)" style={{ color: '#071f27' }} opacity=".52">
        <FrameArtwork style={style} thickness={thickness * 1.12} />
      </g>
      <g filter="url(#frame-carving-shadow)">
        <FrameArtwork style={style} thickness={thickness} />
      </g>
      <rect x="13" y="13" width="1054" height="1894" rx="6" fill="none" stroke="#e1f2e6" strokeWidth={Math.max(1.5, thickness * 0.09)} opacity=".46" />
    </g>
  )
}
