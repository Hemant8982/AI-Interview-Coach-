import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

export default function Timer({ running = true }) {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [running])

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')

  return (
    <div className="timer">
      <Clock size={16} /> {mm}:{ss}
    </div>
  )
}
