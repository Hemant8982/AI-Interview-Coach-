import { useState } from 'react'
import { CheckCircle2, AlertTriangle, Lightbulb, Download, RotateCcw, Loader2 } from 'lucide-react'
import ScoreCard from './ScoreCard.jsx'
import SkillBadge from './SkillBadge.jsx'
import { downloadPdfReport } from '../services/api.js'

export default function Result({ report, jobRole, onRestart, interviewId }) {
  const [downloading, setDownloading] = useState(false)
  const scores = report?.scores || {}
  const [candidateName, setCandidateName] = useState('')

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const blob = await downloadPdfReport(interviewId, candidateName || 'Candidate')
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'AI_Interview_Report.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert('Failed to download PDF report.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <section className="result">
      <div className="section-head">
        <h2 className="section-title">Interview Feedback</h2>
        <p className="section-desc">Role: <strong>{jobRole}</strong></p>
      </div>

      <div className="glass result__readiness">
        <div>
          <span className="result__readiness-label">Job Readiness</span>
          <div className="result__readiness-value">{scores.job_readiness || 0}%</div>
        </div>
        <div className="result__readiness-bar">
          <div className="progress__track">
            <div className="progress__bar progress__bar--accent" style={{ width: `${scores.job_readiness || 0}%` }} />
          </div>
        </div>
      </div>

      <div className="result__scores">
        <ScoreCard label="Overall" value={scores.overall || 0} color="primary" />
        <ScoreCard label="Technical" value={scores.technical || 0} color="accent" />
        <ScoreCard label="Communication" value={scores.communication || 0} color="success" />
        <ScoreCard label="Confidence" value={scores.confidence || 0} color="warning" />
      </div>

      <div className="result__columns">
        <div className="glass result__col result__col--good">
          <h3><CheckCircle2 size={18} /> Strengths</h3>
          <ul>
            {(report?.strengths || []).map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
        <div className="glass result__col result__col--bad">
          <h3><AlertTriangle size={18} /> Areas for Improvement</h3>
          <ul>
            {(report?.weaknesses || []).map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
        <div className="glass result__col result__col--tip">
          <h3><Lightbulb size={18} /> Suggestions</h3>
          <ul>
            {(report?.suggestions || []).map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      </div>

      {(report?.skills || []).length > 0 && (
        <div className="glass result__skills">
          <h3>Detected Skills</h3>
          <div className="skill-badges">
            {report.skills.map((s, i) => <SkillBadge key={s} skill={s} index={i} />)}
          </div>
        </div>
      )}

      <div className="glass result__actions">
        <input
          className="field__input"
          placeholder="Candidate name (optional)"
          value={candidateName}
          onChange={(e) => setCandidateName(e.target.value)}
        />
        <button className="btn btn--primary" onClick={handleDownload} disabled={downloading}>
          {downloading ? <Loader2 className="spin" size={16} /> : <Download size={16} />} Download PDF Report
        </button>
        <button className="btn btn--ghost" onClick={onRestart}>
          <RotateCcw size={16} /> Restart Interview
        </button>
      </div>
    </section>
  )
}
