// ── FAQ PAGE — SessionFlow (Backend AI Chatbot + Static FAQs)
import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { chatWithFAQ } from './api'

// ── Static FAQ Data ────────────────────────────────────────────
const FAQ_CATEGORIES = [
  {
    id: 'registration',
    icon: '📋',
    label: 'Registration',
    color: '#8b5cf6',
    faqs: [
      { q: 'How do I register for a session?', a: 'Go to the Register page, browse available sessions, click "Register Now", confirm your details, and receive your unique Participant ID instantly. No email verification needed for mock mode.' },
      { q: 'Can I register for multiple sessions?', a: 'Yes! You can register for as many sessions as you like. Each registration gives you a unique Participant ID. Your dashboard shows all your registrations in one place.' },
      { q: 'What is a Participant ID?', a: 'A Participant ID (format: RF-XXXXXX) is your unique identifier for a session. It\'s used for attendance check-in, certificate generation, and tracking your participation history.' },
      { q: 'Can I cancel my registration?', a: 'Yes, you can cancel up to 24 hours before the session starts. Go to My Dashboard → Your Sessions → Cancel. Your spot will be released for others.' },
    ],
  },
  {
    id: 'attendance',
    icon: '✅',
    label: 'Attendance',
    color: '#22d3ee',
    faqs: [
      { q: 'How does QR code check-in work?', a: 'When you register, a QR code is generated for your session. On the day, show this QR code to the conductor or scan it at the entrance kiosk. Your attendance is marked instantly.' },
      { q: 'What if my QR code doesn\'t scan?', a: 'Use the OTP fallback method — a 6-digit OTP is sent to your registered contact. Enter it on the Attendance page to check in manually. Contact a conductor if issues persist.' },
      { q: 'Is RFID check-in available?', a: 'RFID check-in is available at select physical venues. Your RFID card (issued at the venue desk) links to your Participant ID for seamless entry.' },
      { q: 'Can I mark attendance after the session ends?', a: 'No, attendance can only be marked during the active session window (typically session start time ± 30 minutes). Late check-ins require conductor approval.' },
    ],
  },
  {
    id: 'certificates',
    icon: '🏆',
    label: 'Certificates',
    color: '#fb923c',
    faqs: [
      { q: 'When do I receive my certificate?', a: 'Certificates are auto-generated within 30 minutes after session completion, provided your attendance was marked. You\'ll get a notification on your dashboard.' },
      { q: 'How do I verify a certificate\'s authenticity?', a: 'Every certificate has a unique QR code. Scan it to be redirected to our verification portal which confirms the name, session, date, and issuing organisation in real-time.' },
      { q: 'Can I download my certificate as a PDF?', a: 'Yes! Go to Certificates page → select the session → click Download PDF. Certificates are A4 landscape format, print-ready at 300 DPI.' },
      { q: 'What if my name is wrong on the certificate?', a: 'Contact the event admin within 7 days of issue. Go to My Dashboard → Certificates → Report Issue. Corrections are processed within 48 hours.' },
    ],
  },
  {
    id: 'sessions',
    icon: '📅',
    label: 'Sessions',
    color: '#4ade80',
    faqs: [
      { q: 'What is the difference between Online, Offline, and Hybrid sessions?', a: 'Online sessions are fully virtual (Zoom/Teams link sent post-registration). Offline sessions are in-person at listed venues. Hybrid sessions offer both options — you choose your mode at registration.' },
      { q: 'How do I access session materials?', a: 'Go to the Content page after the session. PPTs, notes, and recordings are uploaded within 24 hours of the session ending. Access is restricted to registered participants.' },
      { q: 'Will sessions be recorded?', a: 'Most online and hybrid sessions are recorded (subject to speaker consent). Recordings are available on the Content page for 90 days post-session.' },
      { q: 'How do I get reminders for upcoming sessions?', a: 'Reminders are automatically sent 24 hours and 1 hour before your registered sessions via email and/or WhatsApp (based on your notification preferences in Settings).' },
    ],
  },
]

