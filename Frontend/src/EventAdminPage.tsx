import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// ── Types ──────────────────────────────────────────────────────
interface Session {
  id: string
  title: string
  date: string
  time: string
  venue: string
  mode: 'online' | 'offline' | 'hybrid'
  speaker: string
  speakerId: string
  capacity: number
  registered: number
  attended: number
  status: 'upcoming' | 'live' | 'completed' | 'cancelled'
  tags: string[]
  description: string
}

interface Speaker {
  id: string
  name: string
  role: string
  org: string
  email: string
  sessions: number
  rating: number
  avatar: string
}

interface Participant {
  id: string
  name: string
  email: string
  sessionId: string
  participantId: string
  registered: string
  attended: boolean
  certificateIssued: boolean
}

// ── Mock Data ──────────────────────────────────────────────────
const INITIAL_SESSIONS: Session[] = [
  { id: 's1', title: 'Introduction to Social Impact Measurement', date: '2026-04-10', time: '10:00 AM', venue: 'Renovation Hall A, Mumbai', mode: 'hybrid', speaker: 'Dr. Priya Sharma', speakerId: 'sp1', capacity: 100, registered: 74, attended: 68, status: 'upcoming', tags: ['Impact', 'NGO', 'Beginner'], description: 'Learn how NGOs measure and communicate their social impact effectively.' },
  { id: 's2', title: 'Community Fundraising Strategies', date: '2026-04-14', time: '2:00 PM', venue: 'Online (Zoom)', mode: 'online', speaker: 'Rahul Mehta', speakerId: 'sp2', capacity: 200, registered: 130, attended: 112, status: 'live', tags: ['Fundraising', 'Strategy'], description: 'Practical strategies for grassroots fundraising campaigns.' },
  { id: 's3', title: 'Youth Leadership & Civic Engagement', date: '2026-04-18', time: '11:00 AM', venue: 'Renovation Centre, Pune', mode: 'offline', speaker: 'Aisha Khan', speakerId: 'sp3', capacity: 60, registered: 58, attended: 0, status: 'upcoming', tags: ['Youth', 'Leadership'], description: 'Empowering young leaders with civic participation tools.' },
  { id: 's4', title: 'Digital Tools for NGO Operations', date: '2026-03-28', time: '3:00 PM', venue: 'Online (Teams)', mode: 'online', speaker: 'Dr. Priya Sharma', speakerId: 'sp1', capacity: 150, registered: 143, attended: 138, status: 'completed', tags: ['Tech', 'Operations'], description: 'Leveraging digital tools to streamline NGO workflows.' },
]

const SPEAKERS: Speaker[] = [
  { id: 'sp1', name: 'Dr. Priya Sharma', role: 'Impact Strategist', org: 'GiveIndia Foundation', email: 'priya@giveindia.org', sessions: 2, rating: 4.9, avatar: '👩‍💼' },
  { id: 'sp2', name: 'Rahul Mehta', role: 'Fundraising Consultant', org: 'PMNRF Advisory', email: 'rahul.mehta@pmnrf.in', sessions: 1, rating: 4.7, avatar: '👨‍💻' },
  { id: 'sp3', name: 'Aisha Khan', role: 'Youth Programs Lead', org: 'CivicIndia Trust', sessions: 1, rating: 4.8, email: 'aisha@civicindia.org', avatar: '👩‍🏫' },
]

const PARTICIPANTS: Participant[] = [
  { id: 'p1', name: 'Arjun Nair', email: 'arjun@email.com', sessionId: 's1', participantId: 'RF-A3X9K2', registered: '2026-04-02', attended: true, certificateIssued: true },
  { id: 'p2', name: 'Sneha Patil', email: 'sneha@email.com', sessionId: 's1', participantId: 'RF-B7M4N1', registered: '2026-04-03', attended: false, certificateIssued: false },
  { id: 'p3', name: 'Vikram Desai', email: 'vikram@email.com', sessionId: 's2', participantId: 'RF-C2P8Q5', registered: '2026-04-05', attended: true, certificateIssued: false },
  { id: 'p4', name: 'Meera Joshi', email: 'meera@email.com', sessionId: 's2', participantId: 'RF-D6R3S7', registered: '2026-04-06', attended: true, certificateIssued: true },
  { id: 'p5', name: 'Ravi Kumar', email: 'ravi@email.com', sessionId: 's3', participantId: 'RF-E9T1U8', registered: '2026-04-07', attended: false, certificateIssued: false },
  { id: 'p6', name: 'Pooja Singh', email: 'pooja@email.com', sessionId: 's4', participantId: 'RF-F4V6W2', registered: '2026-03-20', attended: true, certificateIssued: true },
]

