// ── SCHEDULE PAGE — SessionFlow (mock-ready, connects to API when available)
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// ── Types ────────────────────────────────────────────────────────────────────
type SessionMode   = 'offline' | 'online' | 'hybrid'
type SessionStatus = 'live' | 'upcoming' | 'completed'
type StatusFilter  = 'all' | SessionStatus
type ModeFilter    = 'all' | SessionMode

interface Speaker {
  name: string
  role: string
  avatar?: string
}

interface Session {
  id: string
  title: string
  date: string
  time: string
  end_time?: string
  venue: string
  mode: SessionMode
  status?: SessionStatus
  speaker: Speaker | string
  capacity: number
  registered: number
  description: string
  tags?: string[]
  join_link?: string
}

// ── Mock Data (used when API is unavailable) ─────────────────────────────────
const MOCK_SESSIONS: Session[] = [
  {
    id: 's1',
    title: 'Introduction to Social Impact Measurement',
    date: new Date().toISOString().split('T')[0],
    time: '10:00 AM', end_time: '11:30 AM',
    venue: 'Renovation Hall A, Mumbai',
    mode: 'hybrid', status: 'live',
    speaker: { name: 'Dr. Priya Sharma', role: 'Impact Researcher', avatar: '👩‍🔬' },
    capacity: 100, registered: 74,
    description: 'Learn how NGOs measure and communicate their social impact effectively using modern frameworks.',
    tags: ['Impact', 'NGO', 'Beginner'],
    join_link: 'https://zoom.us',
  },
  {
    id: 's2',
    title: 'Community Fundraising Strategies',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    time: '2:00 PM', end_time: '3:30 PM',
    venue: 'Online (Zoom)',
    mode: 'online', status: 'upcoming',
    speaker: { name: 'Rahul Mehta', role: 'Fundraising Consultant', avatar: '👨‍💼' },
    capacity: 200, registered: 130,
    description: 'Practical strategies for grassroots fundraising campaigns that connect donors to mission.',
    tags: ['Fundraising', 'Strategy'],
  },
  {
    id: 's3',
    title: 'Youth Leadership & Civic Engagement',
    date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    time: '11:00 AM', end_time: '12:30 PM',
    venue: 'Renovation Centre, Pune',
    mode: 'offline', status: 'upcoming',
    speaker: { name: 'Aisha Khan', role: 'Youth Facilitator', avatar: '👩‍🏫' },
    capacity: 60, registered: 58,
    description: 'Empowering young leaders with tools to drive civic participation in their communities.',
    tags: ['Youth', 'Leadership', 'Civic'],
  },
  {
    id: 's4',
    title: 'Digital Tools for NGO Operations',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    time: '3:00 PM', end_time: '4:30 PM',
    venue: 'Online (Google Meet)',
    mode: 'online', status: 'completed',
    speaker: { name: 'Vikram Nair', role: 'Tech for Good Expert', avatar: '👨‍💻' },
    capacity: 150, registered: 142,
    description: 'Hands-on session covering tools like Airtable, Notion, and Google Workspace for NGO teams.',
    tags: ['Tech', 'Operations', 'Tools'],
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
const modeColor = (m: SessionMode): string => {
  if (m === 'online')  return '#22d3ee'
  if (m === 'offline') return '#a78bfa'
  return '#fb923c'
}

const statusColor = (s: SessionStatus): string => {
  if (s === 'live')      return '#4ade80'
  if (s === 'upcoming')  return '#60a5fa'
  return '#6b7280'
}

const formatSpeaker = (speaker: Speaker | string): Speaker => {
  if (typeof speaker === 'string') return { name: speaker, role: 'Speaker', avatar: '👤' }
  return { name: speaker.name || 'Speaker', role: speaker.role || 'Speaker', avatar: speaker.avatar || '👤' }
}

const getSessionDay = (dateStr: string): string => {
  const date     = new Date(dateStr)
  const today    = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (date.toDateString() === today.toDateString())    return 'Today'
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SchedulePage() {
  const navigate = useNavigate()

  const [sessions,    setSessions]    = useState<Session[]>([])
  const [loading,     setLoading]     = useState<boolean>(true)
  const [error,       setError]       = useState<string>('')
  const [filter,      setFilter]      = useState<StatusFilter>('all')
  const [modeFilter,  setModeFilter]  = useState<ModeFilter>('all')
  const [search,      setSearch]      = useState<string>('')
  const [selected,    setSelected]    = useState<Session | null>(null)

  useEffect(() => {
    const loadSessions = async (): Promise<void> => {
      try {
        setError('')
        // Try real API first — falls back to mock if it fails or isn't running
        const res = await fetch('/api/schedule/sessions', { signal: AbortSignal.timeout(3000) })
        if (!res.ok) throw new Error('API error')
        const data = await res.json()
        setSessions(data.sessions || data)
      } catch {
        // Backend not running — use mock data silently
        setSessions(MOCK_SESSIONS)
      } finally {
        setLoading(false)
      }
    }
    loadSessions()
  }, [])

  const getStatus = (s: Session): SessionStatus => {
    if (s.status) return s.status
    const sessionDate = new Date(s.date + 'T' + s.time)
    const now = new Date()
    if (sessionDate < now) return 'completed'
    if (sessionDate.getTime() < now.getTime() + 2 * 60 * 60 * 1000) return 'live'
    return 'upcoming'
  }

  const filtered = sessions.filter(s => {
    const status  = getStatus(s)
    const speaker = formatSpeaker(s.speaker)
    const matchStatus = filter === 'all' || status === filter
    const matchMode   = modeFilter === 'all' || s.mode === modeFilter
    const matchSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      speaker.name.toLowerCase().includes(search.toLowerCase()) ||
      s.tags?.some(t => t.toLowerCase().includes(search.toLowerCase())) ||
      s.venue.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchMode && matchSearch
  })

  const liveCount  = sessions.filter(s => getStatus(s) === 'live').length
  const spotsLeft  = (s: Session): number => s.capacity - s.registered
  const fillPct    = (s: Session): number => Math.min(100, (s.registered / s.capacity) * 100)

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0d0d1a', color: '#e2e2ff', fontFamily: "'Sora', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16, animation: 'spin 2s linear infinite', display: 'inline-block' }}>⏳</div>
        <p style={{ fontSize: 16, color: '#94a3b8' }}>Loading sessions…</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d1a', color: '#e2e2ff', fontFamily: "'Sora', sans-serif", paddingBottom: 80 }}>

      {/* ── Back button ── */}
      <button onClick={() => navigate('/')} style={{ position: 'fixed', top: 20, left: 20, background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)', color: '#a78bfa', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', zIndex: 10, fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
        ← Back
      </button>

      {/* ── Header ── */}
      <div style={{ background: 'linear-gradient(135deg, #1a1a3e 0%, #0d0d1a 100%)', borderBottom: '1px solid rgba(139,92,246,0.2)', padding: '48px 24px 36px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)', width: 400, height: 200, background: 'radial-gradient(circle, rgba(139,92,246,0.15), transparent 70%)', pointerEvents: 'none' }} />

        {liveCount > 0 && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 20, padding: '6px 16px', marginBottom: 20, fontSize: 13, color: '#4ade80' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', display: 'inline-block', boxShadow: '0 0 8px #4ade80', animation: 'pulse 2s infinite' }} />
            {liveCount} Session{liveCount > 1 ? 's' : ''} Live Right Now
          </div>
        )}

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 20, padding: '6px 18px', marginBottom: 20, fontSize: 13, color: '#a78bfa' }}>
          <span>🗓️</span> Schedule
        </div>

        <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 800, margin: '0 0 12px', background: 'linear-gradient(135deg, #fff 0%, #c4b5fd 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Session Schedule
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 16, margin: '0 auto', maxWidth: 500 }}>
          Browse upcoming and live sessions. Click any session to view details and register.
        </p>
      </div>

      <div style={{ maxWidth: 1100, margin: '32px auto 0', padding: '0 24px' }}>

        {/* ── Error banner ── */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '14px 18px', marginBottom: 24, color: '#fca5a5', display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
            <span>⚠️</span> {error}
          </div>
        )}

        {/* ── Filters ── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
          {/* Search */}
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: '#6b7280' }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sessions, speakers, venue…"
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 12, padding: '12px 14px 12px 42px', color: '#e2e2ff', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
          </div>

          {/* Status filter */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(['all', 'live', 'upcoming', 'completed'] as StatusFilter[]).map(f => {
              const col = f === 'live' ? '#4ade80' : f === 'upcoming' ? '#60a5fa' : f === 'completed' ? '#6b7280' : '#8b5cf6'
              return (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
                  border:      filter === f ? `1px solid ${col}` : '1px solid rgba(255,255,255,0.1)',
                  background:  filter === f ? `${col}22` : 'rgba(255,255,255,0.04)',
                  color:       filter === f ? col : '#94a3b8',
                }}>
                  {f === 'all' ? 'All' : f === 'live' ? '🔴 Live' : f === 'upcoming' ? '🔵 Upcoming' : '✓ Completed'}
                </button>
              )
            })}
          </div>

          {/* Mode filter */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(['all', 'online', 'offline', 'hybrid'] as ModeFilter[]).map(f => (
              <button key={f} onClick={() => setModeFilter(f)} style={{
                padding: '10px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit', textTransform: 'capitalize',
                border:     modeFilter === f ? '1px solid rgba(139,92,246,0.6)' : '1px solid rgba(255,255,255,0.08)',
                background: modeFilter === f ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.03)',
                color:      modeFilter === f ? '#c4b5fd' : '#6b7280',
              }}>
                {f === 'all' ? 'All Modes' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* ── Session Cards ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map(session => {
            const status  = getStatus(session)
            const day     = getSessionDay(session.date)
            const speaker = formatSpeaker(session.speaker)
            const sc      = statusColor(status)
            return (
              <div key={session.id}
                onClick={() => setSelected(session)}
                style={{
                  background: status === 'live' ? 'rgba(74,222,128,0.04)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${status === 'live' ? 'rgba(74,222,128,0.3)' : 'rgba(139,92,246,0.14)'}`,
                  borderRadius: 18, padding: '24px', cursor: 'pointer', transition: 'all 0.22s', position: 'relative', overflow: 'hidden',
                }}
                onMouseEnter={e => { const d = e.currentTarget; d.style.border = `1px solid ${status === 'live' ? 'rgba(74,222,128,0.6)' : 'rgba(139,92,246,0.45)'}` ; d.style.background = 'rgba(255,255,255,0.06)' }}
                onMouseLeave={e => { const d = e.currentTarget; d.style.border = `1px solid ${status === 'live' ? 'rgba(74,222,128,0.3)' : 'rgba(139,92,246,0.14)'}` ; d.style.background = status === 'live' ? 'rgba(74,222,128,0.04)' : 'rgba(255,255,255,0.03)' }}
              >
                {/* Live top bar */}
                {status === 'live' && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #4ade80, transparent)' }} />}

                <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  {/* Time column */}
                  <div style={{ minWidth: 90, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{day}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#c4b5fd' }}>{session.time}</div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>→ {session.end_time || 'TBD'}</div>
                  </div>

                  <div style={{ width: 1, alignSelf: 'stretch', background: 'rgba(255,255,255,0.07)', minHeight: 60 }} />

                  {/* Main info */}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ background: `${sc}22`, border: `1px solid ${sc}55`, borderRadius: 8, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: sc, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 5 }}>
                        {status === 'live' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block', animation: 'pulse 1.2s infinite' }} />}
                        {status.toUpperCase()}
                      </span>
                      <span style={{ background: `${modeColor(session.mode)}18`, border: `1px solid ${modeColor(session.mode)}44`, borderRadius: 8, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: modeColor(session.mode), textTransform: 'uppercase' }}>
                        {session.mode}
                      </span>
                      {session.tags?.map(t => (
                        <span key={t} style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 6, padding: '2px 8px', fontSize: 11, color: '#a78bfa' }}>{t}</span>
                      ))}
                    </div>
                    <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 8px', color: '#e2e2ff', lineHeight: 1.3 }}>{session.title}</h3>
                    <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 12px', lineHeight: 1.6 }}>{session.description}</p>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: '#7c86a2' }}>
                      <span>{speaker.avatar} {speaker.name} · {speaker.role}</span>
                      <span>📍 {session.venue}</span>
                    </div>
                  </div>

                  {/* Right: capacity + CTA */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 140, alignItems: 'flex-end' }}>
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: spotsLeft(session) <= 5 ? '#f87171' : '#6b7280', marginBottom: 4 }}>
                        <span>{session.registered}/{session.capacity}</span>
                        <span>{spotsLeft(session) <= 5 ? `⚠️ ${spotsLeft(session)} left` : `${spotsLeft(session)} spots`}</span>
                      </div>
                      <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 10 }}>
                        <div style={{ height: '100%', borderRadius: 10, width: `${fillPct(session)}%`, background: fillPct(session) > 90 ? '#f87171' : '#8b5cf6', transition: 'width 0.6s' }} />
                      </div>
                    </div>

                    {status === 'live' && session.join_link && (
                      <a href={session.join_link} target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: 'linear-gradient(135deg, #4ade80, #22d3ee)', color: '#000', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                        Join Now →
                      </a>
                    )}
                    {status === 'upcoming' && (
                      <button onClick={e => { e.stopPropagation(); navigate('/register') }} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', border: 'none', color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
                        Register →
                      </button>
                    )}
                    {status === 'completed' && (
                      <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>✓ Completed</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#6b7280' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <p style={{ fontSize: 16 }}>No sessions match your filters.</p>
          </div>
        )}
      </div>

      {/* ── Detail Modal ── */}
      {selected && (() => {
        const status  = getStatus(selected)
        const day     = getSessionDay(selected.date)
        const speaker = formatSpeaker(selected.speaker)
        const sc      = statusColor(status)
        return (
          <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'fadeIn 0.2s ease' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#13102a', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 24, padding: '36px', maxWidth: 560, width: '100%', position: 'relative', maxHeight: '90vh', overflowY: 'auto', animation: 'slideUp 0.25s cubic-bezier(0.34,1.2,0.64,1)' }}>

              <button onClick={() => setSelected(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: '#94a3b8', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>

              {/* Top accent bar */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${sc}, #8b5cf6)`, borderRadius: '24px 24px 0 0' }} />

              {status === 'live' && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 20, padding: '4px 14px', marginBottom: 16, fontSize: 12, color: '#4ade80', fontWeight: 700 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', display: 'inline-block', animation: 'pulse 1.2s infinite' }} /> LIVE NOW
                </div>
              )}

              <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px', color: '#e2e2ff', lineHeight: 1.3 }}>{selected.title}</h2>
              <p style={{ fontSize: 14, color: '#94a3b8', margin: '0 0 24px', lineHeight: 1.7 }}>{selected.description}</p>

              {/* Speaker card */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 14, padding: '14px 18px', marginBottom: 20 }}>
                <div style={{ fontSize: 36 }}>{speaker.avatar}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#e2e2ff' }}>{speaker.name}</div>
                  <div style={{ fontSize: 13, color: '#7c86a2' }}>{speaker.role}</div>
                </div>
              </div>

              {/* Details grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                {([
                  ['📅 Date',       day],
                  ['🕐 Time',       `${selected.time} – ${selected.end_time || 'TBD'}`],
                  ['📍 Venue',      selected.venue],
                  ['🌐 Mode',       selected.mode.charAt(0).toUpperCase() + selected.mode.slice(1)],
                  ['💺 Registered', `${selected.registered} / ${selected.capacity}`],
                  ['🎯 Spots Left', `${spotsLeft(selected)} remaining`],
                ] as [string, string][]).map(([label, value]) => (
                  <div key={label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e2ff' }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Tags */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
                {selected.tags?.map(t => (
                  <span key={t} style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 8, padding: '4px 12px', fontSize: 12, color: '#a78bfa' }}>{t}</span>
                ))}
              </div>

              {/* CTAs */}
              <div style={{ display: 'flex', gap: 10 }}>
                {status === 'live' && selected.join_link && (
                  <a href={selected.join_link} target="_blank" rel="noopener noreferrer"
                    style={{ flex: 1, padding: '13px', borderRadius: 12, fontWeight: 700, fontSize: 14, background: 'linear-gradient(135deg, #4ade80, #22d3ee)', color: '#000', textDecoration: 'none', textAlign: 'center' }}>
                    Join Live Session →
                  </a>
                )}
                {status !== 'completed' && (
                  <button onClick={() => { setSelected(null); navigate('/register') }}
                    style={{ flex: 1, padding: '13px', borderRadius: 12, fontWeight: 700, fontSize: 14, background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', border: 'none', color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Register Now →
                  </button>
                )}
                {status === 'completed' && (
                  <button style={{ flex: 1, padding: '13px', borderRadius: 12, fontWeight: 700, fontSize: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#6b7280', cursor: 'not-allowed', fontFamily: 'inherit' }}>
                    Session Completed
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      <style>{`
        @keyframes pulse   { 0%, 100% { opacity: 1 } 50% { opacity: 0.35 } }
        @keyframes spin    { to { transform: rotate(360deg) } }
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(28px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
    </div>
  )
}
