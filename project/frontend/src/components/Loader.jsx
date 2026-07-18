import { Loader2 } from 'lucide-react'

export default function Loader({ text = 'Loading...' }) { 
  return (
    <div className="loader-overlay">
      <div className="loader-box">
        <Loader2 className="spin loader-icon" size={36} />
        <p>{text}</p>
      </div>
    </div>
  )
}
