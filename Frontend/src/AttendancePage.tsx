// ── ATTENDANCE PAGE — SessionFlow ─────────────────────────────────────────
import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

// ── Types ──────────────────────────────────────────────────────────────────
type SessionMode   = 'online' | 'offline' | 'hybrid'
type SessionStatus = 'live' | 'upcoming' | 'ended'
type CheckInMethod = 'QR' | 'OTP' | 'Manual'
type ActiveMethod  = 'qr' | 'otp' | 'manual'
type ActiveTab     = 'checkin' | 'live'

interface TodaySession {
  id: string
  title: string
  time: string
  venue: string
  speaker: string
  mode: SessionMode
  status: SessionStatus
  attendees: number
  capacity: number
}

interface CheckIn {
  id: string
  name: string
  time: string
  method: CheckInMethod
}

interface CheckInResult {
  success: boolean
  name: string
  id: string
  message: string
}

interface StatusConfig {
  label: string
  color: string
  bg: string
  border: string
  dot: boolean
}

// ── Mock Data ──────────────────────────────────────────────────────────────
const TODAY_SESSIONS: TodaySession[] = [
  {
    id: 's1',
    title: 'Introduction to Social Impact Measurement',
    time: '10:00 AM',
    venue: 'Renovation Hall A, Mumbai',
    speaker: 'Dr. Priya Sharma',
    mode: 'hybrid',
    status: 'live',
    attendees: 61,
    capacity: 100,
  },
  {
    id: 's2',
    title: 'Community Fundraising Strategies',
    time: '2:00 PM',
    venue: 'Online (Zoom)',
    speaker: 'Rahul Mehta',
    mode: 'online',
    status: 'upcoming',
    attendees: 0,
    capacity: 200,
  },
  {
    id: 's3',
    title: 'Youth Leadership & Civic Engagement',
    time: '11:00 AM',
    venue: 'Renovation Centre, Pune',
    speaker: 'Aisha Khan',
    mode: 'offline',
    status: 'ended',
    attendees: 55,
    capacity: 60,
  },
]

const RECENT_CHECKINS: CheckIn[] = [
  { id: 'RF-A8X2K1', name: 'Arjun Desai',    time: '9:58 AM',  method: 'QR'     },
  { id: 'RF-Z3P9W4', name: 'Meera Joshi',    time: '10:01 AM', method: 'OTP'    },
  { id: 'RF-Q7M5R2', name: 'Kunal Shah',     time: '10:03 AM', method: 'QR'     },
  { id: 'RF-B1N6T8', name: 'Priya Nair',     time: '10:06 AM', method: 'Manual' },
]

// ── Helpers ────────────────────────────────────────────────────────────────
const MOCK_NAMES = ['Arjun Desai', 'Meera Joshi', 'Kunal Shah', 'Priya Nair', 'Rohan Pillai', 'Sneha Kulkarni']

const mockScanQR = (): { id: string; name: string } => ({
  id:   'RF-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
  name: MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)],
})

const modeColor = (m: SessionMode): string => {
  if (m === 'online')  return '#22d3ee'
  if (m === 'offline') return '#a78bfa'
  return '#fb923c'
}

const methodColor = (m: CheckInMethod): { bg: string; border: string; text: string } => {
  if (m === 'QR')     return { bg: 'rgba(34,211,238,0.12)',  border: 'rgba(34,211,238,0.3)',  text: '#22d3ee' }
  if (m === 'OTP')    return { bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.3)',  text: '#fb923c' }
  return               { bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)', text: '#a78bfa' }
}

const STATUS_CONFIG: Record<SessionStatus, StatusConfig> = {
  live:     { label: 'LIVE NOW',  color: '#4ade80', bg: 'rgba(74,222,128,0.12)',  border: 'rgba(74,222,128,0.35)',  dot: true  },
  upcoming: { label: 'UPCOMING',  color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.35)',  dot: false },
  ended:    { label: 'ENDED',     color: '#6b7280', bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.35)', dot: false },
}

// ── Sub-components ─────────────────────────────────────────────────────────

interface QRScannerProps {
  scanning: boolean
}

