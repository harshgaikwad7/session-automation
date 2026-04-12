import { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, NavLink, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { chatWithFAQ } from './api'
import RegisterPage from './RegisterPage'
import SchedulePage from './SchedulePage'
import AttendancePage from './AttendancePage'
import CertificatesPage from './CertificatesPage'
import DashboardPage from './DashboardPage'
import FeedbackPage from './FeedbackPage'
import ContentPage from './ContentPage'
import EventAdminPage from './EventAdminPage'
import QuizPage from './QuizPage'
import FAQPage from './FAQPage'
import AuthPage from './AuthPage'

// ── TYPES ──────────────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant'
  content: string
  ts: number
}

// ── Styles ──────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100vh", background: "#2a1b5b", color: "#E2E0FF",
    fontFamily: "'Sora', 'DM Sans', system-ui, sans-serif",
    overflowX: "hidden", position: "relative",
  },
  bgGlow1: { position: "fixed", top: "-200px", left: "-200px", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(102,94,254,0.18) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 },
  bgGlow2: { position: "fixed", bottom: "-200px", right: "-200px", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 },
  bgGrid: { position: "fixed", inset: 0, backgroundImage: `linear-gradient(rgba(108,99,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(108,99,255,0.04) 1px, transparent 1px)`, backgroundSize: "40px 40px", pointerEvents: "none", zIndex: 0 },
  nav: { position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(21,19,43,0.8)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.06)", transition: "all 0.3s ease" },
  navScrolled: { background: "rgba(13,11,30,0.95)", boxShadow: "0 4px 30px rgba(0,0,0,0.4)" },
  navInner: { maxWidth: "1300px", margin: "0 auto", padding: "0 24px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  logo: { display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", flexShrink: 0 },
  logoIcon: { width: "32px", height: "32px", background: "rgba(108,99,255,0.2)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(108,99,255,0.4)" },
  logoText: { fontWeight: "700", fontSize: "1.1rem", background: "linear-gradient(135deg, #fff 0%, #A78BFA 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.02em" },
  navLinks: { display: "flex", alignItems: "center", gap: "2px", flexWrap: "nowrap", overflowX: "auto", flex: 1, justifyContent: "center" },
  navLink: { background: "none", border: "none", cursor: "pointer", color: "rgba(226,224,255,0.6)", fontSize: "0.78rem", padding: "6px 10px", borderRadius: "6px", transition: "all 0.2s", whiteSpace: "nowrap", fontFamily: "inherit", textDecoration: "none" },
  navLinkActive: { background: "rgba(108,99,255,0.25)", color: "#fff", border: "1px solid rgba(108,99,255,0.4)" },
  hamburger: { display: "none", flexDirection: "column", gap: "5px", background: "none", border: "none", cursor: "pointer", padding: "4px" },
  bar: { display: "block", width: "22px", height: "2px", background: "#A78BFA", borderRadius: "2px", transition: "all 0.3s" },
  bar1Open: { transform: "translateY(7px) rotate(45deg)" },
  bar2Open: { opacity: 0 },
  bar3Open: { transform: "translateY(-7px) rotate(-45deg)" },
  mobileMenu: { display: "flex", flexDirection: "column", background: "rgba(13,11,30,0.98)", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "12px 24px" },
  mobileLink: { color: "rgba(226,224,255,0.7)", fontSize: "0.9rem", padding: "10px 0", textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.04)", fontFamily: "inherit", textDecoration: "none", display: "block" },
  mobileLinkActive: { color: "#A78BFA", fontWeight: "600" },
  hero: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", gap: "60px", flexWrap: "wrap", padding: "120px 24px 80px", maxWidth: "1300px", margin: "0 auto", position: "relative", zIndex: 1 },
  heroContent: { flex: "1 1 480px", maxWidth: "580px" },
  heroBadge: { display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(108,99,255,0.15)", border: "1px solid rgba(108,99,255,0.3)", borderRadius: "999px", padding: "6px 16px", fontSize: "0.75rem", color: "#A78BFA", marginBottom: "28px", letterSpacing: "0.04em" },
  heroBadgeDot: { width: "6px", height: "6px", background: "#6C63FF", borderRadius: "50%", boxShadow: "0 0 6px #6C63FF", animation: "pulse 2s infinite", display: "inline-block" },
  heroTitle: { fontSize: "clamp(2.8rem, 6vw, 4.5rem)", fontWeight: "800", lineHeight: "1.1", marginBottom: "20px", letterSpacing: "-0.03em", color: "#fff" },
  heroTitleAccent: { background: "linear-gradient(135deg, #6C63FF 0%, #A78BFA 50%, #F472B6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  heroSubtitle: { fontSize: "1.05rem", lineHeight: "1.7", color: "rgba(226,224,255,0.65)", marginBottom: "36px" },
  heroButtons: { display: "flex", gap: "14px", flexWrap: "wrap" },
  btnPrimary: { background: "linear-gradient(135deg, #6C63FF, #A78BFA)", color: "#fff", border: "none", cursor: "pointer", padding: "14px 28px", borderRadius: "12px", fontSize: "0.95rem", fontWeight: "600", fontFamily: "inherit", boxShadow: "0 8px 24px rgba(108,99,255,0.4)", transition: "transform 0.2s" },
  btnSecondary: { background: "transparent", color: "#A78BFA", border: "1px solid rgba(108,99,255,0.4)", cursor: "pointer", padding: "14px 28px", borderRadius: "12px", fontSize: "0.95rem", fontWeight: "600", fontFamily: "inherit", transition: "background 0.2s" },
  heroCard: { flex: "1 1 340px", maxWidth: "420px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", backdropFilter: "blur(12px)", overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(108,99,255,0.1)" },
  heroCardHeader: { display: "flex", alignItems: "center", gap: "10px", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(108,99,255,0.08)" },
  heroCardDots: { display: "flex", gap: "6px" },
  dot: { width: "10px", height: "10px", borderRadius: "50%" },
  heroCardTitle: { fontSize: "0.8rem", color: "rgba(226,224,255,0.6)", fontWeight: "600" },
  heroCardBody: { padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px" },
  sessionItem: { display: "flex", alignItems: "center", gap: "14px", padding: "12px 14px", borderRadius: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" },
  sessionTime: { fontSize: "0.72rem", color: "#A78BFA", fontWeight: "700", minWidth: "52px" },
  sessionName: { fontSize: "0.82rem", fontWeight: "600", color: "#fff", marginBottom: "2px" },
  sessionMeta: { fontSize: "0.7rem", color: "rgba(226,224,255,0.45)" },
  sessionLive: { marginLeft: "auto", fontSize: "0.65rem", fontWeight: "700", background: "rgba(52,211,153,0.2)", color: "#34D399", border: "1px solid rgba(52,211,153,0.3)", borderRadius: "999px", padding: "3px 9px", whiteSpace: "nowrap" },
  sessionUpcoming: { marginLeft: "auto", fontSize: "0.65rem", fontWeight: "700", background: "rgba(108,99,255,0.15)", color: "#A78BFA", border: "1px solid rgba(108,99,255,0.25)", borderRadius: "999px", padding: "3px 9px", whiteSpace: "nowrap" },
  statsSection: { display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "20px", padding: "0 24px 80px", maxWidth: "1000px", margin: "0 auto", position: "relative", zIndex: 1 },
  statCard: { flex: "1 1 160px", textAlign: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "28px 20px", transition: "transform 0.3s", cursor: "default" },
  statValue: { fontSize: "2.2rem", fontWeight: "800", background: "linear-gradient(135deg, #6C63FF, #A78BFA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "6px" },
  statLabel: { fontSize: "0.82rem", color: "rgba(226,224,255,0.55)" },
  featuresSection: { padding: "20px 24px 80px", maxWidth: "1300px", margin: "0 auto", position: "relative", zIndex: 1 },
  sectionHeader: { textAlign: "center", marginBottom: "48px" },
  sectionTitle: { fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: "800", color: "#fff", marginBottom: "12px", letterSpacing: "-0.02em" },
  sectionSubtitle: { fontSize: "1rem", color: "rgba(226,224,255,0.55)", lineHeight: "1.6" },
  featuresGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "20px" },
  featureCard: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "18px", padding: "28px 24px", cursor: "pointer", transition: "all 0.3s ease", position: "relative", overflow: "hidden" },
  featureIcon: { width: "52px", height: "52px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "18px" },
  featureTitle: { fontSize: "1rem", fontWeight: "700", color: "#fff", marginBottom: "8px" },
  featureDesc: { fontSize: "0.83rem", color: "rgba(226,224,255,0.55)", lineHeight: "1.6" },
  featureArrow: { fontSize: "1.2rem", fontWeight: "700", marginTop: "16px", display: "block", transition: "transform 0.2s" },
  howSection: { padding: "20px 24px 80px", maxWidth: "1000px", margin: "0 auto", position: "relative", zIndex: 1 },
  stepsRow: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0", justifyContent: "center" },
  stepCard: { flex: "1 1 220px", maxWidth: "280px", textAlign: "center", padding: "32px 24px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "18px", position: "relative" },
  stepNumber: { fontSize: "3rem", fontWeight: "900", background: "linear-gradient(135deg, rgba(108,99,255,0.3), rgba(167,139,250,0.2))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: "1", marginBottom: "12px" },
  stepIcon: { fontSize: "2rem", marginBottom: "12px" },
  stepTitle: { fontSize: "1.1rem", fontWeight: "700", color: "#fff", marginBottom: "8px" },
  stepDesc: { fontSize: "0.83rem", color: "rgba(226,224,255,0.55)", lineHeight: "1.6" },
  stepArrow: { position: "absolute", right: "-20px", top: "50%", transform: "translateY(-50%)", fontSize: "1.5rem", color: "#6C63FF", zIndex: 2 },
  helpSection: { padding: "20px 24px 80px", maxWidth: "800px", margin: "0 auto", position: "relative", zIndex: 1, textAlign: "center" },
  helpCard: { background: "rgba(108,99,255,0.08)", border: "1px solid rgba(108,99,255,0.25)", borderRadius: "24px", padding: "60px 40px", position: "relative", overflow: "hidden" },
  helpGlow: { position: "absolute", top: "-60px", left: "50%", transform: "translateX(-50%)", width: "300px", height: "200px", background: "radial-gradient(circle, rgba(108,99,255,0.25), transparent 70%)", pointerEvents: "none" },
  helpTitle: { fontSize: "2rem", fontWeight: "800", color: "#fff", marginBottom: "12px" },
  helpSubtitle: { fontSize: "1rem", color: "rgba(226,224,255,0.6)", marginBottom: "28px", lineHeight: "1.6" },
  footer: { borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.3)", position: "relative", zIndex: 1 },
  footerInner: { maxWidth: "1300px", margin: "0 auto", padding: "28px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" },
  footerText: { fontSize: "0.8rem", color: "rgba(226,224,255,0.35)" },
  footerLinks: { display: "flex", gap: "8px" },
  footerLink: { background: "none", border: "none", cursor: "pointer", color: "rgba(226,224,255,0.45)", fontSize: "0.8rem", padding: "4px 8px", fontFamily: "inherit", transition: "color 0.2s" },
  chatBubble: { position: "fixed", bottom: "28px", right: "28px", width: "54px", height: "54px", borderRadius: "50%", background: "linear-gradient(135deg, #6C63FF, #A78BFA)", border: "none", cursor: "pointer", zIndex: 9999, fontSize: "1.4rem", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(108,99,255,0.5)", transition: "transform 0.2s" },
  chatBubbleOpen: { transform: "rotate(90deg)" },
  chatPanel: { position: "fixed", bottom: "94px", right: "28px", width: "320px", borderRadius: "18px", background: "#13102A", border: "1px solid rgba(108,99,255,0.3)", boxShadow: "0 20px 60px rgba(0,0,0,0.6)", zIndex: 9999, overflow: "hidden", display: "flex", flexDirection: "column" },
  chatHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "rgba(108,99,255,0.15)", borderBottom: "1px solid rgba(108,99,255,0.2)", fontSize: "0.85rem", fontWeight: "600", color: "#fff" },
  chatClose: { background: "none", border: "none", cursor: "pointer", color: "rgba(226,224,255,0.5)", fontSize: "0.9rem" },
  chatBody: { padding: "18px", flex: 1 },
  chatMsg: { fontSize: "0.83rem", color: "rgba(226,224,255,0.7)", lineHeight: "1.6", marginBottom: "14px", background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "10px 12px" },
  chatOptions: { display: "flex", flexDirection: "column", gap: "8px" },
  chatOpt: { background: "rgba(108,99,255,0.12)", border: "1px solid rgba(108,99,255,0.25)", borderRadius: "8px", padding: "9px 12px", color: "#A78BFA", fontSize: "0.8rem", fontWeight: "500", cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "background 0.2s" },
};

const FEATURES = [
  { icon: "🗓️", title: "Schedule",     desc: "Real-time session schedule, speakers & venue",   color: "#6C63FF" },
  { icon: "📋", title: "Register",     desc: "One-click registration with confirmation",         color: "#A78BFA" },
  { icon: "✅", title: "Attendance",   desc: "QR, OTP & RFID check-in options",                 color: "#34D399" },
  { icon: "📊", title: "My Dashboard", desc: "Certificates, reminders & your sessions",          color: "#60A5FA" },
  { icon: "🏆", title: "Certificates", desc: "View & download your certificates",                color: "#FBBF24" },
  { icon: "💬", title: "Feedback",     desc: "Post-session feedback & analytics",                color: "#F472B6" },
  { icon: "📝", title: "Quiz",         desc: "Auto quizzes & instant results",                   color: "#FB923C" },
  { icon: "📁", title: "Content",      desc: "PPTs, notes & recordings",                         color: "#FBBF24" },
  { icon: "❓", title: "FAQ",          desc: "Answers & chatbot support",                        color: "#F87171" },
];

const STATS = [
  { value: "500+", label: "Sessions Hosted" },
  { value: "10K+", label: "Participants" },
  { value: "98%",  label: "Satisfaction Rate" },
  { value: "50+",  label: "NGO Partners" },
];

// ── Auth guard ─────────────────────────────────────────────────
function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = localStorage.getItem('sf_user')
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RedirectIfAuthed({ children }: { children: React.ReactNode }) {
  const user = localStorage.getItem('sf_user')
  if (user) return <Navigate to="/home" replace />
  return <>{children}</>
}

// ── ChatAssistant ──────────────────────────────────────────────
const ChatAssistant = () => {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const initialMessage: Message = {
    role: 'assistant',
    content: "Hi! 👋 I'm your SessionFlow assistant. Ask me anything about registration, certificates, or the schedule!",
    ts: Date.now()
  }
  const [messages, setMessages] = useState<Message[]>([initialMessage])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // ✅ FIX: scrollToBottom is now properly defined as a function
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (open) setTimeout(scrollToBottom, 50)
  }, [messages, open])

  const getMockResponse = (text: string): string => {
    const q = text.toLowerCase()
    if (q.includes('register')) return "To register, go to the 'Register' page, pick a session, and click 'Register Now'. You'll get a Participant ID instantly!"
    if (q.includes('certificate')) return "Certificates are auto-generated after you attend a session. You can view and download them on the 'Certificates' page."
    if (q.includes('attendance') || q.includes('check-in')) return "Mark your attendance on the 'Attendance' page during the session using your QR code or a backup OTP."
    if (q.includes('schedule')) return "The 'Schedule' page lists all upcoming NGO workshops, speakers, and timings."
    if (q.includes('admin')) return "The Event Admin panel (/event-admin) is for organizers to manage participants and sessions."
    if (q.includes('hi') || q.includes('hello')) return "Hello! How can I help you with SessionFlow today?"
    if (q.includes('thank')) return "You're welcome! Happy to help."
    return "I recommend checking the FAQ page or asking specifically about 'registration', 'certificates', or 'schedule'."
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const userMsg: Message = { role: 'user', content: input, ts: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await chatWithFAQ([...messages, userMsg].map(m => ({ role: m.role, content: m.content })))
      setMessages(prev => [...prev, { role: 'assistant', content: res.reply || "I'm thinking...", ts: Date.now() }])
    } catch {
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'assistant', content: getMockResponse(userMsg.content), ts: Date.now() }])
        setLoading(false)
      }, 700)
      return
    }
    setLoading(false)
  }

  if (location.pathname === '/login') return null

  return (
    <>
      <button
        style={{ ...styles.chatBubble, ...(open ? styles.chatBubbleOpen : {}) }}
        onClick={() => setOpen(!open)}
        title="Help"
      >
        {open ? "✕" : "💬"}
      </button>

      {open && (
        <div style={styles.chatPanel}>
          <div style={styles.chatHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🤖</div>
              <span>SessionFlow Assistant</span>
            </div>
            <button style={styles.chatClose} onClick={() => setOpen(false)}>✕</button>
          </div>

          <div style={{ ...styles.chatBody, height: 350, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, scrollbarWidth: 'thin' }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                background: m.role === 'user' ? 'linear-gradient(135deg, #6d28d9, #4c1d95)' : 'rgba(255,255,255,0.06)',
                padding: '10px 14px',
                borderRadius: m.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                fontSize: '0.82rem',
                color: '#e2e2ff',
                maxWidth: '85%',
                lineHeight: 1.5,
                border: m.role === 'assistant' ? '1px solid rgba(139,92,246,0.15)' : 'none'
              }}>
                {m.content}
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.04)', padding: '12px 16px', borderRadius: '14px', display: 'flex', gap: 5 }}>
                {[0, 0.2, 0.4].map(delay => (
                  <span key={delay} style={{ width: 6, height: 6, borderRadius: '50%', background: '#8b5cf6', animation: `bounce 1s ${delay}s infinite` }} />
                ))}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div style={{ padding: '14px', borderTop: '1px solid rgba(139,92,246,0.2)', display: 'flex', gap: 10 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
              style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 10, padding: '10px 14px', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
            />
            <button onClick={handleSend} style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: '#fff', border: 'none', borderRadius: 10, width: 42, height: 42, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>➤</button>
          </div>
        </div>
      )}
    </>
  )
}

// ── Home ───────────────────────────────────────────────────────
const Home = () => {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [visible, setVisible] = useState(false)

  const storedUser = localStorage.getItem('sf_user')
  const userName = storedUser ? (() => { try { return JSON.parse(storedUser)?.name?.split(' ')[0] || '' } catch { return '' } })() : ''

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100)
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => {
      clearTimeout(timer)
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('sf_user')
    navigate('/login')
  }

  return (
    <div style={styles.root}>
      <style>{`
        @keyframes pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.5);opacity:0.5} }
        @keyframes liveDot { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes bounce { 0%, 60%, 100% { transform: translateY(0) } 30% { transform: translateY(-6px) } }
      `}</style>

      <div style={styles.bgGlow1} />
      <div style={styles.bgGlow2} />
      <div style={styles.bgGrid} />

      {/* NAVBAR */}
      <nav style={{ ...styles.nav, ...(scrolled ? styles.navScrolled : {}) }}>
        <div style={styles.navInner}>
          <div style={styles.logo}>
            <div style={styles.logoIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#A78BFA" strokeWidth="2" />
                <path d="M12 6v6l4 2" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <span style={styles.logoText}>SessionFlow</span>
          </div>

          <div style={styles.navLinks}>
            {[
              { to: '/home',         label: 'Home' },
              { to: '/schedule',     label: 'Schedule' },
              { to: '/register',     label: 'Register' },
              { to: '/attendance',   label: 'Attendance' },
              { to: '/dashboard',    label: 'My Dashboard' },
              { to: '/certificates', label: 'Certificates' },
              { to: '/feedback',     label: 'Feedback' },
              { to: '/quiz',         label: 'Quiz' },
              { to: '/content',      label: 'Content' },
              { to: '/faq',          label: 'FAQ' },
              { to: '/event-admin',  label: 'Event Admin' },
            ].map(({ to, label }) => (
              <NavLink key={to} to={to}
                style={({ isActive }) => ({ ...styles.navLink, ...(isActive ? styles.navLinkActive : {}) })}>
                {label}
              </NavLink>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {userName && (
              <span style={{ fontSize: 12, color: '#a78bfa', fontWeight: 600 }}>
                👋 {userName}
              </span>
            )}
            <button onClick={handleLogout}
              style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>
              Logout
            </button>
          </div>

          <button style={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)}>
            <span style={{ ...styles.bar, ...(menuOpen ? styles.bar1Open : {}) }} />
            <span style={{ ...styles.bar, ...(menuOpen ? styles.bar2Open : {}) }} />
            <span style={{ ...styles.bar, ...(menuOpen ? styles.bar3Open : {}) }} />
          </button>
        </div>

        {menuOpen && (
          <div style={styles.mobileMenu}>
            {[
              ['/home','Home'],['/schedule','Schedule'],['/register','Register'],
              ['/attendance','Attendance'],['/dashboard','My Dashboard'],
              ['/certificates','Certificates'],['/feedback','Feedback'],
              ['/quiz','Quiz'],['/content','Content'],['/faq','FAQ'],['/event-admin','Event Admin'],
            ].map(([to, label]) => (
              <NavLink key={to} to={to}
                style={({ isActive }) => ({ ...styles.mobileLink, ...(isActive ? styles.mobileLinkActive : {}) })}
                onClick={() => setMenuOpen(false)}>
                {label}
              </NavLink>
            ))}
            <button onClick={handleLogout}
              style={{ ...styles.mobileLink, color: '#f87171', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
              🚪 Logout
            </button>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section style={styles.hero}>
        <div style={{
          ...styles.heroContent,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(30px)",
          transition: "all 0.8s ease",
        }}>
          <div style={styles.heroBadge}>
            <span style={styles.heroBadgeDot} />
            Renovation Foundation — NGO Session Platform
          </div>
          <h1 style={styles.heroTitle}>
            Session{" "}
            <span style={styles.heroTitleAccent}>Automation</span>
            <br />
            Platform
          </h1>
          <p style={styles.heroSubtitle}>
            Register, attend, get certificates, and engage — all in one place.
            <br />
            Powered by AI for reminders, quizzes, and support.
          </p>
          <div style={styles.heroButtons}>
            <button style={styles.btnPrimary} onClick={() => navigate('/register')}
              onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.05)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}>
              🚀 Get Started
            </button>
            <button style={styles.btnSecondary} onClick={() => navigate('/schedule')}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(108,99,255,0.15)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              📅 View Schedule
            </button>
          </div>
        </div>

        <div style={{
          ...styles.heroCard,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0) rotate(-2deg)" : "translateY(40px) rotate(-2deg)",
          transition: "all 1s ease 0.3s",
        }}>
          <div style={styles.heroCardHeader}>
            <div style={styles.heroCardDots}>
              <span style={{ ...styles.dot, background: "#F87171" }} />
              <span style={{ ...styles.dot, background: "#FBBF24" }} />
              <span style={{ ...styles.dot, background: "#34D399" }} />
            </div>
            <span style={styles.heroCardTitle}>Next Session</span>
          </div>
          <div style={styles.heroCardBody}>
            {[
              { time: "10:00 AM", name: "Community Leadership Workshop",  meta: "📍 Hall A • 42 registered",  badge: "LIVE", badgeStyle: styles.sessionLive },
              { time: "2:00 PM",  name: "Youth Empowerment Summit",        meta: "📍 Hall B • 87 registered",  badge: "Soon", badgeStyle: styles.sessionUpcoming },
              { time: "5:00 PM",  name: "Digital Skills Training",         meta: "📍 Online • 120 registered", badge: "Soon", badgeStyle: styles.sessionUpcoming },
            ].map(s => (
              <div key={s.time} style={styles.sessionItem}>
                <div style={styles.sessionTime}>{s.time}</div>
                <div>
                  <div style={styles.sessionName}>{s.name}</div>
                  <div style={styles.sessionMeta}>{s.meta}</div>
                </div>
                <div style={s.badgeStyle}>{s.badge}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={styles.statsSection}>
        {STATS.map((stat, i) => (
          <div key={i} style={styles.statCard}
            onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-6px)")}
            onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}>
            <div style={styles.statValue}>{stat.value}</div>
            <div style={styles.statLabel}>{stat.label}</div>
          </div>
        ))}
      </section>

      {/* FEATURES */}
      <section style={styles.featuresSection}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>What you can do</h2>
          <p style={styles.sectionSubtitle}>Everything for sessions — from registration to certificates and feedback.</p>
        </div>
        <div style={styles.featuresGrid}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ ...styles.featureCard }}
              onClick={() => {
                const path = f.title === 'My Dashboard' ? '/dashboard'
                  : f.title === 'Event Admin' ? '/event-admin'
                  : '/' + f.title.toLowerCase().replace(' ', '-')
                navigate(path)
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-8px)"
                e.currentTarget.style.borderColor = f.color
                e.currentTarget.style.boxShadow = `0 20px 40px ${f.color}22`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"
                e.currentTarget.style.boxShadow = "none"
              }}>
              <div style={{ ...styles.featureIcon, background: `${f.color}22` }}>
                <span style={{ fontSize: "1.6rem" }}>{f.icon}</span>
              </div>
              <h3 style={styles.featureTitle}>{f.title}</h3>
              <p style={styles.featureDesc}>{f.desc}</p>
              <div style={{ ...styles.featureArrow, color: f.color }}>→</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={styles.howSection}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>How it works</h2>
          <p style={styles.sectionSubtitle}>Three simple steps to get started</p>
        </div>
        <div style={styles.stepsRow}>
          {[
            { step: "01", title: "Register", desc: "Sign up and get your unique participant ID instantly.", icon: "📋" },
            { step: "02", title: "Attend",   desc: "Check in via QR code, OTP or RFID at the session.",  icon: "✅" },
            { step: "03", title: "Earn",     desc: "Get your verified certificate auto-delivered.",       icon: "🏆" },
          ].map((s, i) => (
            <div key={i} style={styles.stepCard}>
              <div style={styles.stepNumber}>{s.step}</div>
              <div style={styles.stepIcon}>{s.icon}</div>
              <h3 style={styles.stepTitle}>{s.title}</h3>
              <p style={styles.stepDesc}>{s.desc}</p>
              {i < 2 && <div style={styles.stepArrow}>→</div>}
            </div>
          ))}
        </div>
      </section>

      {/* HELP */}
      <section style={styles.helpSection}>
        <div style={styles.helpCard}>
          <div style={styles.helpGlow} />
          <h2 style={styles.helpTitle}>Need help?</h2>
          <p style={styles.helpSubtitle}>Use the chat bubble or visit FAQ for schedule, registration, and certificates.</p>
          <button style={styles.btnPrimary} onClick={() => navigate('/faq')}
            onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}>
            Go to FAQ
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <div style={styles.logo}>
            <div style={styles.logoIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#A78BFA" strokeWidth="2" />
                <path d="M12 6v6l4 2" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <span style={styles.logoText}>SessionFlow</span>
          </div>
          <p style={styles.footerText}>© 2025 Renovation Foundation. All rights reserved.</p>
          <div style={styles.footerLinks}>
            {["Privacy", "Terms", "Contact"].map(l => (
              <button key={l} style={styles.footerLink}>{l}</button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}

// ── App Router ─────────────────────────────────────────────────
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/login" element={<RedirectIfAuthed><AuthPage /></RedirectIfAuthed>} />
        <Route path="/home"         element={<RequireAuth><Home /></RequireAuth>} />
        <Route path="/schedule"     element={<RequireAuth><SchedulePage /></RequireAuth>} />
        <Route path="/register"     element={<RequireAuth><RegisterPage /></RequireAuth>} />
        <Route path="/attendance"   element={<RequireAuth><AttendancePage /></RequireAuth>} />
        <Route path="/certificates" element={<RequireAuth><CertificatesPage /></RequireAuth>} />
        <Route path="/dashboard"    element={<RequireAuth><DashboardPage /></RequireAuth>} />
        <Route path="/feedback"     element={<RequireAuth><FeedbackPage /></RequireAuth>} />
        <Route path="/quiz"         element={<RequireAuth><QuizPage /></RequireAuth>} />
        <Route path="/content"      element={<RequireAuth><ContentPage /></RequireAuth>} />
        <Route path="/faq"          element={<RequireAuth><FAQPage /></RequireAuth>} />
        <Route path="/event-admin"  element={<RequireAuth><EventAdminPage /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <ChatAssistant />
    </Router>
  )
}
