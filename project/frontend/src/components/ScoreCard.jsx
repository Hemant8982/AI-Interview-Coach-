import { useEffect, useState } from 'react'

export default function ScoreCard({ label, value, color = 'primary', size = 130 }) {
  const [animated, setAnimated] = useState(0)
  const radius = (size - 16) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (animated / 100) * circumference

  useEffect(() => {
    const t = setTimeout(() => setAnimated(value), 200)
    return () => clearTimeout(t)
  }, [value])

  return (
    <div className="scorecard">
      <svg width={size} height={size} className="scorecard__ring">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="10"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`var(--${color})`}
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 1.2s ease' }}
        />
      </svg>
      <div className="scorecard__center">
        <span className="scorecard__value">{animated}</span>
        <span className="scorecard__label">{label}</span>
      </div>
    </div>
  )
}
