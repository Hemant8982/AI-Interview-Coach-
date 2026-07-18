import { useEffect, useState } from 'react'
import { Sparkles, ArrowRight, Mic, FileText, Brain } from 'lucide-react'

const TYPING_TEXT = 'Crack Your AI Interview with AI'

export default function Hero({ onStart }) {
  const [typed, setTyped] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    let i = 0
    const timer = setInterval(() => {
      if (i <= TYPING_TEXT.length) {
        setTyped(TYPING_TEXT.slice(0, i))
        i++
      } else {
        clearInterval(timer)
        setDone(true)
      }
    }, 55)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="hero">
      <div className="hero__bg" aria-hidden="true">
        <div className="hero__orb hero__orb--1" />
        <div className="hero__orb hero__orb--2" />
        <div className="hero__grid" />
      </div>

      <div className="hero__content">
        <div className="hero__badge">
          <Sparkles size={14} /> Powered by Google Gemini
        </div>
        <h1 className="hero__title">
          <span className="hero__emoji">🤖</span> AI Interview Coach
        </h1>
        <h2 className="hero__subtitle">
          {typed}
          <span className={`hero__cursor ${done ? 'hero__cursor--blink' : ''}`}>|</span>
        </h2>
        <p className="hero__desc">
          Upload your resume, get AI-generated interview questions tailored to your skills and target role,
          practice with voice, and receive instant AI-powered feedback with detailed scores.
        </p>

        <button className="btn btn--primary btn--lg" onClick={onStart}>
          Start Interview <ArrowRight size={18} />
        </button>

        <div className="hero__features">
          <div className="hero__feature">
            <FileText size={20} /> Resume Parsing
          </div>
          <div className="hero__feature">
            <Brain size={20} /> AI Question Generation
          </div>
          <div className="hero__feature">
            <Mic size={20} /> Voice Interview
          </div>
        </div>
      </div>
    </section>
  )
}