// ── Helpers ────────────────────────────────────────────────────
const modeColor = (m: string) => m === 'online' ? '#22d3ee' : m === 'offline' ? '#a78bfa' : '#fb923c'
const statusConfig = (s: string) => {
  if (s === 'live') return { color: '#4ade80', bg: 'rgba(74,222,128,0.15)', border: 'rgba(74,222,128,0.4)', dot: true }
  if (s === 'completed') return { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.3)', dot: false }
  if (s === 'cancelled') return { color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)', dot: false }
  return { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.3)', dot: false }
}
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

// ── Main Component ─────────────────────────────────────────────
export default function EventAdminPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'overview' | 'sessions' | 'speakers' | 'participants'>('overview')
  const [sessions, setSessions] = useState<Session[]>(INITIAL_SESSIONS)
  const [participants, setParticipants] = useState<Participant[]>(PARTICIPANTS)
  const [sessionFilter, setSessionFilter] = useState<string>('all')
  const [participantSession, setParticipantSession] = useState<string>('all')
  const [searchP, setSearchP] = useState('')
  const [showAddSession, setShowAddSession] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  // New session form state
  const [form, setForm] = useState({ title: '', date: '', time: '', venue: '', mode: 'online' as Session['mode'], speaker: '', capacity: '', description: '', tags: '' })

  // ── Sync with localStorage ─────────────────────────────────
  useEffect(() => {
    const sync = () => {
      try {
        const raw = localStorage.getItem('sf_registrations')
        const localRegs = raw ? (JSON.parse(raw) as Participant[]) : []

        // Merge with initial participants
        const combined = [...localRegs, ...PARTICIPANTS]
        // Filter duplicates by participantId
        const unique = Array.from(new Map(combined.map(p => [p.participantId, p])).values())

        // Sort by registration date NEWEST first
        unique.sort((a, b) => new Date(b.registered).getTime() - new Date(a.registered).getTime())

        setParticipants(unique)

        // Update session registered counts
        setSessions(prev => prev.map(s => {
          const extra = localRegs.filter(r => r.sessionId === s.id).length
          const original = INITIAL_SESSIONS.find(is => is.id === s.id)?.registered || 0
          return { ...s, registered: original + extra }
        }))
      } catch (err) {
        console.error("Sync error:", err)
      }
    }

    sync()
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Stats ──────────────────────────────────────────────────
  const totalRegistered = sessions.reduce((a, s) => a + s.registered, 0)
  const totalAttended = sessions.reduce((a, s) => a + s.attended, 0)
  const avgAttendance = totalRegistered ? Math.round((totalAttended / totalRegistered) * 100) : 0
  const liveSession = sessions.find(s => s.status === 'live')

  // ── Session CRUD ───────────────────────────────────────────
  const handleAddSession = () => {
    if (!form.title || !form.date || !form.speaker) { showToast('Please fill required fields', 'error'); return }
    const newSession: Session = {
      id: 's' + Date.now(),
      title: form.title, date: form.date, time: form.time || '10:00 AM',
      venue: form.venue || 'TBD', mode: form.mode, speaker: form.speaker,
      speakerId: 'sp1', capacity: parseInt(form.capacity) || 100,
      registered: 0, attended: 0, status: 'upcoming',
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      description: form.description,
    }
    setSessions(prev => [newSession, ...prev])
    setForm({ title: '', date: '', time: '', venue: '', mode: 'online', speaker: '', capacity: '', description: '', tags: '' })
    setShowAddSession(false)
    showToast('Session created successfully!')
  }

  const handleDeleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id))
    setDeleteConfirm(null)
    showToast('Session deleted')
  }

  const handleStatusChange = (id: string, status: Session['status']) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, status } : s))
    showToast(`Status updated to ${status}`)
  }

  const toggleCertificate = (pid: string) => {
    setParticipants(prev => prev.map(p => p.id === pid ? { ...p, certificateIssued: !p.certificateIssued } : p))
  }

  const filteredSessions = sessions.filter(s => sessionFilter === 'all' || s.status === sessionFilter)
  const filteredParticipants = participants.filter(p => {
    const matchSession = participantSession === 'all' || p.sessionId === participantSession
    const matchSearch = p.name.toLowerCase().includes(searchP.toLowerCase()) || p.participantId.toLowerCase().includes(searchP.toLowerCase()) || p.email.toLowerCase().includes(searchP.toLowerCase())
    return matchSession && matchSearch
  })

  const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 10, padding: '11px 14px', color: '#e2e2ff', fontSize: 13, outline: 'none', fontFamily: "'Sora', sans-serif", boxSizing: 'border-box' as const }
  const labelStyle = { fontSize: 12, color: '#7c86a2', fontWeight: 600, marginBottom: 6, display: 'block' as const, textTransform: 'uppercase' as const, letterSpacing: '0.5px' }

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d1a', color: '#e2e2ff', fontFamily: "'Sora', sans-serif", paddingBottom: 80 }}>
      <button onClick={() => navigate('/')} style={{ position: 'absolute', top: 20, left: 20, background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)', color: '#a78bfa', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', zIndex: 10 }}>← Back to Home</button>

      {/* ── Toast ── */}
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, background: toast.type === 'success' ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)', border: `1px solid ${toast.type === 'success' ? 'rgba(74,222,128,0.5)' : 'rgba(248,113,113,0.5)'}`, borderRadius: 12, padding: '14px 20px', fontSize: 14, color: toast.type === 'success' ? '#4ade80' : '#f87171', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, animation: 'slideInRight 0.3s ease', backdropFilter: 'blur(12px)' }}>
          {toast.type === 'success' ? '✅' : '⚠️'} {toast.msg}
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ background: 'linear-gradient(135deg, #1a1a3e 0%, #12122b 100%)', borderBottom: '1px solid rgba(139,92,246,0.2)', padding: '32px 24px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 20, padding: '4px 14px', marginBottom: 12, fontSize: 12, color: '#a78bfa' }}>
                🛡️ Admin Panel
              </div>
              <h1 style={{ fontSize: 'clamp(24px,4vw,36px)', fontWeight: 800, margin: 0, background: 'linear-gradient(135deg, #fff 0%, #c4b5fd 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Event Management
              </h1>
              <p style={{ color: '#6b7280', fontSize: 14, margin: '6px 0 0' }}>Full control over sessions, speakers & participants</p>
            </div>
            {liveSession && (
              <div style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.35)', borderRadius: 14, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', display: 'inline-block', animation: 'livePulse 1.5s infinite' }} />
                <div>
                  <div style={{ fontSize: 11, color: '#4ade80', fontWeight: 700, textTransform: 'uppercase' }}>Live Now</div>
                  <div style={{ fontSize: 13, color: '#e2e2ff', fontWeight: 600 }}>{liveSession.title.slice(0, 32)}…</div>
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {(['overview', 'sessions', 'speakers', 'participants'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: '12px 20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: "'Sora', sans-serif", color: tab === t ? '#c4b5fd' : '#6b7280', borderBottom: tab === t ? '2px solid #8b5cf6' : '2px solid transparent', marginBottom: -1, transition: 'all 0.2s', textTransform: 'capitalize' }}>
                {t === 'overview' ? '📊 Overview' : t === 'sessions' ? '📅 Sessions' : t === 'speakers' ? '👤 Speakers' : '👥 Participants'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '32px auto 0', padding: '0 24px' }}>

        {/* ══════════════════════════════════════
            OVERVIEW TAB
        ══════════════════════════════════════ */}
        {tab === 'overview' && (
          <div>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
              {[
                { label: 'Total Sessions', value: sessions.length, icon: '📅', color: '#8b5cf6', sub: `${sessions.filter(s => s.status === 'upcoming').length} upcoming` },
                { label: 'Total Registered', value: totalRegistered, icon: '📋', color: '#22d3ee', sub: 'across all sessions' },
                { label: 'Attendance Rate', value: avgAttendance + '%', icon: '✅', color: '#4ade80', sub: `${totalAttended} attended` },
                { label: 'Speakers', value: SPEAKERS.length, icon: '🎤', color: '#fb923c', sub: 'active conductors' },
                { label: 'Certs Issued', value: participants.filter(p => p.certificateIssued).length, icon: '🏆', color: '#fbbf24', sub: `of ${participants.length} participants` },
              ].map((kpi, i) => (
                <div key={kpi.label} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${kpi.color}33`, borderRadius: 16, padding: '22px', animation: `fadeUp 0.4s ${i * 0.08}s both` }}>
                  <div style={{ fontSize: 26, marginBottom: 10 }}>{kpi.icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: kpi.color, marginBottom: 2 }}>{kpi.value}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#c4b5fd', marginBottom: 3 }}>{kpi.label}</div>
                  <div style={{ fontSize: 11, color: '#4b5563' }}>{kpi.sub}</div>
                </div>
              ))}
            </div>

            {/* Sessions by Status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
              {/* Status breakdown */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 18, padding: '24px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa', marginBottom: 18, textTransform: 'uppercase', letterSpacing: 1 }}>Session Status</div>
                {(['live', 'upcoming', 'completed', 'cancelled'] as const).map(st => {
                  const count = sessions.filter(s => s.status === st).length
                  const cfg = statusConfig(st)
                  return (
                    <div key={st} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {cfg.dot && <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color, display: 'inline-block', animation: 'livePulse 1.5s infinite' }} />}
                        <span style={{ fontSize: 13, color: cfg.color, fontWeight: 600, textTransform: 'capitalize' }}>{st}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 80, height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 10 }}>
                          <div style={{ width: `${(count / sessions.length) * 100}%`, height: '100%', background: cfg.color, borderRadius: 10 }} />
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: cfg.color, width: 16, textAlign: 'right' }}>{count}</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Top sessions by registration */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 18, padding: '24px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa', marginBottom: 18, textTransform: 'uppercase', letterSpacing: 1 }}>Registration Fill Rate</div>
                {sessions.slice(0, 4).map(s => {
                  const pct = Math.round((s.registered / s.capacity) * 100)
                  return (
                    <div key={s.id} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
                        <span style={{ color: '#c4b5fd', fontWeight: 600, maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</span>
                        <span style={{ color: pct >= 90 ? '#f87171' : pct >= 70 ? '#fb923c' : '#4ade80', fontWeight: 700 }}>{pct}%</span>
                      </div>
                      <div style={{ height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 10 }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: pct >= 90 ? '#f87171' : pct >= 70 ? '#fb923c' : '#8b5cf6', borderRadius: 10, transition: 'width 0.8s ease' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Recent Activity */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 18, padding: '24px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa', marginBottom: 18, textTransform: 'uppercase', letterSpacing: 1 }}>Recent Registrations</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {participants.slice(0, 8).map((p, i) => {
                  const session = sessions.find(s => s.id === p.sessionId)
                  return (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, fontWeight: 700 }}>
                        {p.name.charAt(0)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e2ff' }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{session?.title?.slice(0, 40)}…</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{fmtDate(p.registered)}</div>
                        <div style={{ fontSize: 10, color: '#a78bfa', fontWeight: 600 }}>{p.participantId}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            SESSIONS TAB
        ══════════════════════════════════════ */}
        {tab === 'sessions' && (
          <div>
            {/* Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(['all', 'live', 'upcoming', 'completed', 'cancelled'] as const).map(f => {
                  const cfg = f !== 'all' ? statusConfig(f) : { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.3)' }
                  return (
                    <button key={f} onClick={() => setSessionFilter(f)} style={{ padding: '8px 16px', borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Sora', sans-serif", border: sessionFilter === f ? `1px solid ${cfg.color}` : '1px solid rgba(255,255,255,0.1)', background: sessionFilter === f ? cfg.bg : 'rgba(255,255,255,0.03)', color: sessionFilter === f ? cfg.color : '#6b7280', textTransform: 'capitalize', transition: 'all 0.2s' }}>
                      {f === 'all' ? 'All' : f}
                    </button>
                  )
                })}
              </div>
              <button onClick={() => setShowAddSession(true)} style={{ padding: '10px 22px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', border: 'none', color: '#fff', fontFamily: "'Sora', sans-serif", display: 'flex', alignItems: 'center', gap: 8 }}>
                ＋ New Session
              </button>
            </div>

            {/* Sessions Table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredSessions.map((session, idx) => {
                const cfg = statusConfig(session.status)
                const fillPct = Math.round((session.registered / session.capacity) * 100)
                return (
                  <div key={session.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.12)', borderRadius: 16, padding: '20px 24px', animation: `fadeUp 0.3s ${idx * 0.06}s both` }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 260 }}>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
                          <span style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 7, padding: '2px 10px', fontSize: 11, fontWeight: 700, color: cfg.color, display: 'flex', alignItems: 'center', gap: 5 }}>
                            {cfg.dot && <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color, animation: 'livePulse 1.5s infinite', display: 'inline-block' }} />}
                            {session.status.toUpperCase()}
                          </span>
                          <span style={{ background: `${modeColor(session.mode)}22`, border: `1px solid ${modeColor(session.mode)}44`, borderRadius: 7, padding: '2px 10px', fontSize: 11, fontWeight: 700, color: modeColor(session.mode) }}>{session.mode}</span>
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e2ff', marginBottom: 4 }}>{session.title}</div>
                        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#6b7280', flexWrap: 'wrap' }}>
                          <span>👤 {session.speaker}</span>
                          <span>📅 {fmtDate(session.date)} · {session.time}</span>
                          <span>📍 {session.venue}</span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexShrink: 0 }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: '#c4b5fd' }}>{session.registered}</div>
                          <div style={{ fontSize: 10, color: '#4b5563' }}>Registered</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: '#22d3ee' }}>{session.capacity}</div>
                          <div style={{ fontSize: 10, color: '#4b5563' }}>Capacity</div>
                        </div>
                        {session.status === 'completed' && (
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 18, fontWeight: 800, color: '#4ade80' }}>{session.attended}</div>
                            <div style={{ fontSize: 10, color: '#4b5563' }}>Attended</div>
                          </div>
                        )}
                        {/* Fill bar */}
                        <div style={{ width: 70 }}>
                          <div style={{ fontSize: 11, color: fillPct >= 90 ? '#f87171' : '#6b7280', textAlign: 'right', marginBottom: 3, fontWeight: 600 }}>{fillPct}%</div>
                          <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 10 }}>
                            <div style={{ width: `${fillPct}%`, height: '100%', background: fillPct >= 90 ? '#f87171' : fillPct >= 70 ? '#fb923c' : '#8b5cf6', borderRadius: 10 }} />
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                        {/* Status quick-change */}
                        <select
                          value={session.status}
                          onChange={e => handleStatusChange(session.id, e.target.value as Session['status'])}
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 8, padding: '7px 10px', color: '#c4b5fd', fontSize: 12, cursor: 'pointer', fontFamily: "'Sora', sans-serif", outline: 'none' }}
                        >
                          <option value="upcoming">Upcoming</option>
                          <option value="live">Live</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <button onClick={() => setDeleteConfirm(session.id)} style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🗑</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Add Session Modal */}
            {showAddSession && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backdropFilter: 'blur(6px)' }}>
                <div style={{ background: '#12122b', border: '1px solid rgba(139,92,246,0.35)', borderRadius: 20, padding: '32px', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#e2e2ff' }}>＋ Create New Session</h3>
                    <button onClick={() => setShowAddSession(false)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#94a3b8', cursor: 'pointer', width: 32, height: 32, borderRadius: 8, fontSize: 16 }}>✕</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={labelStyle}>Session Title *</label>
                      <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Digital Tools for NGOs" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Date *</label>
                      <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Time</label>
                      <input value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} placeholder="e.g. 10:00 AM" style={inputStyle} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={labelStyle}>Venue</label>
                      <input value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} placeholder="Hall name, city or Online (Zoom)" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Speaker *</label>
                      <input value={form.speaker} onChange={e => setForm(f => ({ ...f, speaker: e.target.value }))} placeholder="Speaker name" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Capacity</label>
                      <input type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} placeholder="100" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Mode</label>
                      <select value={form.mode} onChange={e => setForm(f => ({ ...f, mode: e.target.value as Session['mode'] }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                        <option value="online">Online</option>
                        <option value="offline">Offline</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Tags (comma separated)</label>
                      <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="NGO, Leadership, Beginner" style={inputStyle} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={labelStyle}>Description</label>
                      <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief session description..." rows={3} style={{ ...inputStyle, resize: 'vertical' as const }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                    <button onClick={() => setShowAddSession(false)} style={{ flex: 1, padding: '12px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontFamily: "'Sora', sans-serif" }}>Cancel</button>
                    <button onClick={handleAddSession} style={{ flex: 2, padding: '12px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', border: 'none', color: '#fff', fontFamily: "'Sora', sans-serif" }}>Create Session →</button>
                  </div>
                </div>
              </div>
            )}

            {/* Delete Confirm */}
            {deleteConfirm && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backdropFilter: 'blur(6px)' }}>
                <div style={{ background: '#12122b', border: '1px solid rgba(248,113,113,0.4)', borderRadius: 18, padding: '32px', maxWidth: 380, width: '100%', textAlign: 'center' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#e2e2ff', margin: '0 0 8px' }}>Delete Session?</h3>
                  <p style={{ color: '#7c86a2', fontSize: 14, margin: '0 0 24px' }}>This action cannot be undone. All registrations for this session will also be removed.</p>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: '12px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontFamily: "'Sora', sans-serif", fontSize: 14 }}>Cancel</button>
                    <button onClick={() => handleDeleteSession(deleteConfirm)} style={{ flex: 1, padding: '12px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', background: 'rgba(248,113,113,0.2)', border: '1px solid rgba(248,113,113,0.5)', color: '#f87171', fontFamily: "'Sora', sans-serif", fontSize: 14 }}>Delete</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════
            SPEAKERS TAB
        ══════════════════════════════════════ */}
        {tab === 'speakers' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {SPEAKERS.map((spk, i) => (
              <div key={spk.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 18, padding: '24px', animation: `fadeUp 0.4s ${i * 0.1}s both`, transition: 'all 0.25s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(139,92,246,0.4)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.06)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(139,92,246,0.15)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)' }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{spk.avatar}</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e2ff', marginBottom: 2 }}>{spk.name}</div>
                    <div style={{ fontSize: 12, color: '#a78bfa', marginBottom: 2 }}>{spk.role}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{spk.org}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <div style={{ flex: 1, background: 'rgba(139,92,246,0.08)', borderRadius: 10, padding: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#c4b5fd' }}>{spk.sessions}</div>
                    <div style={{ fontSize: 10, color: '#6b7280' }}>Sessions</div>
                  </div>
                  <div style={{ flex: 1, background: 'rgba(251,191,36,0.08)', borderRadius: 10, padding: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#fbbf24' }}>⭐ {spk.rating}</div>
                    <div style={{ fontSize: 10, color: '#6b7280' }}>Rating</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 14 }}>📧 {spk.email}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{ flex: 1, padding: '9px', borderRadius: 9, fontWeight: 700, fontSize: 12, cursor: 'pointer', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)', color: '#c4b5fd', fontFamily: "'Sora', sans-serif" }}>
                    View Sessions
                  </button>
                  <button style={{ flex: 1, padding: '9px', borderRadius: 9, fontWeight: 700, fontSize: 12, cursor: 'pointer', background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.3)', color: '#22d3ee', fontFamily: "'Sora', sans-serif" }}>
                    📧 Email
                  </button>
                </div>
              </div>
            ))}

            {/* Add Speaker CTA */}
            <div style={{ background: 'rgba(139,92,246,0.04)', border: '2px dashed rgba(139,92,246,0.25)', borderRadius: 18, padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', minHeight: 200, transition: 'all 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(139,92,246,0.08)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(139,92,246,0.5)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(139,92,246,0.04)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(139,92,246,0.25)' }}
              onClick={() => showToast('Speaker management coming in next update!')}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>➕</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#a78bfa' }}>Add Speaker</div>
              <div style={{ fontSize: 12, color: '#4b5563', marginTop: 4 }}>Invite a new conductor</div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            PARTICIPANTS TAB
        ══════════════════════════════════════ */}
        {tab === 'participants' && (
          <div>
            {/* Filters */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }}>🔍</span>
                <input value={searchP} onChange={e => setSearchP(e.target.value)} placeholder="Search by name, ID, email..."
                  style={{ ...inputStyle, paddingLeft: 36 }} />
              </div>
              <select value={participantSession} onChange={e => setParticipantSession(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 10, padding: '11px 14px', color: '#c4b5fd', fontSize: 13, cursor: 'pointer', fontFamily: "'Sora', sans-serif", outline: 'none', minWidth: 200 }}>
                <option value="all">All Sessions</option>
                {sessions.map(s => <option key={s.id} value={s.id}>{s.title.slice(0, 35)}…</option>)}
              </select>
            </div>

            {/* Summary row */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              {[
                { label: 'Total', value: filteredParticipants.length, color: '#c4b5fd' },
                { label: 'Attended', value: filteredParticipants.filter(p => p.attended).length, color: '#4ade80' },
                { label: 'Absent', value: filteredParticipants.filter(p => !p.attended).length, color: '#f87171' },
                { label: 'Certs Issued', value: filteredParticipants.filter(p => p.certificateIssued).length, color: '#fbbf24' },
              ].map(s => (
                <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${s.color}33`, borderRadius: 10, padding: '10px 18px', display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</span>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>{s.label}</span>
                </div>
              ))}
            </div>

            {/* Participants Table */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.12)', borderRadius: 16, overflow: 'hidden' }}>
              {/* Table header */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1.2fr', gap: 0, padding: '12px 20px', background: 'rgba(139,92,246,0.08)', borderBottom: '1px solid rgba(139,92,246,0.15)' }}>
                {['Participant', 'Session', 'ID', 'Registered', 'Attendance', 'Certificate'].map(h => (
                  <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#7c86a2', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</div>
                ))}
              </div>

              {filteredParticipants.map((p, i) => {
                const session = sessions.find(s => s.id === p.sessionId)
                return (
                  <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1.2fr', gap: 0, padding: '14px 20px', borderBottom: i < filteredParticipants.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', alignItems: 'center', transition: 'background 0.2s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(139,92,246,0.05)'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}>
                    {/* Name */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{p.name.charAt(0)}</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e2ff' }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: '#4b5563' }}>{p.email}</div>
                        </div>
                      </div>
                    </div>
                    {/* Session */}
                    <div style={{ fontSize: 11, color: '#a78bfa', paddingRight: 8 }}>{session?.title?.slice(0, 28)}…</div>
                    {/* Participant ID */}
                    <div style={{ fontSize: 11, color: '#7c86a2', fontFamily: 'monospace' }}>{p.participantId}</div>
                    {/* Registered */}
                    <div style={{ fontSize: 11, color: '#6b7280' }}>{fmtDate(p.registered)}</div>
                    {/* Attendance */}
                    <div>
                      <span style={{ background: p.attended ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.1)', border: `1px solid ${p.attended ? 'rgba(74,222,128,0.4)' : 'rgba(248,113,113,0.3)'}`, borderRadius: 6, padding: '3px 9px', fontSize: 11, fontWeight: 700, color: p.attended ? '#4ade80' : '#f87171' }}>
                        {p.attended ? '✓ Present' : '✗ Absent'}
                      </span>
                    </div>
                    {/* Certificate toggle */}
                    <div>
                      <button onClick={() => toggleCertificate(p.id)} style={{ background: p.certificateIssued ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${p.certificateIssued ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 7, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', color: p.certificateIssued ? '#fbbf24' : '#6b7280', fontFamily: "'Sora', sans-serif", transition: 'all 0.2s' }}>
                        {p.certificateIssued ? '🏆 Issued' : '+ Issue'}
                      </button>
                    </div>
                  </div>
                )
              })}

              {filteredParticipants.length === 0 && (
                <div style={{ textAlign: 'center', padding: '48px 20px', color: '#4b5563' }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>👥</div>
                  <div style={{ fontSize: 14 }}>No participants match your filters</div>
                </div>
              )}
            </div>

            {/* Export Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => showToast('Export feature coming soon!')} style={{ padding: '10px 22px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.3)', color: '#22d3ee', fontFamily: "'Sora', sans-serif", display: 'flex', alignItems: 'center', gap: 8 }}>
                📥 Export CSV
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes slideInRight { from { opacity:0; transform:translateX(20px) } to { opacity:1; transform:translateX(0) } }
        @keyframes livePulse { 0%,100% { opacity:1; transform:scale(1) } 50% { opacity:0.4; transform:scale(1.4) } }
        select option { background: #1a1a3e; color: #e2e2ff; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.7); cursor: pointer; }
        textarea { resize: vertical; }
      `}</style>
    </div>
  )
}
