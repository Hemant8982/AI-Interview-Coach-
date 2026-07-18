import { Check } from 'lucide-react'

export default function SkillBadge({ skill, index = 0 }) {
  return (
    <span 
      className="skill-badge"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <Check size={12} /> {skill}
    </span>
  )
}
