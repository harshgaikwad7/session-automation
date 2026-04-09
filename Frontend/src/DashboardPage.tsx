'use client'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// ── TYPES ──────────────────────────────────────────────────────────────────

interface RegisteredSession {
  id: string
  title: string
  date: string
  time: string
  venue: string
  mode: 'offline' | 'online' | 'hybrid'
  speaker: string
  status: 'upcoming' | 'attended' | 'missed'
  participantId: string
  hasCertificate: boolean
  hasQuiz: boolean
  quizScore?: number
  tags: string[]
}

interface Certificate {
  id: string
  sessionTitle: string
  issuedOn: string
  participantId: string
  verifyCode: string
}

interface Reminder {
  id: string
  sessionTitle: string
  date: string
  time: string
  minutesBefore: number
}

const getLiveUser = () => {
  const base = {
    name: 'Arjun Desai',
    email: 'arjun.desai@gmail.com',
    phone: '+91 98765 43210',
    joinedOn: '2026-01-15',
    role: 'participant',
    totalSessions: 5,
    attendedSessions: 3,
    certificates: 2,
    quizzesTaken: 3,
  };
  
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('user') || localStorage.getItem('sf_user');
      if (raw) {
        const u = JSON.parse(raw);
        if (u.name) base.name = u.name;
        if (u.email) base.email = u.email;
        if (u.phone) base.phone = u.phone;
        if (u.joinedOn) base.joinedOn = u.joinedOn.slice(0, 10);
        if (u.role) base.role = u.role;
      }
    } catch {}
  }
  return base;
};

const MOCK_SESSIONS: RegisteredSession[] = [
  {
    id: 's1',
    title: 'Introduction to Social Impact Measurement',
    date: '2026-04-10',
    time: '10:00 AM',
    venue: 'Renovation Hall A, Mumbai',
    mode: 'hybrid',
    speaker: 'Dr. Priya Sharma',
    status: 'upcoming',
    participantId: 'RF-A7X2KP',
    hasCertificate: false,
    hasQuiz: false,
    tags: ['Impact', 'NGO', 'Beginner'],
  },
  {
    id: 's2',
    title: 'Community Fundraising Strategies',
    date: '2026-03-22',
    time: '2:00 PM',
    venue: 'Online (Zoom)',
    mode: 'online',
    speaker: 'Rahul Mehta',
    status: 'attended',
    participantId: 'RF-B3M9QT',
    hasCertificate: true,
    hasQuiz: true,
    quizScore: 88,
    tags: ['Fundraising', 'Strategy'],
  },
  {
    id: 's3',
    title: 'Youth Leadership & Civic Engagement',
    date: '2026-03-10',
    time: '11:00 AM',
    venue: 'Renovation Centre, Pune',
    mode: 'offline',
    speaker: 'Aisha Khan',
    status: 'attended',
    participantId: 'RF-C6W1NR',
    hasCertificate: true,
    hasQuiz: true,
    quizScore: 92,
    tags: ['Youth', 'Leadership', 'Civic'],
  },
  {
    id: 's4',
    title: 'Digital Tools for NGO Outreach',
    date: '2026-02-28',
    time: '3:00 PM',
    venue: 'Online (Google Meet)',
    mode: 'online',
    speaker: 'Neha Joshi',
    status: 'missed',
    participantId: 'RF-D2F5LK',
    hasCertificate: false,
    hasQuiz: false,
    tags: ['Digital', 'Outreach'],
  },
  {
    id: 's5',
    title: 'Grant Writing Masterclass',
    date: '2026-04-18',
    time: '11:00 AM',
    venue: 'Renovation Centre, Pune',
    mode: 'offline',
    speaker: 'Vikram Rao',
    status: 'upcoming',
    participantId: 'RF-E9H7YZ',
    hasCertificate: false,
    hasQuiz: false,
    tags: ['Grants', 'Writing'],
  },
]

const MOCK_CERTIFICATES: Certificate[] = [
  {
    id: 'cert1',
    sessionTitle: 'Community Fundraising Strategies',
    issuedOn: '2026-03-23',
    participantId: 'RF-B3M9QT',
    verifyCode: 'VRF-2026-B3M9',
  },
  {
    id: 'cert2',
    sessionTitle: 'Youth Leadership & Civic Engagement',
    issuedOn: '2026-03-11',
    participantId: 'RF-C6W1NR',
    verifyCode: 'VRF-2026-C6W1',
  },
]

