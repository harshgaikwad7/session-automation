// ── FEEDBACK PAGE — SessionFlow ────────────────────────────────────────────
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// ── Types ───────────────────────────────────────────────────────────────────
type FeedbackTab   = 'submit' | 'analytics'
type RatingKey     = 'overall' | 'speaker' | 'content' | 'venue'
type Ratings       = Record<RatingKey, number>

interface CompletedSession {
  id: string
  title: string
  speaker: string
  date: string
  mode: 'online' | 'offline' | 'hybrid'
  hasFeedback: boolean
}

interface AnalyticsStat {
  label: string
  value: string
  sub: string
  color: string
  icon: string
}

interface TagOption {
  id: string
  label: string
  emoji: string
}

interface BarItem {
  label: string
  count: number
  pct: number
  color: string
}

// ── Mock Data ────────────────────────────────────────────────────────────────
const COMPLETED_SESSIONS: CompletedSession[] = [
  { id: 's1', title: 'Introduction to Social Impact Measurement', speaker: 'Dr. Priya Sharma', date: 'Apr 10, 2026', mode: 'hybrid',  hasFeedback: false },
  { id: 's3', title: 'Youth Leadership & Civic Engagement',       speaker: 'Aisha Khan',       date: 'Apr 18, 2026', mode: 'offline', hasFeedback: true  },
]

const TAG_OPTIONS: TagOption[] = [
  { id: 'engaging',     label: 'Engaging',         emoji: '🔥' },
  { id: 'informative',  label: 'Informative',       emoji: '📚' },
  { id: 'interactive',  label: 'Interactive',       emoji: '🤝' },
  { id: 'well-paced',   label: 'Well-paced',        emoji: '⏱️' },
  { id: 'inspiring',    label: 'Inspiring',         emoji: '✨' },
  { id: 'practical',    label: 'Practical',         emoji: '🛠️' },
  { id: 'too-long',     label: 'Too Long',          emoji: '😴' },
  { id: 'needs-qa',     label: 'Needs More Q&A',    emoji: '❓' },
]

const RATING_LABELS: Record<RatingKey, { label: string; icon: string }> = {
  overall: { label: 'Overall Experience', icon: '⭐' },
  speaker: { label: 'Speaker Quality',    icon: '🎤' },
  content: { label: 'Content Value',      icon: '📖' },
  venue:   { label: 'Venue / Platform',   icon: '📍' },
}

const ANALYTICS_STATS: AnalyticsStat[] = [
  { label: 'Responses',      value: '147',  sub: 'this month',    color: '#c4b5fd', icon: '📝' },
  { label: 'Avg Rating',     value: '4.6',  sub: 'out of 5',      color: '#4ade80', icon: '⭐' },
  { label: 'Response Rate',  value: '82%',  sub: 'of attendees',  color: '#22d3ee', icon: '📊' },
  { label: 'NPS Score',      value: '+67',  sub: 'excellent',     color: '#fb923c', icon: '🚀' },
]

const RATING_DISTRIBUTION: BarItem[] = [
  { label: '5 ⭐', count: 89,  pct: 61, color: '#4ade80' },
  { label: '4 ⭐', count: 38,  pct: 26, color: '#a3e635' },
  { label: '3 ⭐', count: 14,  pct: 10, color: '#facc15' },
  { label: '2 ⭐', count: 4,   pct: 2,  color: '#fb923c' },
  { label: '1 ⭐', count: 2,   pct: 1,  color: '#f87171' },
]

const TOP_TAGS: { label: string; emoji: string; count: number }[] = [
  { label: 'Informative',  emoji: '📚', count: 98  },
  { label: 'Engaging',     emoji: '🔥', count: 87  },
  { label: 'Inspiring',    emoji: '✨', count: 71  },
  { label: 'Practical',    emoji: '🛠️', count: 54  },
  { label: 'Interactive',  emoji: '🤝', count: 43  },
  { label: 'Well-paced',   emoji: '⏱️', count: 38  },
]

const RECENT_QUOTES: string[] = [
  "Dr. Sharma's session was genuinely eye-opening. I left with a complete toolkit for measuring our NGO's social ROI.",
  "The hybrid format worked surprisingly well. Great balance of in-person energy and online accessibility.",
  "Would love more time for Q&A — the discussion was the best part. Otherwise, absolutely outstanding session.",
  "Incredibly practical. We implemented two frameworks from this session within the same week.",
]