// ── Suggested prompts shown in chat ───────────────────────────
const SUGGESTED = [
  'How do I get my certificate?',
  'What is a Participant ID?',
  'How does QR check-in work?',
  'Can I attend online sessions?',
  'How to cancel my registration?',
]

// ── Message type ───────────────────────────────────────────────
interface Message {
  role: 'user' | 'assistant'
  content: string
  ts: number
}

const getTimestamp = () => Date.now()

export default function FAQPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [openFaq, setOpenFaq] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! 👋 I'm the SessionFlow AI assistant. Ask me anything about registrations, attendance, certificates, or sessions — I'm here to help!",
      ts: getTimestamp(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (chatOpen) {
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }, [messages, chatOpen])

  // Filter FAQs across all categories by search
  const allFaqs = FAQ_CATEGORIES.flatMap(c =>
    c.faqs.map(f => ({ ...f, categoryId: c.id, categoryLabel: c.label, categoryColor: c.color, categoryIcon: c.icon }))
  )
  const searchResults = search.trim().length > 1
    ? allFaqs.filter(f =>
        f.q.toLowerCase().includes(search.toLowerCase()) ||
        f.a.toLowerCase().includes(search.toLowerCase())
      )
    : []

  const displayedCategories = activeCategory
    ? FAQ_CATEGORIES.filter(c => c.id === activeCategory)
    : FAQ_CATEGORIES

  const getMockResponse = (text: string): string => {
    const q = text.toLowerCase()
    if (q.includes('register')) return "You can register for sessions on the 'Register' page! Just browse, pick one, and click 'Register Now'. Your Participant ID is issued immediately."
    if (q.includes('certificate')) return "Certificates are available on the 'Certificates' page after you attend a session. You can download them as print-ready PDFs."
    if (q.includes('attendance') || q.includes('check-in')) return "Mark your attendance on the 'Attendance' page during the live session window using your QR code or OTP fallback."
    if (q.includes('schedule')) return "The 'Schedule' page displays all upcoming NGO workshops, dates, and speaker details in real-time."
    if (q.includes('admin')) return "Event organizers can manage sessions and attendees through the 'Event Admin' panel."
    if (q.includes('hi') || q.includes('hello')) return "Hello! I'm your SessionFlow AI. How can I help you with our platform today?"
    if (q.includes('thank')) return "You're very welcome! Let me know if you need anything else."
    return "I couldn't reach the AI backend, but I can help with 'registration', 'certificates', or 'schedule'. Try asking about those!"
  }

  // ── Send message to Backend API ──────────────────────────────
  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: Message = { role: 'user', content: text, ts: getTimestamp() }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setLoading(true)

    try {
      const response = await chatWithFAQ(updated.map(m => ({ role: m.role, content: m.content })))
      const reply = response.reply || 'Sorry, I couldn\'t process that. Please try again.'
      setMessages(prev => [...prev, { role: 'assistant', content: reply, ts: Date.now() }])
    } catch (error) {
      console.error('Chat error:', error)
      // Fallback to Smart Mock
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'assistant', content: getMockResponse(text), ts: Date.now() }])
      }, 600)
    }
    setLoading(false)
  }

  const handleSend = () => sendMessage(input)
  const handleKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }

  const fmtTime = (ts: number) => new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d1a', color: '#e2e2ff', fontFamily: "'Sora', sans-serif", paddingBottom: 100 }}>
      <button onClick={() => navigate('/')} style={{ position: 'absolute', top: 20, left: 20, background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)', color: '#a78bfa', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', zIndex: 10 }}>← Back to Home</button>

      {/* ── Header ── */}
      <div style={{ background: 'linear-gradient(135deg, #1a1a3e 0%, #12122b 100%)', borderBottom: '1px solid rgba(139,92,246,0.2)', padding: '48px 24px 36px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 20, padding: '6px 18px', marginBottom: 20, fontSize: 13, color: '#a78bfa' }}>
          <span>💬</span> Help & FAQ
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 800, margin: '0 0 12px', background: 'linear-gradient(135deg, #fff 0%, #c4b5fd 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          How can we help you?
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 16, margin: '0 auto 28px', maxWidth: 520 }}>
          Browse common questions or ask our AI assistant anything about SessionFlow.
        </p>

        {/* Search */}
        <div style={{ position: 'relative', maxWidth: 560, margin: '0 auto' }}>
          <span style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#6b7280' }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search questions..."
            style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 16, padding: '16px 18px 16px 50px', color: '#e2e2ff', fontSize: 15, outline: 'none', boxSizing: 'border-box', fontFamily: "'Sora', sans-serif" }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 18 }}>✕</button>
          )}
        </div>

        {/* Search results */}
        {searchResults.length > 0 && (
          <div style={{ maxWidth: 560, margin: '12px auto 0', background: 'rgba(13,13,26,0.95)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 14, overflow: 'hidden', textAlign: 'left' }}>
            {searchResults.slice(0, 5).map((f, i) => (
              <div key={i}
                onClick={() => { setActiveCategory(f.categoryId); setOpenFaq(f.q); setSearch(''); setTimeout(() => document.getElementById('faq-' + f.q.slice(0, 20))?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100) }}
                style={{ padding: '14px 18px', borderBottom: i < searchResults.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(139,92,246,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ fontSize: 13, color: '#e2e2ff', fontWeight: 600, marginBottom: 3 }}>{f.q}</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>{f.categoryIcon} {f.categoryLabel}</div>
              </div>
            ))}
          </div>
        )}
        {search.trim().length > 1 && searchResults.length === 0 && (
          <div style={{ maxWidth: 560, margin: '12px auto 0', padding: '14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 13, color: '#6b7280', textAlign: 'center' }}>
            No results for "{search}" — try our AI assistant below!
          </div>
        )}
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 0' }}>

        {/* ── Category Filter Pills ── */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 32 }}>
          <button
            onClick={() => setActiveCategory(null)}
            style={{ padding: '9px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: !activeCategory ? '1px solid #8b5cf6' : '1px solid rgba(255,255,255,0.1)', background: !activeCategory ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.04)', color: !activeCategory ? '#c4b5fd' : '#94a3b8', transition: 'all 0.2s', fontFamily: "'Sora', sans-serif" }}
          >
            All Topics
          </button>
          {FAQ_CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setActiveCategory(activeCategory === c.id ? null : c.id)}
              style={{ padding: '9px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: activeCategory === c.id ? `1px solid ${c.color}` : '1px solid rgba(255,255,255,0.1)', background: activeCategory === c.id ? `${c.color}22` : 'rgba(255,255,255,0.04)', color: activeCategory === c.id ? c.color : '#94a3b8', transition: 'all 0.2s', fontFamily: "'Sora', sans-serif'" }}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        {/* ── FAQ Sections ── */}
        {displayedCategories.map(cat => (
          <div key={cat.id} style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 22 }}>{cat.icon}</span>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: cat.color }}>{cat.label}</h2>
              <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${cat.color}44, transparent)` }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cat.faqs.map(faq => {
                const key = faq.q
                const isOpen = openFaq === key
                return (
                  <div key={key} id={'faq-' + key.slice(0, 20)}
                    style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${isOpen ? cat.color + '66' : 'rgba(255,255,255,0.07)'}`, borderRadius: 14, overflow: 'hidden', transition: 'all 0.2s' }}>
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : key)}
                      style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 16, fontFamily: "'Sora', sans-serif'" }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 700, color: isOpen ? '#e2e2ff' : '#c4b5fd', lineHeight: 1.4 }}>{faq.q}</span>
                      <span style={{ fontSize: 18, color: cat.color, flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s', display: 'block' }}>▾</span>
                    </button>
                    {isOpen && (
                      <div style={{ padding: '0 22px 20px', fontSize: 14, color: '#94a3b8', lineHeight: 1.8, borderTop: `1px solid ${cat.color}22`, paddingTop: 16 }}>
                        {faq.a}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* ── Still need help CTA ── */}
        <div style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(34,211,238,0.08) 100%)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 20, padding: '32px', textAlign: 'center', marginTop: 12 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🤖</div>
          <h3 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px', color: '#e2e2ff' }}>Didn't find your answer?</h3>
          <p style={{ color: '#7c86a2', fontSize: 14, margin: '0 0 20px' }}>Our AI assistant is available 24/7 to answer any question about SessionFlow.</p>
          <button
            onClick={() => { setChatOpen(true); setTimeout(() => inputRef.current?.focus(), 300) }}
            style={{ padding: '13px 28px', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', border: 'none', color: '#fff', fontFamily: "'Sora', sans-serif'" }}
          >
            Chat with AI Assistant →
          </button>
        </div>
      </div>

      {/* ── Floating Chat Button ── */}
      {!chatOpen && (
        <button
          onClick={() => { setChatOpen(true); setTimeout(() => inputRef.current?.focus(), 300) }}
          style={{ position: 'fixed', bottom: 28, right: 28, width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', border: 'none', cursor: 'pointer', fontSize: 26, boxShadow: '0 8px 32px rgba(139,92,246,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse 2s infinite' }}
        >
          💬
        </button>
      )}

      {/* ── Chat Panel ── */}
      {chatOpen && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, width: 'min(420px, calc(100vw - 48px))', height: 'min(560px, calc(100vh - 100px))', background: '#12122b', border: '1px solid rgba(139,92,246,0.4)', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Chat Header */}
          <div style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(109,40,217,0.3))', borderBottom: '1px solid rgba(139,92,246,0.25)', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🤖</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e2ff' }}>SessionFlow AI</div>
              <div style={{ fontSize: 11, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} /> Online
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#94a3b8', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12, scrollbarWidth: 'thin', scrollbarColor: 'rgba(139,92,246,0.3) transparent' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 8, alignItems: 'flex-end' }}>
                {msg.role === 'assistant' && (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>🤖</div>
                )}
                <div style={{ maxWidth: '78%' }}>
                  <div style={{ padding: '11px 14px', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: msg.role === 'user' ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)' : 'rgba(255,255,255,0.07)', border: msg.role === 'assistant' ? '1px solid rgba(139,92,246,0.2)' : 'none', fontSize: 13, color: '#e2e2ff', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {msg.content}
                  </div>
                  <div style={{ fontSize: 10, color: '#4b5563', marginTop: 3, textAlign: msg.role === 'user' ? 'right' : 'left', paddingLeft: 4 }}>{fmtTime(msg.ts)}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>🤖</div>
                <div style={{ padding: '14px 18px', borderRadius: '16px 16px 16px 4px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(139,92,246,0.2)' }}>
                  <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                    {[0, 1, 2].map(j => (
                      <div key={j} style={{ width: 7, height: 7, borderRadius: '50%', background: '#8b5cf6', animation: `bounce 1.2s ${j * 0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Suggested prompts (show only if first message) */}
          {messages.length === 1 && (
            <div style={{ padding: '0 12px 8px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {SUGGESTED.map(s => (
                <button key={s} onClick={() => sendMessage(s)} style={{ padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', color: '#a78bfa', fontFamily: "'Sora', sans-serif'", whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(139,92,246,0.2)', display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask anything..."
              disabled={loading}
              style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 12, padding: '11px 14px', color: '#e2e2ff', fontSize: 13, outline: 'none', fontFamily: "'Sora', sans-serif'" }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              style={{ width: 42, height: 42, borderRadius: 12, background: input.trim() ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)' : 'rgba(255,255,255,0.06)', border: 'none', cursor: input.trim() ? 'pointer' : 'not-allowed', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { box-shadow: 0 8px 32px rgba(139,92,246,0.5) } 50% { box-shadow: 0 8px 48px rgba(139,92,246,0.8) } }
        @keyframes bounce { 0%, 60%, 100% { transform: translateY(0) } 30% { transform: translateY(-6px) } }
        input::placeholder { color: #4b5563; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.3); border-radius: 10px; }
      `}</style>
    </div>
  )
}