const MOCK_REMINDERS: Reminder[] = [
  { id: 'r1', sessionTitle: 'Introduction to Social Impact Measurement', date: '2026-04-10', time: '10:00 AM', minutesBefore: 60 },
  { id: 'r2', sessionTitle: 'Grant Writing Masterclass', date: '2026-04-18', time: '11:00 AM', minutesBefore: 30 },
]

// ── HELPERS ────────────────────────────────────────────────────────────────

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })

const modeColor = (m: string) => {
  if (m === 'online') return '#22d3ee'
  if (m === 'offline') return '#a78bfa'
  return '#fb923c'
}

const statusConfig = {
  upcoming: { color: '#38bdf8', bg: 'rgba(56,189,248,0.12)', border: 'rgba(56,189,248,0.3)', label: '⏳ Upcoming' },
  attended: { color: '#4ade80', bg: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.3)', label: '✅ Attended' },
  missed:   { color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)', label: '❌ Missed' },
}

// ── STYLE CONSTANTS ────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(139,92,246,0.15)',
  borderRadius: 16,
  padding: '22px',
}

const sectionTitle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: '#e2e2ff',
  marginBottom: 18,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
}

const tabBtn = (active: boolean): React.CSSProperties => ({
  padding: '10px 20px',
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  border: active ? '1px solid #8b5cf6' : '1px solid rgba(255,255,255,0.1)',
  background: active ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.04)',
  color: active ? '#c4b5fd' : '#94a3b8',
  transition: 'all 0.2s',
  whiteSpace: 'nowrap' as const,
})

function DashboardPageLayout({
  activeTab,
  setActiveTab,
  navigate,
  children,
}: {
  activeTab: 'overview' | 'sessions' | 'certificates' | 'reminders'
  setActiveTab: React.Dispatch<React.SetStateAction<'overview' | 'sessions' | 'certificates' | 'reminders'>>
  navigate: (path: string) => void
  children: React.ReactNode
}) {
  const liveUser = getLiveUser();

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d1a', color: '#e2e2ff', fontFamily: "'Sora', sans-serif", paddingBottom: 80 }}>
      <button onClick={() => navigate('/')} style={{ position: 'absolute', top: 20, left: 20, background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)', color: '#a78bfa', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', zIndex: 10 }}>← Back to Home</button>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a1a3e 0%, #12122b 100%)', borderBottom: '1px solid rgba(139,92,246,0.2)', padding: '36px 24px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* Profile row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 28, flexWrap: 'wrap' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, flexShrink: 0 }}>
              {liveUser.name.charAt(0)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 'clamp(18px, 3vw, 24px)', fontWeight: 800, color: '#e2e2ff' }}>{liveUser.name}</div>
              <div style={{ fontSize: 13, color: '#7c86a2', marginTop: 2 }}>{liveUser.email} · Joined {formatDate(liveUser.joinedOn)}</div>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 20, padding: '6px 16px', fontSize: 12, color: '#a78bfa', flexShrink: 0 }}>
              🎓 {liveUser.role.charAt(0).toUpperCase() + liveUser.role.slice(1)}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 0 }}>
            {([
              { key: 'overview',      icon: '🏠', label: 'Overview' },
              { key: 'sessions',      icon: '📅', label: 'My Sessions' },
              { key: 'certificates',  icon: '🏅', label: 'Certificates' },
              { key: 'reminders',     icon: '🔔', label: 'Reminders' },
            ] as const).map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                style={{
                  padding: '12px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  background: 'none', border: 'none', borderBottom: activeTab === t.key ? '2px solid #8b5cf6' : '2px solid transparent',
                  color: activeTab === t.key ? '#c4b5fd' : '#7c86a2', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
                }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: '32px auto 0', padding: '0 24px' }}>
        {children}
      </div>
    </div>
  )
}

