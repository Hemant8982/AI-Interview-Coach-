import { CheckCircle2, AlertTriangle, Lightbulb } from 'lucide-react'

/**
 * Feedback panel: renders strengths, weaknesses, and suggestions lists.
 * Used inside the Result dashboard.
 */
export default function Feedback({ strengths = [], weaknesses = [], suggestions = [] }) {
  return (
    <div className="result__columns">
      <div className="glass result__col result__col--good">
        <h3><CheckCircle2 size={18} /> Strengths</h3>
        <ul>
          {strengths.length ? strengths.map((s, i) => <li key={i}>{s}</li>) : <li>No strengths recorded.</li>}
        </ul>
      </div>
      <div className="glass result__col result__col--bad">
        <h3><AlertTriangle size={18} /> Areas for Improvement</h3>
        <ul>
          {weaknesses.length ? weaknesses.map((s, i) => <li key={i}>{s}</li>) : <li>No weaknesses recorded.</li>}
        </ul>
      </div>
      <div className="glass result__col result__col--tip">
        <h3><Lightbulb size={18} /> Suggestions</h3>
        <ul>
          {suggestions.length ? suggestions.map((s, i) => <li key={i}>{s}</li>) : <li>No suggestions recorded.</li>}
        </ul>
      </div>
    </div>
  )
}
