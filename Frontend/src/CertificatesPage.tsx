// ── CERTIFICATES PAGE (mock mode — Supabase disabled) ─────────────────────
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface Certificate {
  id: string
  sessionTitle: string
  sessionDate: string
  speaker: string
  mode: 'offline' | 'online' | 'hybrid'
  participantName: string
  participantId: string
  issuedOn: string
  qrCode: string
  tags: string[]
  score?: number // optional quiz score
  status: 'issued' | 'pending'
}

const MOCK_CERTIFICATES: Certificate[] = [
  {
    id: 'CERT-2026-A1B2',
    sessionTitle: 'Introduction to Social Impact Measurement',
    sessionDate: '2026-04-10',
    speaker: 'Dr. Priya Sharma',
    mode: 'hybrid',
    participantName: 'Arjun Desai',
    participantId: 'RF-9X2KMP',
    issuedOn: '2026-04-11',
    qrCode: 'QR-CERT-2026-A1B2',
    tags: ['Impact', 'NGO', 'Beginner'],
    score: 88,
    status: 'issued',
  },
  {
    id: 'CERT-2026-C3D4',
    sessionTitle: 'Community Fundraising Strategies',
    sessionDate: '2026-04-14',
    speaker: 'Rahul Mehta',
    mode: 'online',
    participantName: 'Arjun Desai',
    participantId: 'RF-7W4LQR',
    issuedOn: '2026-04-15',
    qrCode: 'QR-CERT-2026-C3D4',
    tags: ['Fundraising', 'Strategy'],
    score: 92,
    status: 'issued',
  },
  {
    id: 'CERT-2026-E5F6',
    sessionTitle: 'Youth Leadership & Civic Engagement',
    sessionDate: '2026-04-18',
    speaker: 'Aisha Khan',
    mode: 'offline',
    participantName: 'Arjun Desai',
    participantId: 'RF-3M8TXZ',
    issuedOn: '',
    qrCode: '',
    tags: ['Youth', 'Leadership', 'Civic'],
    status: 'pending',
  },
]

const getLiveUser = () => {
  const base = { name: 'Arjun Desai', email: 'arjun.desai@gmail.com' };
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('user') || localStorage.getItem('sf_user');
      if (raw) {
        const u = JSON.parse(raw);
        if (u.name) base.name = u.name;
        if (u.email) base.email = u.email;
      }
    } catch { /* ignore */ }
  }
  return base;
};

