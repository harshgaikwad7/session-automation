// ── REGISTER PAGE ──────────────────────────────────────────────────────────
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API = 'http://localhost:8000'

interface Session {
  id: string
  title: string
  date: string
  time: string
  venue: string
  mode: 'offline' | 'online' | 'hybrid'
  speaker: string
  capacity: number
  registered: number
  description: string
  tags: string[]
}

const MOCK_SESSIONS: Session[] = [
  {
    id: 's1',
    title: 'Introduction to Social Impact Measurement',
    date: '2026-04-10',
    time: '10:00 AM',
    venue: 'Renovation Hall A, Mumbai',
    mode: 'hybrid',
    speaker: 'Dr. Priya Sharma',
    capacity: 100,
    registered: 74,
    description: 'Learn how NGOs measure and communicate their social impact effectively using modern frameworks.',
    tags: ['Impact', 'NGO', 'Beginner'],
  },
  {
    id: 's2',
    title: 'Community Fundraising Strategies',
    date: '2026-04-14',
    time: '2:00 PM',
    venue: 'Online (Zoom)',
    mode: 'online',
    speaker: 'Rahul Mehta',
    capacity: 200,
    registered: 130,
    description: 'Practical strategies for grassroots fundraising campaigns that connect donors to mission.',
    tags: ['Fundraising', 'Strategy'],
  },
  {
    id: 's3',
    title: 'Youth Leadership & Civic Engagement',
    date: '2026-04-18',
    time: '11:00 AM',
    venue: 'Renovation Centre, Pune',
    mode: 'offline',
    speaker: 'Aisha Khan',
    capacity: 60,
    registered: 58,
    description: 'Empowering young leaders with tools to drive civic participation in their communities.',
    tags: ['Youth', 'Leadership', 'Civic'],
  },
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<Session | null>(null)
  const [step, setStep] = useState<'browse' | 'confirm' | 'success'>('browse')
  const [loading, setLoading] = useState(false)
  const [participantId, setParticipantId] = useState('')
  const [filter, setFilter] = useState<'all' | 'online' | 'offline' | 'hybrid'>('all')
  const [search, setSearch] = useState('')
  const [registeredIds, setRegisteredIds] = useState<string[]>([])

  const sessions = MOCK_SESSIONS

  const filtered = sessions.filter(s => {
    const matchMode = filter === 'all' || s.mode === filter
    const matchSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.speaker.toLowerCase().includes(search.toLowerCase()) ||
      s.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    return matchMode && matchSearch
  })

  const handleRegister = async () => {
    if (!selected) return
    setLoading(true)
    const id = 'RF-' + Math.random().toString(36).substring(2, 8).toUpperCase()

    // Read logged-in user
    let userName = 'Unknown'
    let userEmail = ''
    try {
      const raw = localStorage.getItem('user') || localStorage.getItem('sf_user')
      if (raw) { const u = JSON.parse(raw); userName = u.name || 'Unknown'; userEmail = u.email || '' }
    } catch { /* ignore */ }

    // Try real backend first
    try {
      const res = await fetch(`${API}/api/registration/register-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: selected.id,
          session_title: selected.title,
          participant_id: id,
          name: userName,
          email: userEmail,
        }),
      })
      if (!res.ok) throw new Error('Backend error')
    } catch {
      // Backend offline — store registration locally so Admin page can see it
      try {
        const existing = JSON.parse(localStorage.getItem('sf_registrations') || '[]')
        existing.push({
          id: 'p_' + Date.now(),
          name: userName,
          email: userEmail,
          sessionId: selected.id,
          participantId: id,
          registered: new Date().toISOString().slice(0, 10),
          attended: false,
          certificateIssued: false,
        })
        localStorage.setItem('sf_registrations', JSON.stringify(existing))
      } catch { /* ignore */ }
    }

    await new Promise(r => setTimeout(r, 1000))
    setParticipantId(id)
    setRegisteredIds(prev => [...prev, selected.id])
    setLoading(false)
    setStep('success')
  }

  const modeColor = (m: string) => {
    if (m === 'online') return '#22d3ee'
    if (m === 'offline') return '#a78bfa'
    return '#fb923c'
  }

  const spotsLeft = (s: Session) => s.capacity - s.registered
  const isFull = (s: Session) => spotsLeft(s) <= 0
  const isAlmostFull = (s: Session) => spotsLeft(s) <= 10 && spotsLeft(s) > 0
  const fillPct = (s: Session) => Math.min(100, (s.registered / s.capacity) * 100)

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })

  // ── BROWSE ───────────────────────────────────────────────────
  if (step === 'browse') return (
    <div style={{ minHeight: '100vh', background: '#0d0d1a', color: '#e2e2ff', fontFamily: "'Sora', sans-serif", padding: '0 0 80px' }}>
      <div style={{ background: 'linear-gradient(135deg, #1a1a3e 0%, #12122b 100%)', borderBottom: '1px solid rgba(139,92,246,0.2)', padding: '48px 24px 36px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 20, padding: '6px 18px', marginBottom: 20, fontSize: 13, color: '#a78bfa' }}>
          <span>📋</span> Session Registration
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 800, margin: '0 0 12px', background: 'linear-gradient(135deg, #fff 0%, #c4b5fd 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Register for a Session
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 16, margin: '0 auto', maxWidth: 520 }}>
          Choose a session and secure your spot. Your Participant ID is generated instantly.
        </p>
      </div>

      <div style={{ maxWidth: 1100, margin: '32px auto 0', padding: '0 24px' }}>
        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 28 }}>
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: '#6b7280' }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sessions, speakers, topics..."
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 12, padding: '12px 14px 12px 42px', color: '#e2e2ff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          {(['all', 'online', 'offline', 'hybrid'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              border: filter === f ? '1px solid #8b5cf6' : '1px solid rgba(255,255,255,0.1)',
              background: filter === f ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.04)',
              color: filter === f ? '#c4b5fd' : '#94a3b8', transition: 'all 0.2s', textTransform: 'capitalize',
            }}>
              {f === 'all' ? 'All Modes' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {filtered.map(session => (
            <div key={session.id}
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${registeredIds.includes(session.id) ? 'rgba(34,197,94,0.4)' : 'rgba(139,92,246,0.15)'}`, borderRadius: 16, padding: '22px', transition: 'all 0.25s', position: 'relative', overflow: 'hidden' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(139,92,246,0.5)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.07)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.border = `1px solid ${registeredIds.includes(session.id) ? 'rgba(34,197,94,0.4)' : 'rgba(139,92,246,0.15)'}`; (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)' }}
            >
              {registeredIds.includes(session.id) && (
                <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.4)', borderRadius: 8, padding: '3px 10px', fontSize: 11, color: '#4ade80', fontWeight: 700 }}>✓ Registered</div>
              )}
              <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                <span style={{ background: `${modeColor(session.mode)}22`, border: `1px solid ${modeColor(session.mode)}55`, borderRadius: 8, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: modeColor(session.mode), textTransform: 'uppercase' }}>{session.mode}</span>
                <span style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '3px 10px', fontSize: 11, color: '#94a3b8' }}>📅 {formatDate(session.date)}</span>
                <span style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '3px 10px', fontSize: 11, color: '#94a3b8' }}>🕐 {session.time}</span>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px', color: '#e2e2ff', lineHeight: 1.4 }}>{session.title}</h3>
              <p style={{ fontSize: 13, color: '#7c86a2', margin: '0 0 6px' }}>👤 {session.speaker}</p>
              <p style={{ fontSize: 13, color: '#7c86a2', margin: '0 0 14px' }}>📍 {session.venue}</p>
              <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 16px', lineHeight: 1.6 }}>{session.description}</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                {session.tags.map(t => (
                  <span key={t} style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 6, padding: '2px 8px', fontSize: 11, color: '#a78bfa' }}>{t}</span>
                ))}
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: isFull(session) ? '#f87171' : isAlmostFull(session) ? '#fb923c' : '#94a3b8', marginBottom: 6 }}>
                  <span>{session.registered} / {session.capacity} registered</span>
                  <span>{isFull(session) ? '🔴 Full' : isAlmostFull(session) ? `⚠️ ${spotsLeft(session)} left` : `${spotsLeft(session)} spots`}</span>
                </div>
                <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 10 }}>
                  <div style={{ height: '100%', borderRadius: 10, width: `${fillPct(session)}%`, background: isFull(session) ? '#f87171' : isAlmostFull(session) ? '#fb923c' : '#8b5cf6', transition: 'width 0.6s ease' }} />
                </div>
              </div>
              <button
                disabled={isFull(session) || registeredIds.includes(session.id)}
                onClick={() => { setSelected(session); setStep('confirm') }}
                style={{
                  width: '100%', padding: '12px', borderRadius: 10, fontWeight: 700, fontSize: 14,
                  cursor: isFull(session) || registeredIds.includes(session.id) ? 'not-allowed' : 'pointer',
                  background: registeredIds.includes(session.id) ? 'rgba(34,197,94,0.15)' : isFull(session) ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                  border: registeredIds.includes(session.id) ? '1px solid rgba(34,197,94,0.4)' : isFull(session) ? '1px solid rgba(255,255,255,0.1)' : 'none',
                  color: registeredIds.includes(session.id) ? '#4ade80' : isFull(session) ? '#6b7280' : '#fff',
                }}
              >
                {registeredIds.includes(session.id) ? '✓ Already Registered' : isFull(session) ? 'Session Full' : 'Register Now →'}
              </button>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#6b7280' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔎</div>
            <p style={{ fontSize: 16 }}>No sessions match your search.</p>
          </div>
        )}
      </div>
    </div>
  )

  // ── CONFIRM ──────────────────────────────────────────────────
  if (step === 'confirm' && selected) return (
    <div style={{ minHeight: '100vh', background: '#0d0d1a', color: '#e2e2ff', fontFamily: "'Sora', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 20, padding: '40px', maxWidth: 520, width: '100%' }}>
        <button onClick={() => setStep('browse')} style={{ background: 'none', border: 'none', color: '#7c86a2', cursor: 'pointer', fontSize: 14, marginBottom: 24, padding: 0 }}>← Back</button>
        <div style={{ fontSize: 40, marginBottom: 12, textAlign: 'center' }}>📋</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, textAlign: 'center', marginBottom: 6 }}>Confirm Registration</h2>
        <p style={{ color: '#7c86a2', textAlign: 'center', marginBottom: 28, fontSize: 14 }}>Review details before confirming your spot</p>
        <div style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 14, padding: '20px', marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 17, color: '#c4b5fd' }}>{selected.title}</h3>
          {[
            ['👤 Speaker', selected.speaker],
            ['📅 Date', formatDate(selected.date)],
            ['🕐 Time', selected.time],
            ['📍 Venue', selected.venue],
            ['🌐 Mode', selected.mode.charAt(0).toUpperCase() + selected.mode.slice(1)],
            ['💺 Spots Left', `${spotsLeft(selected)} remaining`],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 13 }}>
              <span style={{ color: '#7c86a2' }}>{label}</span>
              <span style={{ color: '#e2e2ff', fontWeight: 600, textAlign: 'right', maxWidth: 260 }}>{value}</span>
            </div>
          ))}
        </div>
        <button onClick={handleRegister} disabled={loading} style={{
          width: '100%', padding: '14px', borderRadius: 12, fontWeight: 700, fontSize: 15,
          cursor: loading ? 'not-allowed' : 'pointer',
          background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', border: 'none', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          {loading ? (
            <>
              <span style={{ display: 'inline-block', width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              Confirming...
            </>
          ) : 'Confirm Registration →'}
        </button>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  )

  // ── SUCCESS ──────────────────────────────────────────────────
  if (step === 'success' && selected) return (
    <div style={{ minHeight: '100vh', background: '#0d0d1a', color: '#e2e2ff', fontFamily: "'Sora', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 500, width: '100%', textAlign: 'center' }}>
        <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, margin: '0 auto 24px', animation: 'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}>✅</div>
        <h2 style={{ fontSize: 30, fontWeight: 800, marginBottom: 10, background: 'linear-gradient(135deg, #4ade80, #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          You are Registered!
        </h2>
        <p style={{ color: '#7c86a2', marginBottom: 28, fontSize: 15 }}>Your spot is confirmed. See you at the session! 🎉</p>
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 20, padding: '28px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #4ade80, #22d3ee, #8b5cf6)' }} />
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>PARTICIPANT ID</div>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 3, color: '#4ade80', marginBottom: 20, fontFamily: 'monospace' }}>{participantId}</div>
          <div style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: 18 }}>
            {[
              ['Session', selected.title],
              ['Date', formatDate(selected.date)],
              ['Time', selected.time],
              ['Venue', selected.venue],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: 13 }}>
                <span style={{ color: '#6b7280' }}>{label}</span>
                <span style={{ color: '#e2e2ff', fontWeight: 600, maxWidth: 260, textAlign: 'right' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => { setStep('browse'); setSelected(null) }} style={{ flex: 1, padding: '12px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#c4b5fd' }}>
            ← Register Another
          </button>
          <button onClick={() => navigate('/dashboard')} style={{ flex: 1, padding: '12px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', border: 'none', color: '#fff' }}>
            My Dashboard →
          </button>
        </div>
      </div>
      <style>{`@keyframes popIn { from { transform: scale(0.5); opacity: 0 } to { transform: scale(1); opacity: 1 } }`}</style>
    </div>
  )

  return null
}
