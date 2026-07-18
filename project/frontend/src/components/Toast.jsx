import { useEffect } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

export default function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000)
    return () => clearTimeout(t)
  }, [onClose])

  const Icon = type === 'success' ? CheckCircle2 : type === 'error' ? AlertCircle : Info
  return (
    <div className={`toast toast--${type}`}>
      <Icon size={18} />
      <span>{message}</span>
      <button className="toast__close" onClick={onClose}><X size={14} /></button>
    </div>
  )
}
