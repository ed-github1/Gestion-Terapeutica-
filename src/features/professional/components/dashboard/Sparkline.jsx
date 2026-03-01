/**
 * Mini sparkline SVG for outcome tracking
 */
const Sparkline = ({ scores, color = '#10b981' }) => {
    if (!scores || scores.length < 2) return null

    const max = Math.max(...scores)
    const min = Math.min(...scores)
    const range = max - min || 1
    const w = 80, h = 32, pad = 4

    const pts = scores.map((v, i) => {
        const x = pad + (i / (scores.length - 1)) * (w - pad * 2)
        const y = pad + (1 - (v - min) / range) * (h - pad * 2)
        return `${x},${y}`
    }).join(' ')

    return (
        <svg width={w} height={h} className="overflow-visible">
            <polyline
                points={pts}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {scores.map((v, i) => {
                const x = pad + (i / (scores.length - 1)) * (w - pad * 2)
                const y = pad + (1 - (v - min) / range) * (h - pad * 2)
                return i === scores.length - 1 ? (
                    <circle key={i} cx={x} cy={y} r="3" fill={color} />
                ) : null
            })}
        </svg>
    )
}

export default Sparkline
