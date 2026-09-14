interface TemplateProps { thickness: number }

const line = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'square' as const, strokeLinejoin: 'miter' as const }

function DenseCorner({ transform = '' }: { transform?: string }) {
  return (
    <g transform={transform}>
      <path d="M72 72H292V292H250V132H132V250H72Z" fill="currentColor" opacity=".95" />
      <path d="M92 92L188 188L92 284M284 92L188 188L284 284" {...line} strokeWidth="8" />
      <path d="M112 112H264V264H112Z" {...line} stroke="#dff2e5" strokeWidth="3" opacity=".48" />
      <path d="M146 112V264M188 112V264M230 112V264M112 146H264M112 188H264M112 230H264" {...line} strokeWidth="4" opacity=".62" />
    </g>
  )
}

function DenseCorners() {
  return <g><DenseCorner /><DenseCorner transform="translate(1080 0) scale(-1 1)" /><DenseCorner transform="translate(0 1920) scale(1 -1)" /><DenseCorner transform="translate(1080 1920) scale(-1 -1)" /></g>
}

export function SquareWindowTemplate({ thickness }: TemplateProps) {
  return (
    <g>
      <DenseCorners />
      <g {...line}>
        <rect x="166" y="586" width="748" height="748" strokeWidth={Math.max(9, thickness * .72)} />
        <rect x="190" y="610" width="700" height="700" strokeWidth={Math.max(3, thickness * .24)} opacity=".72" />
        <path d="M166 586L262 682V586M914 586L818 682V586M166 1334L262 1238V1334M914 1334L818 1238V1334" strokeWidth={Math.max(5, thickness * .4)} />
        <path d="M292 112H788M292 188H788M292 264H788M292 1656H788M292 1732H788M292 1808H788" strokeWidth={Math.max(4, thickness * .28)} />
        <path d="M350 112V586M430 112V586M510 112V586M590 112V586M670 112V586M750 112V586M350 1334V1808M430 1334V1808M510 1334V1808M590 1334V1808M670 1334V1808M750 1334V1808" strokeWidth={Math.max(3, thickness * .2)} opacity=".74" />
        <path d="M72 420H166M72 500H166M914 420H1008M914 500H1008M72 1420H166M72 1500H166M914 1420H1008M914 1500H1008" strokeWidth="7" />
      </g>
    </g>
  )
}

export function CircularWindowTemplate({ thickness }: TemplateProps) {
  return (
    <g>
      <DenseCorners />
      <g {...line}>
        <circle cx="540" cy="960" r="392" strokeWidth={Math.max(10, thickness * .8)} />
        <circle cx="540" cy="960" r="366" strokeWidth={Math.max(3, thickness * .26)} opacity=".75" />
        <circle cx="540" cy="960" r="344" strokeWidth={Math.max(5, thickness * .38)} opacity=".7" />
        <path d="M272 112H808M272 184H808M272 256H808M272 1664H808M272 1736H808M272 1808H808" strokeWidth={Math.max(4, thickness * .28)} />
        <path d="M330 112V594M408 112V574M486 112V568M594 112V568M672 112V574M750 112V594M330 1326V1808M408 1346V1808M486 1352V1808M594 1352V1808M672 1346V1808M750 1326V1808" strokeWidth={Math.max(3, thickness * .2)} opacity=".76" />
        <path d="M72 408L284 620M72 520L248 696M1008 408L796 620M1008 520L832 696M72 1512L284 1300M72 1400L248 1224M1008 1512L796 1300M1008 1400L832 1224" strokeWidth={Math.max(5, thickness * .34)} />
        <path d="M113 644L208 739L113 834L208 929L113 1024L208 1119L113 1214L208 1309M967 644L872 739L967 834L872 929L967 1024L872 1119L967 1214L872 1309" strokeWidth={Math.max(4, thickness * .28)} opacity=".82" />
      </g>
    </g>
  )
}

export function DiamondWindowTemplate({ thickness }: TemplateProps) {
  return (
    <g>
      <DenseCorners />
      <g {...line}>
        <path d="M540 382L958 960L540 1538L122 960Z" strokeWidth={Math.max(10, thickness * .78)} />
        <path d="M540 418L926 960L540 1502L154 960Z" strokeWidth={Math.max(3, thickness * .25)} opacity=".78" />
        <path d="M540 448L894 960L540 1472L186 960Z" strokeWidth={Math.max(5, thickness * .4)} opacity=".72" />
        <path d="M72 112H1008M72 190H1008M72 268H1008M72 1652H1008M72 1730H1008M72 1808H1008" strokeWidth={Math.max(4, thickness * .28)} />
        <path d="M128 112L398 490M224 112L446 422M856 112L634 422M952 112L682 490M128 1808L398 1430M224 1808L446 1498M856 1808L634 1498M952 1808L682 1430" strokeWidth={Math.max(5, thickness * .34)} />
        <path d="M72 360L290 662M72 500L242 736M1008 360L790 662M1008 500L838 736M72 1560L290 1258M72 1420L242 1184M1008 1560L790 1258M1008 1420L838 1184" strokeWidth={Math.max(3, thickness * .22)} opacity=".78" />
        <path d="M90 760L190 860L90 960L190 1060L90 1160M990 760L890 860L990 960L890 1060L990 1160" strokeWidth={Math.max(5, thickness * .32)} />
      </g>
    </g>
  )
}