function QRScanner({ scanning }: QRScannerProps) {
  const corners: React.CSSProperties[] = [
    { top: 0,    left:  0,     borderTop:    '3px solid #8b5cf6', borderLeft:   '3px solid #8b5cf6' },
    { top: 0,    right: 0,     borderTop:    '3px solid #8b5cf6', borderRight:  '3px solid #8b5cf6' },
    { bottom: 0, left:  0,     borderBottom: '3px solid #8b5cf6', borderLeft:   '3px solid #8b5cf6' },
    { bottom: 0, right: 0,     borderBottom: '3px solid #8b5cf6', borderRight:  '3px solid #8b5cf6' },
  ]

  return (
    <div style={{ position: 'relative', width: 220, height: 220, margin: '0 auto' }}>
      {corners.map((s, i) => (
        <div key={i} style={{ position: 'absolute', width: 24, height: 24, borderRadius: 3, ...s }} />
      ))}
      <div style={{
        position: 'absolute', inset: 20,
        background: 'repeating-linear-gradient(0deg, rgba(139,92,246,0.06) 0px, transparent 1px, transparent 14px), repeating-linear-gradient(90deg, rgba(139,92,246,0.06) 0px, transparent 1px, transparent 14px)',
        borderRadius: 8,
      }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 56, opacity: scanning ? 0.4 : 0.7, transition: 'opacity 0.3s' }}>⬛</div>
      </div>
      {scanning && (
        <div style={{
          position: 'absolute', left: 20, right: 20, height: 2,
          background: 'linear-gradient(90deg, transparent, #8b5cf6, #c4b5fd, #8b5cf6, transparent)',
          borderRadius: 2,
          animation: 'scanLine 1.6s ease-in-out infinite',
          top: '50%',
        }} />
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────

interface OTPInputProps {
  value: string
  onChange: (val: string) => void
}

function OTPInput({ value, onChange }: OTPInputProps) {
  const ref0 = useRef<HTMLInputElement>(null)
  const ref1 = useRef<HTMLInputElement>(null)
  const ref2 = useRef<HTMLInputElement>(null)
  const ref3 = useRef<HTMLInputElement>(null)
  const ref4 = useRef<HTMLInputElement>(null)
  const ref5 = useRef<HTMLInputElement>(null)
  const refs = [ref0, ref1, ref2, ref3, ref4, ref5]
  const digits: string[] = value.split('').concat(Array(6).fill('')).slice(0, 6)

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Backspace') {
      onChange(digits.map((d, idx) => (idx === i ? '' : d)).join(''))
      if (i > 0) refs[i - 1].current?.focus()
    } else if (/^\d$/.test(e.key)) {
      onChange(digits.map((d, idx) => (idx === i ? e.key : d)).join(''))
      if (i < 5) refs[i + 1].current?.focus()
    }
  }

  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={refs[i]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={() => {}}
          onKeyDown={(e) => handleKey(i, e)}
          style={{
            width: 48, height: 56, textAlign: 'center', fontSize: 22, fontWeight: 800,
            background: d ? 'rgba(139,92,246,0.18)' : 'rgba(255,255,255,0.05)',
            border: d ? '2px solid rgba(139,92,246,0.6)' : '2px solid rgba(255,255,255,0.1)',
            borderRadius: 12, color: '#e2e2ff', outline: 'none',
            transition: 'all 0.15s', fontFamily: 'monospace',
          }}
        />
      ))}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function AttendancePage() {
  const navigate = useNavigate();
  const [selectedSession, setSelectedSession] = useState<TodaySession>(TODAY_SESSIONS[0])
  const [method,          setMethod]          = useState<ActiveMethod>('qr')
  const [tab,             setTab]             = useState<ActiveTab>('checkin')
  const [scanning,        setScanning]        = useState<boolean>(false)
  const [otp,             setOtp]             = useState<string>('')
  const [manualId,        setManualId]        = useState<string>('')
  const [checkinResult,   setCheckinResult]   = useState<CheckInResult | null>(null)
  const [recentList,      setRecentList]      = useState<CheckIn[]>(RECENT_CHECKINS)

  const doCheckin = (id: string, name: string, methodLabel: CheckInMethod): void => {
    if (recentList.some(r => r.id === id)) {
      setCheckinResult({ success: false, name, id, message: 'Already checked in.' })
      return
    }
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    setRecentList(prev => [{ id, name, time: now, method: methodLabel }, ...prev])
    setCheckinResult({ success: true, name, id, message: 'Check-in successful!' })
  }

  const handleQRScan = (): void => {
    setScanning(true)
    setCheckinResult(null)
    setTimeout(() => {
      const { id, name } = mockScanQR()
      setScanning(false)
      doCheckin(id, name, 'QR')
    }, 2200)
  }

  const handleOTPVerify = (): void => {
    if (otp.length < 6) return
    const id   = 'RF-OT' + otp.slice(3)
    const name = ['Sneha Kulkarni', 'Dev Kapoor', 'Rishika Sen'][parseInt(otp[0]) % 3]
    doCheckin(id, name, 'OTP')
    setOtp('')
  }

  const handleManual = (): void => {
    if (!manualId.trim()) return
    doCheckin(manualId.trim().toUpperCase(), 'Manual Entry', 'Manual')
    setManualId('')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d1a', color: '#e2e2ff', fontFamily: "'Sora', sans-serif", paddingBottom: 80 }}>
      <button onClick={() => navigate('/')} style={{ position: 'absolute', top: 20, left: 20, background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)', color: '#a78bfa', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', zIndex: 10 }}>← Back to Home</button>

      {/* ── Header ── */}
      <div style={{ background: 'linear-gradient(135deg, #1a1a3e 0%, #12122b 100%)', borderBottom: '1px solid rgba(139,92,246,0.2)', padding: '48px 24px 36px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 20, padding: '6px 18px', marginBottom: 20, fontSize: 13, color: '#a78bfa' }}>
          <span>📡</span> Attendance
        </div>
        <h1 style={{ fontSize: 'clamp(26px, 5vw, 44px)', fontWeight: 800, margin: '0 0 10px', background: 'linear-gradient(135deg, #fff 0%, #c4b5fd 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Session Check-In
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 15, margin: '0 auto', maxWidth: 500 }}>
          Mark attendance via QR scan, OTP, or manual Participant ID entry.
        </p>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 0' }}>

        {/* ── Session Selector ── */}
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', letterSpacing: 2, marginBottom: 12, textTransform: 'uppercase' }}>Select Session</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {TODAY_SESSIONS.map(s => {
              const sc     = STATUS_CONFIG[s.status]
              const active = selectedSession.id === s.id
              return (
                <button key={s.id} onClick={() => { setSelectedSession(s); setCheckinResult(null) }} style={{
                  padding: '12px 18px', borderRadius: 14, cursor: 'pointer', textAlign: 'left',
                  background: active ? 'rgba(139,92,246,0.18)' : 'rgba(255,255,255,0.04)',
                  border: active ? '1px solid rgba(139,92,246,0.55)' : '1px solid rgba(255,255,255,0.08)',
                  transition: 'all 0.2s', flex: '1 1 200px', minWidth: 200, maxWidth: 360,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 800, color: sc.color, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 5 }}>
                      {sc.dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.color, display: 'inline-block', animation: 'pulse 1.2s ease-in-out infinite' }} />}
                      {sc.label}
                    </span>
                    <span style={{ fontSize: 11, color: '#6b7280' }}>{s.time}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: active ? '#c4b5fd' : '#e2e2ff', lineHeight: 1.4 }}>{s.title}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Tab Switch ── */}
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4, width: 'fit-content', marginBottom: 28 }}>
          {(['checkin', 'live'] as ActiveTab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '9px 22px', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
              background: tab === t ? 'rgba(139,92,246,0.3)' : 'transparent',
              border:     tab === t ? '1px solid rgba(139,92,246,0.4)' : '1px solid transparent',
              color:      tab === t ? '#c4b5fd' : '#6b7280',
            }}>
              {t === 'checkin' ? '📡 Check-In' : '📊 Live Stats'}
            </button>
          ))}
        </div>

        {/* ── CHECK-IN TAB ── */}
        {tab === 'checkin' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,0.9fr)', gap: 24, alignItems: 'start' }}>

            {/* LEFT: method panel */}
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {(['qr', 'otp', 'manual'] as ActiveMethod[]).map(m => {
                  const icons: Record<ActiveMethod, string>  = { qr: '📷', otp: '🔐', manual: '✏️' }
                  const labels: Record<ActiveMethod, string> = { qr: 'QR Code', otp: 'OTP', manual: 'Manual ID' }
                  return (
                    <button key={m} onClick={() => { setMethod(m); setCheckinResult(null) }} style={{
                      flex: 1, padding: '11px 8px', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                      background: method === m ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.04)',
                      border:     method === m ? '1px solid rgba(139,92,246,0.5)' : '1px solid rgba(255,255,255,0.08)',
                      color:      method === m ? '#c4b5fd' : '#7c86a2',
                    }}>
                      <div style={{ fontSize: 18, marginBottom: 3 }}>{icons[m]}</div>
                      {labels[m]}
                    </button>
                  )
                })}
              </div>

              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: 20, padding: '32px 28px' }}>

                {/* QR */}
                {method === 'qr' && (
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 14, color: '#7c86a2', marginBottom: 24 }}>Point participant's QR code at the scanner to check in instantly.</p>
                    <QRScanner scanning={scanning} />
                    <button onClick={handleQRScan} disabled={scanning} style={{
                      marginTop: 28, padding: '14px 40px', borderRadius: 12, fontSize: 15, fontWeight: 700,
                      cursor: scanning ? 'not-allowed' : 'pointer',
                      background: scanning ? 'rgba(139,92,246,0.2)' : 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                      border: 'none', color: '#fff', transition: 'all 0.2s',
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                    }}>
                      {scanning
                        ? <><span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Scanning…</>
                        : '📷 Scan QR Code'}
                    </button>
                  </div>
                )}

                {/* OTP */}
                {method === 'otp' && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Enter Participant OTP</h3>
                    <p style={{ fontSize: 13, color: '#7c86a2', marginBottom: 28 }}>Participants receive a 6-digit OTP via email/WhatsApp before the session.</p>
                    <OTPInput value={otp} onChange={setOtp} />
                    <button onClick={handleOTPVerify} disabled={otp.length < 6} style={{
                      marginTop: 24, padding: '13px 40px', borderRadius: 12, fontSize: 15, fontWeight: 700,
                      cursor: otp.length < 6 ? 'not-allowed' : 'pointer',
                      background: otp.length < 6 ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                      border: 'none', color: otp.length < 6 ? '#4b5563' : '#fff',
                    }}>Verify OTP →</button>
                  </div>
                )}

                {/* Manual */}
                {method === 'manual' && (
                  <div>
                    <div style={{ fontSize: 40, marginBottom: 12, textAlign: 'center' }}>✏️</div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, textAlign: 'center' }}>Enter Participant ID</h3>
                    <p style={{ fontSize: 13, color: '#7c86a2', marginBottom: 28, textAlign: 'center' }}>Manually key in the Participant ID from their confirmation (e.g. RF-A8X2K1).</p>
                    <input
                      value={manualId}
                      onChange={e => setManualId(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleManual()}
                      placeholder="RF-XXXXXX"
                      style={{
                        width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(139,92,246,0.3)',
                        borderRadius: 12, padding: '14px 18px', color: '#e2e2ff', fontSize: 16, outline: 'none',
                        fontFamily: 'monospace', letterSpacing: 2, textTransform: 'uppercase', boxSizing: 'border-box', marginBottom: 16,
                      }}
                    />
                    <button onClick={handleManual} disabled={!manualId.trim()} style={{
                      width: '100%', padding: '14px', borderRadius: 12, fontSize: 15, fontWeight: 700,
                      cursor: !manualId.trim() ? 'not-allowed' : 'pointer',
                      background: !manualId.trim() ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                      border: 'none', color: !manualId.trim() ? '#4b5563' : '#fff',
                    }}>Check In →</button>
                  </div>
                )}

                {/* Result toast */}
                {checkinResult && (
                  <div style={{
                    marginTop: 24, borderRadius: 14, padding: '16px 20px',
                    background: checkinResult.success ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
                    border: `1px solid ${checkinResult.success ? 'rgba(74,222,128,0.35)' : 'rgba(248,113,113,0.35)'}`,
                    display: 'flex', alignItems: 'center', gap: 12, animation: 'fadeUp 0.3s ease',
                  }}>
                    <div style={{ fontSize: 28 }}>{checkinResult.success ? '✅' : '❌'}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: checkinResult.success ? '#4ade80' : '#f87171' }}>{checkinResult.message}</div>
                      <div style={{ fontSize: 12, color: '#7c86a2', marginTop: 3 }}>
                        {checkinResult.name} · <span style={{ fontFamily: 'monospace' }}>{checkinResult.id}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: recent check-ins */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: 20, padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Recent Check-ins</h3>
                <span style={{ background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 8, padding: '3px 10px', fontSize: 12, fontWeight: 700, color: '#4ade80' }}>
                  {recentList.length} today
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {recentList.slice(0, 8).map((r, i) => {
                  const mc = methodColor(r.method)
                  return (
                    <div key={r.id + i} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12,
                      background: i === 0 ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.03)',
                      border: i === 0 ? '1px solid rgba(139,92,246,0.25)' : '1px solid rgba(255,255,255,0.05)',
                      animation: i === 0 ? 'fadeUp 0.35s ease' : 'none',
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                        background: `hsl(${(r.id.charCodeAt(3) * 47) % 360}, 55%, 40%)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 700, color: '#fff',
                      }}>{r.name[0]}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e2ff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
                        <div style={{ fontSize: 11, color: '#6b7280', fontFamily: 'monospace' }}>{r.id}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{r.time}</div>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: mc.bg, color: mc.text, border: `1px solid ${mc.border}` }}>
                          {r.method}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── LIVE STATS TAB ── */}
        {tab === 'live' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
              {([
                { label: 'Checked In',   value: recentList.length,                                                              icon: '✅', color: '#4ade80' },
                { label: 'Registered',   value: selectedSession.capacity - 26,                                                  icon: '📋', color: '#c4b5fd' },
                { label: 'Capacity',     value: selectedSession.capacity,                                                       icon: '💺', color: '#fb923c' },
                { label: 'Attendance %', value: Math.round((recentList.length / (selectedSession.capacity - 26)) * 100) + '%',  icon: '📊', color: '#22d3ee' },
              ] as { label: string; value: number | string; icon: string; color: string }[]).map(card => (
                <div key={card.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 16, padding: '20px' }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{card.icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: card.color, marginBottom: 4 }}>{card.value}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>{card.label}</div>
                </div>
              ))}
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: 20, padding: '24px' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>All Sessions — Today</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {TODAY_SESSIONS.map(s => {
                  const sc  = STATUS_CONFIG[s.status]
                  const pct = Math.min(100, (s.attendees / s.capacity) * 100)
                  return (
                    <div key={s.id} style={{ padding: '18px 20px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ display: 'flex', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                            <span style={{ background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 800, color: sc.color, letterSpacing: 1 }}>{sc.label}</span>
                            <span style={{ background: `${modeColor(s.mode)}22`, border: `1px solid ${modeColor(s.mode)}44`, borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 700, color: modeColor(s.mode), textTransform: 'uppercase' }}>{s.mode}</span>
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e2ff' }}>{s.title}</div>
                          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>👤 {s.speaker} · 🕐 {s.time}</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 22, fontWeight: 800, color: '#c4b5fd' }}>{s.attendees}</div>
                          <div style={{ fontSize: 11, color: '#6b7280' }}>/ {s.capacity}</div>
                        </div>
                      </div>
                      <div style={{ height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 10 }}>
                        <div style={{ height: '100%', borderRadius: 10, width: `${pct}%`, background: s.status === 'ended' ? '#6b7280' : 'linear-gradient(90deg, #8b5cf6, #6d28d9)', transition: 'width 0.8s ease' }} />
                      </div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 6, textAlign: 'right' }}>{Math.round(pct)}% capacity</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg) } }
        @keyframes fadeUp  { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes pulse   { 0%,100% { opacity: 1 } 50% { opacity: 0.3 } }
        @keyframes scanLine {
          0%   { top: 20px;  opacity: 1 }
          50%  { top: 200px; opacity: 1 }
          51%  { opacity: 0 }
          52%  { top: 20px;  opacity: 0 }
          53%  { opacity: 1 }
          100% { top: 20px;  opacity: 1 }
        }
      `}</style>
    </div>
  )
}
