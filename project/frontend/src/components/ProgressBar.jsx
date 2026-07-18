export default function ProgressBar({ value = 0, max = 100, label, color = 'primary' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className="progress">
      {label && (
        <div className="progress__head">
          <span>{label}</span>
          <span>{Math.round(pct)}%</span>
        </div>
      )}
      <div className="progress__track">
        <div className={`progress__bar progress__bar--${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