export default function CertificatesPage() {
  const navigate = useNavigate();
  const liveUser = getLiveUser();
  const [selected, setSelected] = useState<Certificate | null>(null)
  const [view, setView] = useState<'list' | 'preview'>('list')
  const [downloading, setDownloading] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'issued' | 'pending'>('all')
  const [copied, setCopied] = useState(false)

  const filtered = MOCK_CERTIFICATES.filter(c =>
    filter === 'all' ? true : c.status === filter
  )

  const handleDownload = async (cert: Certificate) => {
    setDownloading(cert.id)
    await new Promise(r => setTimeout(r, 800))
    setDownloading(null)
    window.open(`/certificate-preview.html?user=${encodeURIComponent(liveUser.name)}&session=${encodeURIComponent(cert.sessionTitle)}&code=${cert.id}`, '_blank')
  }

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const modeColor = (m: string) => {
    if (m === 'online') return '#22d3ee'
    if (m === 'offline') return '#a78bfa'
    return '#fb923c'
  }

  const formatDate = (d: string) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'

  const scoreColor = (s?: number) => {
    if (!s) return '#6b7280'
    if (s >= 90) return '#4ade80'
    if (s >= 75) return '#22d3ee'
    return '#fb923c'
  }

  // ── PREVIEW ─────────────────────────────────────────────────
  if (view === 'preview' && selected) return (
    <div style={{ minHeight: '100vh', background: '#0d0d1a', color: '#e2e2ff', fontFamily: "'Sora', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <button onClick={() => navigate('/')} style={{ position: 'absolute', top: 20, left: 20, background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)', color: '#a78bfa', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', zIndex: 10 }}>← Back to Home</button>
      <div style={{ maxWidth: 680, width: '100%' }}>
        <button onClick={() => setView('list')} style={{ background: 'none', border: 'none', color: '#7c86a2', cursor: 'pointer', fontSize: 14, marginBottom: 24, padding: 0 }}>
          ← Back to Certificates
        </button>

        {/* Certificate Card */}
        <div style={{
          background: 'linear-gradient(135deg, #1a1a3e 0%, #12122b 100%)',
          border: '1px solid rgba(139,92,246,0.4)',
          borderRadius: 24,
          overflow: 'hidden',
          position: 'relative',
          marginBottom: 24,
        }}>
          {/* Top gradient bar */}
          <div style={{ height: 5, background: 'linear-gradient(90deg, #8b5cf6, #22d3ee, #4ade80)' }} />

          {/* Decorative circles */}
          <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(139,92,246,0.06)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -40, left: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(34,211,238,0.05)', pointerEvents: 'none' }} />

          <div style={{ padding: '36px 40px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 20, padding: '5px 14px', marginBottom: 14, fontSize: 12, color: '#a78bfa' }}>
                  🏅 Certificate of Participation
                </div>
                <h2 style={{ fontSize: 'clamp(18px, 3vw, 26px)', fontWeight: 800, margin: 0, color: '#e2e2ff', lineHeight: 1.3 }}>
                  {selected.sessionTitle}
                </h2>
              </div>
              {selected.score && (
                <div style={{ textAlign: 'center', background: `${scoreColor(selected.score)}18`, border: `1px solid ${scoreColor(selected.score)}40`, borderRadius: 14, padding: '12px 18px', minWidth: 80 }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: scoreColor(selected.score), lineHeight: 1 }}>{selected.score}%</div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>Quiz Score</div>
                </div>
              )}
            </div>

            {/* Participant */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '18px 20px', marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, letterSpacing: 1, textTransform: 'uppercase' }}>Awarded to</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#c4b5fd', marginBottom: 4 }}>{selected.participantName}</div>
              <div style={{ fontSize: 13, color: '#7c86a2' }}>Participant ID: <span style={{ color: '#94a3b8', fontFamily: 'monospace' }}>{selected.participantId}</span></div>
            </div>

            {/* Details grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
              {[
                { label: '👤 Speaker', value: selected.speaker },
                { label: '📅 Session Date', value: formatDate(selected.sessionDate) },
                { label: '📜 Issued On', value: formatDate(selected.issuedOn) },
                { label: '🌐 Mode', value: selected.mode.charAt(0).toUpperCase() + selected.mode.slice(1) },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 13, color: '#e2e2ff', fontWeight: 600 }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Tags */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
              {selected.tags.map(t => (
                <span key={t} style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 6, padding: '2px 10px', fontSize: 11, color: '#a78bfa' }}>{t}</span>
              ))}
            </div>

            {/* QR section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 14, padding: '16px 20px' }}>
              {/* Mock QR block */}
              <div style={{ width: 60, height: 60, background: 'rgba(34,197,94,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>
                ▦
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: '#4ade80', fontWeight: 700, marginBottom: 3 }}>QR Verified Certificate</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Scan QR code to verify authenticity. Certificate ID: <span style={{ fontFamily: 'monospace', color: '#94a3b8' }}>{selected.id}</span></div>
              </div>
              <button
                onClick={() => handleCopyId(selected.id)}
                style={{ background: copied ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)', border: `1px solid ${copied ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 8, padding: '6px 12px', color: copied ? '#4ade80' : '#94a3b8', cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}
              >
                {copied ? '✓ Copied' : 'Copy ID'}
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => handleDownload(selected)}
            disabled={downloading === selected.id}
            style={{
              flex: 2, padding: '14px', borderRadius: 12, fontWeight: 700, fontSize: 14,
              cursor: downloading === selected.id ? 'not-allowed' : 'pointer',
              background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', border: 'none', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {downloading === selected.id ? (
              <>
                <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                Generating PDF...
              </>
            ) : '⬇ Download PDF Certificate'}
          </button>
          <button
            onClick={() => {
              const text = `I just earned a certificate for "${selected.sessionTitle}" at Renovatio! 🎓 Certificate ID: ${selected.id}`
              navigator.clipboard.writeText(text)
              alert('Share text copied to clipboard!')
            }}
            style={{ flex: 1, padding: '14px', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.3)', color: '#22d3ee' }}
          >
            🔗 Share
          </button>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  )

  // ── LIST ─────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#0d0d1a', color: '#e2e2ff', fontFamily: "'Sora', sans-serif", paddingBottom: 80 }}>
      <button onClick={() => navigate('/')} style={{ position: 'absolute', top: 20, left: 20, background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)', color: '#a78bfa', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', zIndex: 10 }}>← Back to Home</button>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a1a3e 0%, #12122b 100%)', borderBottom: '1px solid rgba(139,92,246,0.2)', padding: '48px 24px 36px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 20, padding: '6px 18px', marginBottom: 20, fontSize: 13, color: '#a78bfa' }}>
          <span>🏅</span> My Certificates
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 800, margin: '0 0 12px', background: 'linear-gradient(135deg, #fff 0%, #c4b5fd 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Your Certificates
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 16, margin: '0 auto', maxWidth: 520 }}>
          View, download, and share your QR-verified session certificates.
        </p>

        {/* Stats row */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 28, flexWrap: 'wrap' }}>
          {[
            { label: 'Total', value: MOCK_CERTIFICATES.length, color: '#c4b5fd' },
            { label: 'Issued', value: MOCK_CERTIFICATES.filter(c => c.status === 'issued').length, color: '#4ade80' },
            { label: 'Pending', value: MOCK_CERTIFICATES.filter(c => c.status === 'pending').length, color: '#fb923c' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '32px auto 0', padding: '0 24px' }}>
        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
          {(['all', 'issued', 'pending'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '10px 22px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              border: filter === f ? '1px solid #8b5cf6' : '1px solid rgba(255,255,255,0.1)',
              background: filter === f ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.04)',
              color: filter === f ? '#c4b5fd' : '#94a3b8', transition: 'all 0.2s', textTransform: 'capitalize',
            }}>
              {f === 'all' ? 'All Certificates' : f === 'issued' ? '✅ Issued' : '⏳ Pending'}
            </button>
          ))}
        </div>

        {/* Certificate cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map(cert => (
            <div
              key={cert.id}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${cert.status === 'issued' ? 'rgba(139,92,246,0.2)' : 'rgba(251,146,60,0.2)'}`,
                borderRadius: 16,
                padding: '22px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                flexWrap: 'wrap',
                transition: 'all 0.2s',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLDivElement).style.border = `1px solid ${cert.status === 'issued' ? 'rgba(139,92,246,0.45)' : 'rgba(251,146,60,0.45)'}` }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLDivElement).style.border = `1px solid ${cert.status === 'issued' ? 'rgba(139,92,246,0.2)' : 'rgba(251,146,60,0.2)'}` }}
            >
              {/* Left accent bar */}
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: cert.status === 'issued' ? 'linear-gradient(180deg, #8b5cf6, #22d3ee)' : 'linear-gradient(180deg, #fb923c, #fbbf24)', borderRadius: '4px 0 0 4px' }} />

              {/* Icon */}
              <div style={{ width: 52, height: 52, borderRadius: 14, background: cert.status === 'issued' ? 'rgba(139,92,246,0.15)' : 'rgba(251,146,60,0.12)', border: `1px solid ${cert.status === 'issued' ? 'rgba(139,92,246,0.3)' : 'rgba(251,146,60,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                {cert.status === 'issued' ? '🏅' : '⏳'}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: '#e2e2ff' }}>{cert.sessionTitle}</h3>
                  <span style={{ background: `${modeColor(cert.mode)}22`, border: `1px solid ${modeColor(cert.mode)}44`, borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 700, color: modeColor(cert.mode), textTransform: 'uppercase' }}>{cert.mode}</span>
                </div>
                <div style={{ fontSize: 12, color: '#7c86a2', marginBottom: 6 }}>👤 {cert.speaker} &nbsp;·&nbsp; 📅 {formatDate(cert.sessionDate)}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {cert.tags.map(t => (
                    <span key={t} style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 5, padding: '1px 7px', fontSize: 10, color: '#a78bfa' }}>{t}</span>
                  ))}
                </div>
              </div>

              {/* Score */}
              {cert.score && (
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: scoreColor(cert.score) }}>{cert.score}%</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>Score</div>
                </div>
              )}

              {/* Status + Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                <span style={{
                  background: cert.status === 'issued' ? 'rgba(34,197,94,0.15)' : 'rgba(251,146,60,0.15)',
                  border: `1px solid ${cert.status === 'issued' ? 'rgba(34,197,94,0.35)' : 'rgba(251,146,60,0.35)'}`,
                  borderRadius: 8, padding: '4px 12px', fontSize: 12, fontWeight: 700,
                  color: cert.status === 'issued' ? '#4ade80' : '#fb923c',
                }}>
                  {cert.status === 'issued' ? '✅ Issued' : '⏳ Pending'}
                </span>

                {cert.status === 'issued' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => { setSelected(cert); setView('preview') }}
                      style={{ padding: '8px 16px', borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: 'pointer', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#c4b5fd' }}
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleDownload(cert)}
                      disabled={downloading === cert.id}
                      style={{ padding: '8px 16px', borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: downloading === cert.id ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      {downloading === cert.id ? (
                        <><span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />...</>
                      ) : '⬇ PDF'}
                    </button>
                  </div>
                )}

                {cert.status === 'pending' && (
                  <div style={{ fontSize: 12, color: '#6b7280', textAlign: 'right' }}>
                    Issued after session ends
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#6b7280' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏅</div>
            <p style={{ fontSize: 16 }}>No certificates here yet.</p>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
