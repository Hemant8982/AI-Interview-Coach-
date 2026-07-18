import { useRef, useState } from 'react'
import { UploadCloud, FileText, Loader2, Briefcase } from 'lucide-react'
import Loader from './Loader.jsx'

const JOB_ROLES = [
  'AI Engineer',
  'ML Engineer',
  'Python Developer',
  'Data Analyst',
  'Data Scientist',
  'Full Stack Developer',
  'Backend Engineer',
  'DevOps Engineer',
]

export default function ResumeUpload({ onUpload, loading, jobRole }) {
  const [file, setFile] = useState(null)
  const [role, setRole] = useState(jobRole || 'AI Engineer')
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const handleFile = (f) => {
    const name = f.name.toLowerCase()
    if (!name.endsWith('.pdf') && !name.endsWith('.docx')) {
      alert('Please upload a PDF or DOCX file.')
      return
    }
    setFile(f)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0])
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!file) return
    onUpload(file, role)
  }

  return (
    <section className="upload">
      <div className="section-head">
        <h2 className="section-title">Upload Your Resume</h2>
        <p className="section-desc">We'll extract your skills and generate a tailored interview.</p>
      </div>

      <form className="glass upload__form" onSubmit={handleSubmit}>
        <label
          className={`dropzone ${dragOver ? 'dropzone--over' : ''} ${file ? 'dropzone--filled' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx"
            hidden
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          {file ? (
            <div className="dropzone__file">
              <FileText size={28} />
              <div>
                <strong>{file.name}</strong>
                <span>{(file.size / 1024).toFixed(1)} KB</span>
              </div>
            </div>
          ) : (
            <div className="dropzone__empty">
              <UploadCloud size={40} />
              <p>Drag & drop your resume here, or <span>browse</span></p>
              <span className="dropzone__hint">PDF or DOCX • Max 10MB</span>
            </div>
          )}
        </label>

        <div className="field">
          <label className="field__label">
            <Briefcase size={16} /> Job Role
          </label>
          <select className="field__select" value={role} onChange={(e) => setRole(e.target.value)}>
            {JOB_ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <button className="btn btn--primary btn--lg btn--block" type="submit" disabled={!file || loading}>
          {loading ? (
            <><Loader2 className="spin" size={18} /> Analyzing Resume...</>
          ) : (
            <>Analyze Resume</>
          )}
        </button>
      </form>

      {loading && <Loader text="Extracting skills and generating questions..." />}
    </section>
  )
}
