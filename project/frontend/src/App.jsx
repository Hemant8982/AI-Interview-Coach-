import { useState, useCallback } from 'react'
import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import ResumeUpload from './components/ResumeUpload.jsx'  
import QuestionCard from './components/QuestionCard.jsx'
import VoiceInterview from './components/VoiceInterview.jsx'
import Result from './components/Result.jsx'
import Footer from './components/Footer.jsx'
import Toast from './components/Toast.jsx'
import { uploadResume, evaluateInterview } from './services/api.js'

export default function App() {
  const [stage, setStage] = useState('home') // home | upload | questions | interview | result
  const [loading, setLoading] = useState(false)
  const [skills, setSkills] = useState([])
  const [questions, setQuestions] = useState([])
  const [interviewId, setInterviewId] = useState(null)
  const [jobRole, setJobRole] = useState('')
  const [report, setReport] = useState(null)
  const [answers, setAnswers] = useState([])
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() })
  }, [])

  const handleStart = () => setStage('upload')

  const handleUpload = async (file, role) => {
    setLoading(true)
    setJobRole(role)
    try {
      const res = await uploadResume(file, role)
      setSkills(res.skills || [])
      setQuestions(res.questions || [])
      setInterviewId(res.interviewId)
      setStage('questions')
      showToast('Resume analyzed successfully!', 'success')
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Upload failed.'
      showToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleStartInterview = (initialAnswers) => {
    setAnswers(initialAnswers || new Array(questions.length).fill(''))
    setStage('interview')
  }

  const handleSubmitInterview = async (finalAnswers) => {
    setLoading(true)
    try {
      const res = await evaluateInterview({
        interviewId,
        questions,
        answers: finalAnswers,
        skills,
      })
      setReport(res.report)
      setStage('result')
      showToast('Interview evaluated!', 'success')
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Evaluation failed.'
      showToast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleRestart = () => {
    setStage('home')
    setSkills([])
    setQuestions([])
    setReport(null)
    setAnswers([])
    setInterviewId(null)
    setJobRole('')
  }

  return (
    <div className="app">
      <Navbar onRestart={handleRestart} stage={stage} />
      <main className="main">
        {stage === 'home' && <Hero onStart={handleStart} />}
        {stage === 'upload' && (
          <ResumeUpload onUpload={handleUpload} loading={loading} jobRole={jobRole} />
        )}
        {stage === 'questions' && (
          <QuestionCard
            skills={skills}
            questions={questions}
            jobRole={jobRole}
            onStartInterview={handleStartInterview}
          />
        )}
        {stage === 'interview' && (
          <VoiceInterview
            questions={questions}
            answers={answers}
            setAnswers={setAnswers}
            onSubmit={handleSubmitInterview}
            loading={loading}
          />
        )}
        {stage === 'result' && (
          <Result
            report={report}
            jobRole={jobRole}
            onRestart={handleRestart}
            interviewId={interviewId}
          />
        )}
      </main>
      <Footer />
      {toast && <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