// ── COMPONENT ──────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'certificates' | 'reminders'>('overview')
  const [sessionFilter, setSessionFilter] = useState<'all' | 'upcoming' | 'attended' | 'missed'>('all')
  const [reminderMinutes, setReminderMinutes] = useState<Record<string, number>>({
    r1: 60,
    r2: 30,
  })

  const filteredSessions = MOCK_SESSIONS.filter(s =>
    sessionFilter === 'all' || s.status === sessionFilter
  )

  const upcoming = MOCK_SESSIONS.filter(s => s.status === 'upcoming')
  const attended = MOCK_SESSIONS.filter(s => s.status === 'attended')

  const liveUser = getLiveUser();

  // ── OVERVIEW TAB ────────────────────────────────────────────
  if (activeTab === 'overview') return (
    <DashboardPageLayout activeTab={activeTab} setActiveTab={setActiveTab} navigate={navigate}>
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { icon: '📅', label: 'Sessions Registered', value: liveUser.totalSessions, color: '#38bdf8' },
          { icon: '✅', label: 'Sessions Attended',   value: liveUser.attendedSessions, color: '#4ade80' },
          { icon: '🏅', label: 'Certificates Earned', value: liveUser.certificates, color: '#a78bfa' },
          { icon: '🧠', label: 'Quizzes Taken',       value: liveUser.quizzesTaken, color: '#fb923c' },
        ].map(stat => (
          <div key={stat.label} style={{ ...card, textAlign: 'center', padding: '24px 16px' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{stat.icon}</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: '#7c86a2', marginTop: 6, lineHeight: 1.4 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>

        {/* Upcoming sessions */}
        <div style={card}>
          <div style={sectionTitle}>⏳ Upcoming Sessions</div>
          {upcoming.length === 0 && <p style={{ color: '#6b7280', fontSize: 13 }}>No upcoming sessions.</p>}
          {upcoming.map(s => (
            <div key={s.id} style={{ padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e2ff', marginBottom: 4 }}>{s.title}</div>
              <div style={{ fontSize: 12, color: '#7c86a2' }}>📅 {formatDate(s.date)} · 🕐 {s.time}</div>
              <div style={{ fontSize: 12, color: '#7c86a2', marginTop: 2 }}>📍 {s.venue}</div>
              <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#a78bfa', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 6, padding: '2px 8px' }}>{s.participantId}</span>
                <span style={{ fontSize: 11, color: modeColor(s.mode), background: `${modeColor(s.mode)}22`, borderRadius: 6, padding: '2px 8px', textTransform: 'capitalize' }}>{s.mode}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Certificates */}
        <div style={card}>
          <div style={sectionTitle}>🏅 Recent Certificates</div>
          {MOCK_CERTIFICATES.length === 0 && <p style={{ color: '#6b7280', fontSize: 13 }}>No certificates yet.</p>}
          {MOCK_CERTIFICATES.map(cert => (
            <div key={cert.id} style={{ padding: '14px', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e2ff', marginBottom: 6 }}>{cert.sessionTitle}</div>
              <div style={{ fontSize: 12, color: '#7c86a2', marginBottom: 8 }}>Issued {formatDate(cert.issuedOn)}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#4ade80', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 6, padding: '2px 8px' }}>{cert.verifyCode}</span>
                <button 
                  onClick={() => window.open(`/certificate-preview.html?user=${encodeURIComponent(liveUser.name)}&session=${encodeURIComponent(cert.sessionTitle)}&code=${cert.verifyCode}`, '_blank')}
                  style={{ fontSize: 11, color: '#a78bfa', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 6, padding: '2px 10px', cursor: 'pointer' }}>
                  ⬇ Download
                </button>
              </div>
            </div>
          ))}
          <button onClick={() => setActiveTab('certificates')} style={{ marginTop: 4, fontSize: 13, color: '#a78bfa', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            View all certificates →
          </button>
        </div>

        {/* Quiz scores */}
        <div style={card}>
          <div style={sectionTitle}>🧠 Quiz Performance</div>
          {attended.filter(s => s.hasQuiz).map(s => (
            <div key={s.id} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: '#e2e2ff', maxWidth: '75%', lineHeight: 1.4 }}>{s.title}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: (s.quizScore ?? 0) >= 80 ? '#4ade80' : '#fb923c' }}>{s.quizScore}%</span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 10 }}>
                <div style={{ height: '100%', borderRadius: 10, width: `${s.quizScore}%`, background: (s.quizScore ?? 0) >= 80 ? 'linear-gradient(90deg, #4ade80, #22d3ee)' : 'linear-gradient(90deg, #fb923c, #f87171)', transition: 'width 0.6s ease' }} />
              </div>
            </div>
          ))}
          {attended.filter(s => s.hasQuiz).length === 0 && (
            <p style={{ color: '#6b7280', fontSize: 13 }}>No quizzes taken yet.</p>
          )}
        </div>

        {/* Reminders */}
        <div style={card}>
          <div style={sectionTitle}>🔔 Active Reminders</div>
          {MOCK_REMINDERS.map(r => (
            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e2ff', marginBottom: 2 }}>{r.sessionTitle}</div>
                <div style={{ fontSize: 11, color: '#7c86a2' }}>{formatDate(r.date)} · {r.time}</div>
              </div>
              <span style={{ fontSize: 11, color: '#fb923c', background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.2)', borderRadius: 6, padding: '3px 10px', flexShrink: 0 }}>
                🔔 {r.minutesBefore}m before
              </span>
            </div>
          ))}
          <button onClick={() => setActiveTab('reminders')} style={{ marginTop: 12, fontSize: 13, color: '#a78bfa', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            Manage reminders →
          </button>
        </div>
      </div>
    </DashboardPageLayout>
  )

  // ── SESSIONS TAB ────────────────────────────────────────────
  if (activeTab === 'sessions') return (
    <DashboardPageLayout activeTab={activeTab} setActiveTab={setActiveTab} navigate={navigate}>
      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {(['all', 'upcoming', 'attended', 'missed'] as const).map(f => (
          <button key={f} onClick={() => setSessionFilter(f)} style={tabBtn(sessionFilter === f)}>
            {f === 'all' ? 'All Sessions' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
        {filteredSessions.map(s => {
          const sc = statusConfig[s.status]
          return (
            <div key={s.id} style={{ ...card, position: 'relative', overflow: 'hidden' }}>
              {/* top accent bar */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: sc.color, opacity: 0.6, borderRadius: '16px 16px 0 0' }} />

              <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', marginTop: 6 }}>
                <span style={{ background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 8, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: sc.color }}>
                  {sc.label}
                </span>
                <span style={{ background: `${modeColor(s.mode)}22`, border: `1px solid ${modeColor(s.mode)}55`, borderRadius: 8, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: modeColor(s.mode), textTransform: 'uppercase' }}>
                  {s.mode}
                </span>
              </div>

              <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px', color: '#e2e2ff', lineHeight: 1.4 }}>{s.title}</h3>
              <p style={{ fontSize: 13, color: '#7c86a2', margin: '0 0 4px' }}>👤 {s.speaker}</p>
              <p style={{ fontSize: 13, color: '#7c86a2', margin: '0 0 4px' }}>📅 {formatDate(s.date)} · {s.time}</p>
              <p style={{ fontSize: 13, color: '#7c86a2', margin: '0 0 16px' }}>📍 {s.venue}</p>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                {s.tags.map(t => (
                  <span key={t} style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 6, padding: '2px 8px', fontSize: 11, color: '#a78bfa' }}>{t}</span>
                ))}
              </div>

              {/* Participant ID */}
              <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#7c86a2' }}>Participant ID</span>
                <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#a78bfa' }}>{s.participantId}</span>
              </div>

              {/* Quiz score badge */}
              {s.hasQuiz && s.quizScore !== undefined && (
                <div style={{ background: (s.quizScore >= 80 ? 'rgba(74,222,128,0.1)' : 'rgba(251,146,60,0.1)'), border: `1px solid ${s.quizScore >= 80 ? 'rgba(74,222,128,0.3)' : 'rgba(251,146,60,0.3)'}`, borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#7c86a2' }}>🧠 Quiz Score</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: s.quizScore >= 80 ? '#4ade80' : '#fb923c' }}>{s.quizScore}%</span>
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {s.hasCertificate && (
                  <button 
                    onClick={() => window.open(`/certificate-preview.html?user=${encodeURIComponent(liveUser.name)}&session=${encodeURIComponent(s.title)}`, '_blank')}
                    style={{ flex: 1, minWidth: 120, padding: '10px 12px', borderRadius: 10, fontWeight: 600, fontSize: 12, cursor: 'pointer', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', border: 'none', color: '#fff' }}>
                    ⬇ Certificate
                  </button>
                )}
                {s.hasQuiz && !s.quizScore && (
                  <button style={{ flex: 1, minWidth: 120, padding: '10px 12px', borderRadius: 10, fontWeight: 600, fontSize: 12, cursor: 'pointer', background: 'rgba(251,146,60,0.15)', border: '1px solid rgba(251,146,60,0.3)', color: '#fb923c' }}>
                    🧠 Take Quiz
                  </button>
                )}
                {s.status === 'upcoming' && (
                  <button style={{ flex: 1, minWidth: 120, padding: '10px 12px', borderRadius: 10, fontWeight: 600, fontSize: 12, cursor: 'pointer', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.25)', color: '#38bdf8' }}>
                    📲 Check In
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {filteredSessions.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#6b7280' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
          <p style={{ fontSize: 16 }}>No sessions in this category.</p>
        </div>
      )}
    </DashboardPageLayout>
  )

  // ── CERTIFICATES TAB ────────────────────────────────────────
  if (activeTab === 'certificates') return (
    <DashboardPageLayout activeTab={activeTab} setActiveTab={setActiveTab} navigate={navigate}>
      {MOCK_CERTIFICATES.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#6b7280' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏅</div>
          <p style={{ fontSize: 16 }}>No certificates yet. Attend a session to earn one!</p>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
        {MOCK_CERTIFICATES.map(cert => (
          <div key={cert.id} style={{ ...card, position: 'relative', overflow: 'hidden' }}>
            {/* rainbow top bar */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #4ade80, #22d3ee, #8b5cf6)', borderRadius: '16px 16px 0 0' }} />

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginTop: 8, marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                🏅
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e2ff', lineHeight: 1.4, marginBottom: 4 }}>{cert.sessionTitle}</div>
                <div style={{ fontSize: 12, color: '#7c86a2' }}>Issued on {formatDate(cert.issuedOn)}</div>
              </div>
            </div>

            <div style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: '#6b7280' }}>Participant ID</span>
                <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#a78bfa', fontWeight: 700 }}>{cert.participantId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: '#6b7280' }}>Verify Code</span>
                <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#4ade80', fontWeight: 700 }}>{cert.verifyCode}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button 
                onClick={() => window.open(`/certificate-preview.html?user=${encodeURIComponent(liveUser.name)}&session=${encodeURIComponent(cert.sessionTitle)}&code=${cert.verifyCode}`, '_blank')}
                style={{ flex: 1, padding: '11px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', border: 'none', color: '#fff' }}>
                ⬇ Download PDF
              </button>
              <button style={{ padding: '11px 16px', borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)', color: '#4ade80' }}>
                🔍 Verify
              </button>
            </div>
          </div>
        ))}
      </div>
    </DashboardPageLayout>
  )

  // ── REMINDERS TAB ───────────────────────────────────────────
  if (activeTab === 'reminders') return (
    <DashboardPageLayout activeTab={activeTab} setActiveTab={setActiveTab} navigate={navigate}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 18 }}>
        {MOCK_REMINDERS.map(r => (
          <div key={r.id} style={card}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 18 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(251,146,60,0.12)', border: '1px solid rgba(251,146,60,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                🔔
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e2ff', lineHeight: 1.4, marginBottom: 4 }}>{r.sessionTitle}</div>
                <div style={{ fontSize: 12, color: '#7c86a2' }}>📅 {formatDate(r.date)} · 🕐 {r.time}</div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13 }}>
                <span style={{ color: '#7c86a2' }}>Notify me before</span>
                <span style={{ color: '#fb923c', fontWeight: 700 }}>{reminderMinutes[r.id]} min</span>
              </div>
              <input type="range" min={5} max={120} step={5}
                value={reminderMinutes[r.id]}
                onChange={e => setReminderMinutes(prev => ({ ...prev, [r.id]: Number(e.target.value) }))}
                style={{ width: '100%', accentColor: '#8b5cf6' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                <span>5 min</span><span>1 hour</span><span>2 hours</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { icon: '📧', label: 'Email', color: '#38bdf8' },
                { icon: '📱', label: 'WhatsApp', color: '#4ade80' },
              ].map(ch => (
                <button key={ch.label} style={{ flex: 1, minWidth: 100, padding: '10px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: `${ch.color}18`, border: `1px solid ${ch.color}40`, color: ch.color }}>
                  {ch.icon} {ch.label}
                </button>
              ))}
              <button style={{ width: '100%', marginTop: 4, padding: '11px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', border: 'none', color: '#fff' }}>
                💾 Save Reminder
              </button>
            </div>
          </div>
        ))}

        {MOCK_REMINDERS.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#6b7280', gridColumn: '1/-1' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔕</div>
            <p style={{ fontSize: 16 }}>No reminders set. Register for a session to set up reminders.</p>
          </div>
        )}
      </div>
    </DashboardPageLayout>
  )

  return null
}