// ── Star Rating Component ────────────────────────────────────────────────────
interface StarRatingProps {
  value: number
  onChange: (val: number) => void
  size?: number
}

function StarRating({ value, onChange, size = 32 }: StarRatingProps) {
  const [hovered, setHovered] = useState<number>(0)
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[1, 2, 3, 4, 5].map(star => {
        const filled = star <= (hovered || value)
        return (
          <button
            key={star}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: size, lineHeight: 1, padding: 2,
              transition: 'transform 0.15s',
              transform: filled ? 'scale(1.15)' : 'scale(1)',
              filter: filled ? 'none' : 'grayscale(1) opacity(0.3)',
            }}
          >⭐</button>
        )
      })}
    </div>
  )
}

// ── Donut Ring ───────────────────────────────────────────────────────────────
interface DonutProps {
  pct: number
  color: string
  size?: number
  label: string
  sub: string
}

function DonutRing({ pct, color, size = 110, label, sub }: DonutProps) {
  const r   = (size - 16) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={8} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 800, color }}>{label}</div>
        <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 600 }}>{sub}</div>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function FeedbackPage() {
  const navigate = useNavigate();
  const [tab,            setTab]            = useState<FeedbackTab>('submit')
  const [selectedId,     setSelectedId]     = useState<string>(COMPLETED_SESSIONS[0].id)
  const [ratings,        setRatings]        = useState<Ratings>({ overall: 0, speaker: 0, content: 0, venue: 0 })
  const [selectedTags,   setSelectedTags]   = useState<string[]>([])
  const [comment,        setComment]        = useState<string>('')
  const [anonymous,      setAnonymous]      = useState<boolean>(false)
  const [recommend,      setRecommend]      = useState<boolean | null>(null)
  const [submitted,      setSubmitted]      = useState<boolean>(false)
  const [submitting,     setSubmitting]     = useState<boolean>(false)

  const session      = COMPLETED_SESSIONS.find(s => s.id === selectedId)!
  const allRated     = Object.values(ratings).every(r => r > 0)
  const canSubmit    = allRated && !session.hasFeedback

  const toggleTag = (id: string): void => {
    setSelectedTags(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])
  }

  const handleSubmit = async (): Promise<void> => {
    if (!canSubmit) return
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 1600))
    setSubmitting(false)
    setSubmitted(true)
  }

  const avgRating = Object.values(ratings).filter(r => r > 0).reduce((a, b) => a + b, 0) / 4

  // ── SUCCESS STATE ────────────────────────────────────────────────────────
  if (submitted) return (
    <div style={{ minHeight: '100vh', background: '#0d0d1a', color: '#e2e2ff', fontFamily: "'Sora', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <button onClick={() => navigate('/')} style={{ position: 'absolute', top: 20, left: 20, background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)', color: '#a78bfa', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', zIndex: 10 }}>← Back to Home</button>
      <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'rgba(74,222,128,0.12)', border: '2px solid rgba(74,222,128,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, margin: '0 auto 28px', animation: 'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}>🙏</div>
        <h2 style={{ fontSize: 30, fontWeight: 800, marginBottom: 10, background: 'linear-gradient(135deg, #4ade80, #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Thank you for your feedback!
        </h2>
        <p style={{ color: '#7c86a2', marginBottom: 32, fontSize: 15, lineHeight: 1.7 }}>
          Your response has been recorded. It helps us make every session better for the community.
        </p>

        {/* Rating summary card */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 20, padding: '28px', marginBottom: 28, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #4ade80, #22d3ee, #8b5cf6)' }} />
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>YOUR OVERALL RATING</div>
          <div style={{ fontSize: 48, fontWeight: 800, color: '#4ade80', marginBottom: 4, fontFamily: 'monospace' }}>
            {avgRating > 0 ? avgRating.toFixed(1) : '—'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 16 }}>
            {[1,2,3,4,5].map(s => (
              <span key={s} style={{ fontSize: 20, filter: s <= Math.round(avgRating) ? 'none' : 'grayscale(1) opacity(0.25)' }}>⭐</span>
            ))}
          </div>
          <div style={{ fontSize: 13, color: '#7c86a2' }}>{session.title}</div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => { setSubmitted(false); setRatings({ overall: 0, speaker: 0, content: 0, venue: 0 }); setSelectedTags([]); setComment(''); setRecommend(null) }}
            style={{ flex: 1, padding: '12px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#c4b5fd' }}>
            ← Submit Another
          </button>
          <button onClick={() => setTab('analytics')}
            style={{ flex: 1, padding: '12px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', border: 'none', color: '#fff' }}>
            View Analytics →
          </button>
        </div>
      </div>
      <style>{`@keyframes popIn { from { transform: scale(0.5); opacity: 0 } to { transform: scale(1); opacity: 1 } }`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d1a', color: '#e2e2ff', fontFamily: "'Sora', sans-serif", paddingBottom: 80 }}>
      <button onClick={() => navigate('/')} style={{ position: 'absolute', top: 20, left: 20, background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)', color: '#a78bfa', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', zIndex: 10 }}>← Back to Home</button>

      {/* ── Header ── */}
      <div style={{ background: 'linear-gradient(135deg, #1a1a3e 0%, #12122b 100%)', borderBottom: '1px solid rgba(139,92,246,0.2)', padding: '48px 24px 36px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 20, padding: '6px 18px', marginBottom: 20, fontSize: 13, color: '#a78bfa' }}>
          <span>💬</span> Feedback
        </div>
        <h1 style={{ fontSize: 'clamp(26px, 5vw, 44px)', fontWeight: 800, margin: '0 0 10px', background: 'linear-gradient(135deg, #fff 0%, #c4b5fd 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Session Feedback
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 15, margin: '0 auto', maxWidth: 500 }}>
          Share your experience and help us improve every session.
        </p>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 0' }}>

        {/* ── Tab Switch ── */}
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4, width: 'fit-content', marginBottom: 32 }}>
          {(['submit', 'analytics'] as FeedbackTab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '9px 24px', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
              background: tab === t ? 'rgba(139,92,246,0.3)' : 'transparent',
              border:     tab === t ? '1px solid rgba(139,92,246,0.4)' : '1px solid transparent',
              color:      tab === t ? '#c4b5fd' : '#6b7280',
            }}>
              {t === 'submit' ? '💬 Give Feedback' : '📊 Analytics'}
            </button>
          ))}
        </div>

        {/* ══════════════════ SUBMIT TAB ══════════════════ */}
        {tab === 'submit' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,0.8fr)', gap: 24, alignItems: 'start' }}>

            {/* LEFT: form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Session picker */}
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: 20, padding: '24px' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', letterSpacing: 2, marginBottom: 14, textTransform: 'uppercase' }}>Select Session</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {COMPLETED_SESSIONS.map(s => {
                    const active = selectedId === s.id
                    return (
                      <button key={s.id} onClick={() => { if (!s.hasFeedback) setSelectedId(s.id) }}
                        style={{
                          padding: '14px 18px', borderRadius: 14, cursor: s.hasFeedback ? 'default' : 'pointer', textAlign: 'left',
                          background: active ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)',
                          border: active ? '1px solid rgba(139,92,246,0.5)' : '1px solid rgba(255,255,255,0.07)',
                          opacity: s.hasFeedback && !active ? 0.55 : 1, transition: 'all 0.2s',
                        }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: active ? '#c4b5fd' : '#e2e2ff', marginBottom: 4 }}>{s.title}</div>
                            <div style={{ fontSize: 12, color: '#6b7280' }}>👤 {s.speaker} · 📅 {s.date}</div>
                          </div>
                          {s.hasFeedback && (
                            <span style={{ background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 8, padding: '3px 10px', fontSize: 10, fontWeight: 700, color: '#4ade80', flexShrink: 0, marginLeft: 12 }}>✓ Done</span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Star ratings */}
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: 20, padding: '24px' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', letterSpacing: 2, marginBottom: 20, textTransform: 'uppercase' }}>Rate Your Experience</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {(Object.keys(RATING_LABELS) as RatingKey[]).map(key => {
                    const { label, icon } = RATING_LABELS[key]
                    return (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e2ff' }}>{icon} {label}</div>
                          {ratings[key] > 0 && (
                            <div style={{ fontSize: 11, color: '#7c86a2', marginTop: 2 }}>
                              {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][ratings[key]]}
                            </div>
                          )}
                        </div>
                        <StarRating value={ratings[key]} onChange={val => setRatings(prev => ({ ...prev, [key]: val }))} size={28} />
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Tags */}
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: 20, padding: '24px' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase' }}>What described this session? <span style={{ color: '#4b5563', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {TAG_OPTIONS.map(tag => {
                    const active = selectedTags.includes(tag.id)
                    return (
                      <button key={tag.id} onClick={() => toggleTag(tag.id)} style={{
                        padding: '8px 16px', borderRadius: 24, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.18s',
                        background: active ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.05)',
                        border:     active ? '1px solid rgba(139,92,246,0.6)' : '1px solid rgba(255,255,255,0.1)',
                        color:      active ? '#c4b5fd' : '#7c86a2',
                        transform:  active ? 'scale(1.05)' : 'scale(1)',
                      }}>
                        {tag.emoji} {tag.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Comment */}
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: 20, padding: '24px' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', letterSpacing: 2, marginBottom: 14, textTransform: 'uppercase' }}>Additional Comments <span style={{ color: '#4b5563', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></p>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={4}
                  placeholder="Share what stood out, what could be improved, or anything you'd like us to know…"
                  style={{
                    width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.2)',
                    borderRadius: 12, padding: '14px 16px', color: '#e2e2ff', fontSize: 14, outline: 'none',
                    resize: 'vertical', fontFamily: "'Sora', sans-serif", lineHeight: 1.7, boxSizing: 'border-box',
                  }}
                />
                <div style={{ textAlign: 'right', fontSize: 11, color: '#4b5563', marginTop: 6 }}>{comment.length} / 500</div>
              </div>

              {/* Recommend + anonymous */}
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: 20, padding: '24px' }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#e2e2ff', marginBottom: 16 }}>Would you recommend this session to others?</p>
                <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                  {([true, false] as const).map(val => (
                    <button key={String(val)} onClick={() => setRecommend(val)} style={{
                      flex: 1, padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                      background: recommend === val ? (val ? 'rgba(74,222,128,0.18)' : 'rgba(248,113,113,0.18)') : 'rgba(255,255,255,0.04)',
                      border:     recommend === val ? `1px solid ${val ? 'rgba(74,222,128,0.5)' : 'rgba(248,113,113,0.5)'}` : '1px solid rgba(255,255,255,0.1)',
                      color:      recommend === val ? (val ? '#4ade80' : '#f87171') : '#6b7280',
                    }}>
                      {val ? '👍 Yes, definitely' : '👎 Not really'}
                    </button>
                  ))}
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <div onClick={() => setAnonymous(a => !a)} style={{
                    width: 20, height: 20, borderRadius: 6, flexShrink: 0, transition: 'all 0.2s',
                    background: anonymous ? 'rgba(139,92,246,0.6)' : 'rgba(255,255,255,0.08)',
                    border: anonymous ? '1px solid rgba(139,92,246,0.8)' : '1px solid rgba(255,255,255,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
                  }}>{anonymous ? '✓' : ''}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e2ff' }}>Submit anonymously</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Your name won't be attached to this feedback</div>
                  </div>
                </label>
              </div>

              {/* Submit button */}
              <button onClick={handleSubmit} disabled={!canSubmit || submitting} style={{
                width: '100%', padding: '16px', borderRadius: 14, fontSize: 16, fontWeight: 800,
                cursor: !canSubmit || submitting ? 'not-allowed' : 'pointer',
                background: !canSubmit ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                border: 'none', color: !canSubmit ? '#4b5563' : '#fff', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}>
                {submitting
                  ? <><span style={{ display: 'inline-block', width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Submitting…</>
                  : session.hasFeedback
                  ? '✓ Feedback Already Submitted'
                  : !allRated
                  ? 'Rate all categories to submit'
                  : 'Submit Feedback →'}
              </button>
            </div>

            {/* RIGHT: preview card */}
            <div style={{ position: 'sticky', top: 24 }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: 20, padding: '24px', marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase' }}>Live Preview</p>

                {/* avg stars */}
                <div style={{ textAlign: 'center', padding: '20px 0', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 20 }}>
                  <div style={{ fontSize: 52, fontWeight: 800, color: avgRating > 0 ? '#facc15' : '#2d2d4e', marginBottom: 6, fontFamily: 'monospace', transition: 'color 0.3s' }}>
                    {avgRating > 0 ? avgRating.toFixed(1) : '—'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 8 }}>
                    {[1,2,3,4,5].map(s => (
                      <span key={s} style={{ fontSize: 22, filter: s <= Math.round(avgRating) ? 'none' : 'grayscale(1) opacity(0.2)', transition: 'filter 0.2s' }}>⭐</span>
                    ))}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Average across all categories</div>
                </div>

                {/* per-category bars */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(Object.keys(RATING_LABELS) as RatingKey[]).map(key => {
                    const { label, icon } = RATING_LABELS[key]
                    const val = ratings[key]
                    return (
                      <div key={key}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                          <span style={{ color: '#7c86a2' }}>{icon} {label}</span>
                          <span style={{ color: val > 0 ? '#c4b5fd' : '#3d3d5c', fontWeight: 700 }}>{val > 0 ? `${val}/5` : '—'}</span>
                        </div>
                        <div style={{ height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 10 }}>
                          <div style={{ height: '100%', borderRadius: 10, width: `${val * 20}%`, background: 'linear-gradient(90deg, #8b5cf6, #c4b5fd)', transition: 'width 0.4s ease' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* selected tags */}
                {selectedTags.length > 0 && (
                  <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Selected Tags</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {selectedTags.map(id => {
                        const tag = TAG_OPTIONS.find(t => t.id === id)!
                        return (
                          <span key={id} style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 20, padding: '3px 10px', fontSize: 11, color: '#a78bfa' }}>
                            {tag.emoji} {tag.label}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Tips */}
              <div style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: 16, padding: '18px 20px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa', marginBottom: 10 }}>💡 Why feedback matters</div>
                {['Helps speakers improve content', 'Shapes future session formats', 'Influences venue & platform choices', 'Directly impacts your community'].map(tip => (
                  <div key={tip} style={{ fontSize: 12, color: '#6b7280', marginBottom: 6, display: 'flex', gap: 8 }}>
                    <span style={{ color: '#8b5cf6' }}>→</span> {tip}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════ ANALYTICS TAB ══════════════════ */}
        {tab === 'analytics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {ANALYTICS_STATS.map(stat => (
                <div key={stat.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 18, padding: '22px' }}>
                  <div style={{ fontSize: 26, marginBottom: 10 }}>{stat.icon}</div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: stat.color, marginBottom: 2 }}>{stat.value}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e2ff' }}>{stat.label}</div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{stat.sub}</div>
                </div>
              ))}
            </div>

            {/* Middle row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,0.9fr)', gap: 20 }}>

              {/* Rating distribution */}
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: 20, padding: '24px' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Rating Distribution</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {RATING_DISTRIBUTION.map(bar => (
                    <div key={bar.label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ fontSize: 13, color: '#7c86a2', width: 36, flexShrink: 0 }}>{bar.label}</div>
                      <div style={{ flex: 1, height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 10, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${bar.pct}%`, background: bar.color, borderRadius: 10, transition: 'width 0.8s ease' }} />
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280', width: 60, textAlign: 'right', flexShrink: 0 }}>{bar.count} ({bar.pct}%)</div>
                    </div>
                  ))}
                </div>

                {/* Donut rings */}
                <div style={{ display: 'flex', gap: 20, marginTop: 28, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.07)', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <DonutRing pct={82} color="#4ade80" label="82%" sub="Response Rate" />
                  <DonutRing pct={92} color="#c4b5fd" label="4.6" sub="Avg Rating" />
                  <DonutRing pct={87} color="#22d3ee" label="87%" sub="Recommend" />
                </div>
              </div>

              {/* Top tags */}
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: 20, padding: '24px' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Top Tags</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {TOP_TAGS.map((tag, i) => {
                    const pct = Math.round((tag.count / TOP_TAGS[0].count) * 100)
                    return (
                      <div key={tag.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ fontSize: 11, color: '#4b5563', width: 16, textAlign: 'right', flexShrink: 0 }}>#{i + 1}</div>
                        <div style={{ fontSize: 16, flexShrink: 0 }}>{tag.emoji}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                            <span style={{ color: '#e2e2ff', fontWeight: 600 }}>{tag.label}</span>
                            <span style={{ color: '#6b7280' }}>{tag.count}</span>
                          </div>
                          <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 10 }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #8b5cf6, #c4b5fd)', borderRadius: 10 }} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Participant quotes */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: 20, padding: '24px' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>💬 Participant Highlights</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                {RECENT_QUOTES.map((quote, i) => (
                  <div key={i} style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: 14, padding: '18px 20px', position: 'relative' }}>
                    <div style={{ fontSize: 28, color: 'rgba(139,92,246,0.3)', lineHeight: 1, marginBottom: 8, fontFamily: 'Georgia, serif' }}>"</div>
                    <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7, margin: 0 }}>{quote}</p>
                    <div style={{ display: 'flex', gap: 3, marginTop: 12 }}>
                      {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 12 }}>⭐</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin   { to { transform: rotate(360deg) } }
        @keyframes popIn  { from { transform: scale(0.5); opacity: 0 } to { transform: scale(1); opacity: 1 } }
      `}</style>
    </div>
  )
}
