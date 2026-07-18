import { useEffect, useRef, useState } from 'react'
import { Mic, Square, ArrowRight, Send, Keyboard, MicOff } from 'lucide-react'
import ProgressBar from './ProgressBar.jsx'
import Timer from './Timer.jsx'
import Loader from './Loader.jsx' 

export default function VoiceInterview({ questions, answers, setAnswers, onSubmit, loading }) {
  const [current, setCurrent] = useState(0)
  const [recording, setRecording] = useState(false)
  const [interim, setInterim] = useState('')
  const [voiceSupported, setVoiceSupported] = useState(true)
  const [autoScroll] = useState(true)
  const recognitionRef = useRef(null)
  const answerRef = useRef(null)

  const total = questions.length
  const isLast = current === total - 1

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      setVoiceSupported(false)
      return
    }
    const rec = new SR()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-US'

    rec.onresult = (event) => {
      let finalText = ''
      let interimText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) finalText += transcript + ' '
        else interimText += transcript
      }
      if (finalText) {
        setAnswers((prev) => {
          const next = [...prev]
          next[current] = (next[current] || '') + finalText
          return next
        })
      }
      setInterim(interimText)
    }
    rec.onerror = (e) => {
      console.warn('Speech error:', e.error)
      setRecording(false)
    }
    rec.onend = () => {
      setRecording(false)
      setInterim('')
    }
    recognitionRef.current = rec
    return () => {
      try { rec.stop() } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current])

  const toggleRecording = () => {
    const rec = recognitionRef.current
    if (!rec) return
    if (recording) {
      rec.stop()
      setRecording(false)
    } else {
      try {
        rec.start()
        setRecording(true)
      } catch (e) {
        console.warn(e)
      }
    }
  }

  const handleTextChange = (e) => {
    setAnswers((prev) => {
      const next = [...prev]
      next[current] = e.target.value
      return next
    })
  }

  const goNext = () => {
    if (current < total - 1) setCurrent((c) => c + 1)
  }

  const handleSubmit = () => {
    onSubmit(answers)
  }

  const q = questions[current]
  const answer = answers[current] || ''
  const progress = ((current + 1) / total) * 100

  return (
    <section className="interview">
      <div className="interview__topbar">
        <div className="interview__counter">
          Question {current + 1} of {total}
        </div>
        <Timer running />
      </div>

      <ProgressBar value={progress} color="primary" />

      <div className="glass interview__card">
        <div className="interview__meta">
          <span className={`qcard__diff qcard__diff--${q.difficulty?.toLowerCase() || 'primary'}`}>{q.difficulty}</span>
          {q.topic && <span className="qcard__topic">{q.topic}</span>}
        </div>
        <h3 className="interview__question">{q.question}</h3>

        <textarea
          ref={answerRef}
          className="interview__answer"
          placeholder="Your answer will appear here as you speak, or type manually..."
          value={answer + (recording && interim ? ' ' + interim : '')}
          onChange={handleTextChange}
          rows={8}
        />

        <div className="interview__controls">
          <button
            className={`btn ${recording ? 'btn--danger' : 'btn--voice'}`}
            onClick={toggleRecording}
            disabled={!voiceSupported}
            title={voiceSupported ? 'Toggle voice input' : 'Voice not supported in this browser'}
          >
            {recording ? <><Square size={16} /> Stop Recording</> : <><Mic size={16} /> Start Recording</>}
          </button>
          {!voiceSupported && (
            <span className="muted small">
              <Keyboard size={14} /> Voice not supported - type manually
            </span>
          )}
          {recording && <span className="rec-dot"><MicOff size={12} /> Listening...</span>}
        </div>

        <div className="interview__nav">
          <button className="btn btn--ghost" disabled={current === 0} onClick={() => setCurrent((c) => c - 1)}>
            Previous
          </button>
          {isLast ? (
            <button className="btn btn--primary" onClick={handleSubmit} disabled={loading}>
              <Send size={16} /> {loading ? 'Evaluating...' : 'Submit Interview'}
            </button>
          ) : (
            <button className="btn btn--primary" onClick={goNext}>
              Next <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>

      {loading && <Loader text="Evaluating your answers with Gemini..." />}
    </section>
  )
}
