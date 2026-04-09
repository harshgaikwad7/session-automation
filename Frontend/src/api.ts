// ── Central API Helper — SessionFlow Frontend ──────────────────────────────
// All API calls go through this file

const API_URL = 'http://localhost:8000'

// ── Auth helpers ───────────────────────────────────────────────────────────

export const getStoredUser = () => {
  const raw = localStorage.getItem('sf_user')
  return raw ? JSON.parse(raw) : null
}

export const saveParticipantInfo = (info: {
  id: string; uid: string; email: string; name: string
}) => {
  localStorage.setItem('sf_participant', JSON.stringify(info))
}

export const getParticipantInfo = () => {
  const raw = localStorage.getItem('sf_participant')
  return raw ? JSON.parse(raw) : null
}

export const logout = () => {
  localStorage.removeItem('sf_user')
  localStorage.removeItem('sf_participant')
}

export const isLoggedIn = (): boolean => !!getStoredUser()

// ── Generic fetch wrapper ──────────────────────────────────────────────────

async function apiFetch(path: string, options: RequestInit = {}) {
  const user = getStoredUser()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }
  if (user?.token) headers['Authorization'] = `Bearer ${user.token}`

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'API error')
  return data
}

// ── Auth ───────────────────────────────────────────────────────────────────

export const loginUser = (email: string, password: string) =>
  apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

export const registerUser = (
  full_name: string, email: string, phone: string,
  password: string, role: string
) =>
  apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ full_name, email, phone, password, role }),
  })

// ── Schedule ───────────────────────────────────────────────────────────────

export const getScheduleSessions = (status?: string, mode?: string) => {
  const params = new URLSearchParams()
  if (status && status !== 'all') params.append('status', status)
  if (mode && mode !== 'all') params.append('mode', mode)
  return apiFetch(`/api/schedule/sessions?${params}`)
}

export const getSessionById = (id: string) =>
  apiFetch(`/api/schedule/sessions/${id}`)

export const getLiveSessions = () =>
  apiFetch('/api/schedule/live')

// ── Registration ───────────────────────────────────────────────────────────

export const registerForSession = (
  full_name: string, email: string, phone: string, session_id: string
) =>
  apiFetch('/api/registration/register', {
    method: 'POST',
    body: JSON.stringify({ full_name, email, phone, session_id }),
  })

export const checkRegistration = (email: string, session_id: string) =>
  apiFetch(`/api/registration/check?email=${encodeURIComponent(email)}&session_id=${session_id}`)

export const getMySessions = (email: string) =>
  apiFetch(`/api/registration/my-sessions?email=${encodeURIComponent(email)}`)

export const cancelRegistration = (email: string, session_id: string) =>
  apiFetch(`/api/registration/cancel?email=${encodeURIComponent(email)}&session_id=${session_id}`, {
    method: 'DELETE',
  })

// ── Attendance ─────────────────────────────────────────────────────────────

export const checkinQR = (session_id: string, qr_token: string) =>
  apiFetch('/api/attendance/checkin/qr', {
    method: 'POST',
    body: JSON.stringify({ session_id, qr_token }),
  })

export const checkinOTP = (session_id: string, participant_uid: string, otp_code: string) =>
  apiFetch('/api/attendance/checkin/otp', {
    method: 'POST',
    body: JSON.stringify({ session_id, participant_uid, otp_code }),
  })

export const checkinManual = (session_id: string, participant_uid: string) =>
  apiFetch('/api/attendance/checkin/manual', {
    method: 'POST',
    body: JSON.stringify({ session_id, participant_uid }),
  })

export const getLiveStats = (session_id: string) =>
  apiFetch(`/api/attendance/live-stats/${session_id}`)

export const generateOTP = (session_id: string, participant_uid: string) =>
  apiFetch('/api/attendance/generate-otp', {
    method: 'POST',
    body: JSON.stringify({ session_id, participant_uid }),
  })

// ── Certificates ───────────────────────────────────────────────────────────

export const getMyCertificates = (email: string) =>
  apiFetch(`/api/certificates/my?email=${encodeURIComponent(email)}`)

export const verifyCertificate = (uid: string) =>
  apiFetch(`/api/certificates/verify/${uid}`)

export const downloadCertificate = (uid: string) =>
  `${API_URL}/api/certificates/download/${uid}`

// ── Dashboard ──────────────────────────────────────────────────────────────

export const getDashboardOverview = (email: string) =>
  apiFetch(`/api/dashboard/overview?email=${encodeURIComponent(email)}`)

export const getDashboardSessions = (email: string) =>
  apiFetch(`/api/dashboard/sessions?email=${encodeURIComponent(email)}`)

export const getDashboardReminders = (email: string) =>
  apiFetch(`/api/dashboard/reminders?email=${encodeURIComponent(email)}`)

export const saveReminder = (
  email: string, session_id: string,
  minutes_before: number, reminder_type: string
) =>
  apiFetch('/api/dashboard/reminders/save', {
    method: 'POST',
    body: JSON.stringify({ email, session_id, minutes_before, reminder_type }),
  })

// ── FAQ ────────────────────────────────────────────────────────────────────

export const chatWithFAQ = (messages: Array<{ role: string; content: string }>) =>
  apiFetch('/api/faq/chat', {
    method: 'POST',
    body: JSON.stringify({ messages }),
  })
