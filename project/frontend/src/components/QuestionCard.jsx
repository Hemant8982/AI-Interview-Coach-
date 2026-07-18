import { useState } from 'react'
import { Brain, ArrowRight, ListChecks, Sparkles } from 'lucide-react'
import SkillBadge from './SkillBadge.jsx'
import ProgressBar from './ProgressBar.jsx'

const DIFFICULTY_COLOR = {
  Easy: 'success',
  Medium: 'warning',
  Hard: 'error',
}

export default function QuestionCard({ skills, questions, jobRole, onStartInterview }) {
  const [selected, setSelected] = useState(null)
  const skillMatch = skills.length ? Math.round((skills.length / 30) * 100) : 0

  return (
    <section className="questions">
      <div className="section-head">
        <h2 className="section-title">Your Interview is Ready</h2>
        <p className="section-desc">
          Role: <strong>{jobRole}</strong> • {questions.length} questions generated
        </p>
      </div>

      <div className="questions__layout">
        <aside className="glass questions__sidebar">
          <h3 className="sidebar-title"><Sparkles size={16} /> Detected Skills</h3>
          {skills.length ? (
            <div className="skill-badges">
              {skills.map((s, i) => (
                <SkillBadge key={s} skill={s} index={i} />
              ))}
            </div>
          ) : (
            <p className="muted">No skills detected from your resume.</p>
          )}
          <div className="sidebar-match">
            <ProgressBar label="Skill Match" value={skillMatch} color="accent" />
          </div>
        </aside>

        <div className="questions__list">
          <div className="questions__list-head">
            <ListChecks size={18} /> Interview Questions
          </div>
          {questions.map((q, i) => (
            <div
              key={i}
              className={`glass qcard ${selected === i ? 'qcard--open' : ''}`}
              onClick={() => setSelected(selected === i ? null : i)}
            >
              <div className="qcard__head">
                <span className="qcard__num">{i + 1}</span>
                <span className={`qcard__diff qcard__diff--${DIFFICULTY_COLOR[q.difficulty] || 'primary'}`}>
                  {q.difficulty}
                </span>
                {q.topic && <span className="qcard__topic">{q.topic}</span>}
              </div>
              <p className="qcard__question">{q.question}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="questions__cta">
        <button className="btn btn--primary btn--lg" onClick={() => onStartInterview()}>
          <Brain size={18} /> Start Interview <ArrowRight size={18} />
        </button>
      </div>
    </section>
  )
}
