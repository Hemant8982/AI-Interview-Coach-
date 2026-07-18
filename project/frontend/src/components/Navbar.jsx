import { Bot, Home as HomeIcon } from 'lucide-react'

export default function Navbar({ onRestart, stage }) {
  return (
    <header className="navbar">
      <div className="navbar__brand" onClick={onRestart} role="button" tabIndex={0}>
        <div className="navbar__logo">
          <Bot size={22} />
        </div>
        <span className="navbar__title">AI Interview Coach</span>
      </div>
      <nav className="navbar__nav">
        {stage !== 'home' && (
          <button className="btn btn--ghost" onClick={onRestart}>
            <HomeIcon size={16} /> Home
          </button>
        )}
        <a className="navbar__link" href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">
          Gemini API
        </a>
      </nav>
    </header>
  )
}
