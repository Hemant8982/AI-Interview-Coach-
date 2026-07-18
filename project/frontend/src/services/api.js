import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
})

export async function uploadResume(file, jobRole) {
  const form = new FormData()
  form.append('resume', file)
  form.append('jobRole', jobRole)
  const { data } = await api.post('/api/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function evaluateInterview(payload) {
  const { data } = await api.post('/api/evaluate', payload)
  return data
}

export async function downloadPdfReport(interviewId, candidateName) {
  const { data } = await api.post(
    '/api/report/pdf',
    { interviewId, candidateName },
    { responseType: 'blob' },
  )
  return data
}

export async function checkHealth() {
  try {
    const { data } = await api.get('/api/health')
    return data.status === 'ok'
  } catch {
    return false
  }
}

export default api
