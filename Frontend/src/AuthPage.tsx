import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from './assets/renovatio_logo.png'

// ── Types ──────────────────────────────────────────────────────
type AuthMode = 'login' | 'register'

interface FormData {
  name: string
  email: string
  password: string
  phone: string
  role: 'participant' | 'conductor' | 'admin'
}

// ── Mock users for demo (no backend needed) ───────────────────
const DEMO_USERS = [
  { id: 'u1', name: 'Arjun Desai',  email: 'arjun@demo.com', password: 'demo123',  role: 'participant', phone: '+91 98765 43210', joinedOn: '2026-01-15' },
  { id: 'u2', name: 'Priya Sharma', email: 'priya@demo.com', password: 'demo123',  role: 'conductor',   phone: '+91 87654 32109', joinedOn: '2025-11-01' },
  { id: 'u3', name: 'Admin User',   email: 'admin@demo.com', password: 'admin123', role: 'admin',       phone: '+91 76543 21098', joinedOn: '2025-09-01' },
]

const API = 'http://localhost:8000'

export default function AuthPage() {
  const navigate = useNavigate()
  const [mode,    setMode]    = useState<AuthMode>('login')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [form,    setForm]    = useState<FormData>({ name: '', email: '', password: '', phone: '', role: 'participant' })

  const set = (k: keyof FormData, v: string) => setForm(f => ({ ...f, [k]: v }))

  // ── LOGIN ─────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!form.email || !form.password) { setError('Please fill in all fields'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API}/api/registration/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      })
      if (res.ok) {
        const data = await res.json()
        localStorage.setItem('sf_user', JSON.stringify(data.user))
        localStorage.setItem('user',    JSON.stringify(data.user))
        navigate('/home'); setLoading(false); return
      }
    } catch { /* backend offline — fall through */ }

    await new Promise(r => setTimeout(r, 900))
    const found = DEMO_USERS.find(u => u.email === form.email && u.password === form.password)
    if (found) {
      const { password, ...user } = found
      localStorage.setItem('sf_user', JSON.stringify(user))
      localStorage.setItem('user',    JSON.stringify(user))
      navigate('/home')
    } else {
      setError('Invalid email or password. Try arjun@demo.com / demo123')
    }
    setLoading(false)
  }

  // ── REGISTER ──────────────────────────────────────────────────
  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) { setError('Please fill all required fields'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API}/api/registration/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: form.name, email: form.email, password: form.password, phone: form.phone, role: form.role }),
      })
      if (res.ok) {
        const data = await res.json()
        localStorage.setItem('sf_user', JSON.stringify(data.user))
        localStorage.setItem('user',    JSON.stringify(data.user))
        navigate('/home'); setLoading(false); return
      }
    } catch { /* backend offline */ }

    await new Promise(r => setTimeout(r, 1000))
    const newUser = { id: 'u_' + Date.now(), name: form.name, email: form.email, phone: form.phone, role: form.role, joinedOn: new Date().toISOString().slice(0, 10) }
    localStorage.setItem('sf_user', JSON.stringify(newUser))
    localStorage.setItem('user',    JSON.stringify(newUser))
    navigate('/home'); setLoading(false)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') mode === 'login' ? handleLogin() : handleRegister()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(139,92,246,0.25)', borderRadius: 12,
    padding: '13px 16px', color: '#e2e2ff', fontSize: 14, outline: 'none',
    fontFamily: "'Sora', sans-serif", boxSizing: 'border-box', transition: 'border 0.2s',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 12, color: '#7c86a2', fontWeight: 600, marginBottom: 6,
    display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d0a1e', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Sora', sans-serif", position: 'relative', overflow: 'hidden' }}>

      {/* Background blobs */}
      <div style={{ position: 'fixed', top: -200, left: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(108,99,255,0.15), transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: -200, right: -200, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.1), transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', top: '5%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 220, background: 'radial-gradient(ellipse, rgba(220,38,38,0.07), transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>

        {/* ── Logo ── */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 36 }}>
          <img
            src={logo}
            alt="Renovatio"
            style={{
              display: 'block',
              width: 260,
              height: 'auto',
              marginBottom: 14,
              mixBlendMode: 'lighten' as React.CSSProperties['mixBlendMode'],
              filter: 'drop-shadow(0 0 22px rgba(220,38,38,0.5))',
            }}
          />
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(226,224,255,0.3)', letterSpacing: 5, textTransform: 'uppercase' }}>
            SessionFlow
          </div>
        </div>

        {/* ── Card ── */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 24, padding: '36px 32px', backdropFilter: 'blur(12px)' }}>

          {/* Mode toggle */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4, marginBottom: 28 }}>
            {(['login', 'register'] as AuthMode[]).map(m => (
              <button key={m} onClick={() => { setMode(m); setError('') }} style={{
                flex: 1, padding: '10px', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                background: mode === m ? 'linear-gradient(135deg, #6C63FF, #8b5cf6)' : 'transparent',
                border: 'none', color: mode === m ? '#fff' : '#7c86a2',
                fontFamily: "'Sora', sans-serif", transition: 'all 0.2s', textTransform: 'capitalize',
              }}>
                {m === 'login' ? '🔑 Sign In' : '✨ Sign Up'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {mode === 'register' && (
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} onKeyDown={handleKey} placeholder="Arjun Desai" style={inputStyle} />
              </div>
            )}

            <div>
              <label style={labelStyle}>Email *</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} onKeyDown={handleKey} placeholder="you@email.com" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Password *</label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)} onKeyDown={handleKey} placeholder={mode === 'register' ? 'Min 6 characters' : '••••••••'} style={inputStyle} />
            </div>

            {mode === 'register' && (
              <>
                <div>
                  <label style={labelStyle}>Phone</label>
                  <input value={form.phone} onChange={e => set('phone', e.target.value)} onKeyDown={handleKey} placeholder="+91 98765 43210" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>I am a</label>
                  <select value={form.role} onChange={e => set('role', e.target.value as FormData['role'])} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="participant" style={{ background: '#1a1a3e' }}>🎓 Participant</option>
                    <option value="conductor"   style={{ background: '#1a1a3e' }}>🎙️ NGO Conductor</option>
                    <option value="admin"       style={{ background: '#1a1a3e' }}>⚙️ Admin</option>
                  </select>
                </div>
              </>
            )}

            {error && (
              <div style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#f87171' }}>
                ⚠️ {error}
              </div>
            )}

            <button
              onClick={mode === 'login' ? handleLogin : handleRegister}
              disabled={loading}
              style={{
                width: '100%', padding: '14px', borderRadius: 12, fontWeight: 700, fontSize: 15, marginTop: 4,
                cursor: loading ? 'not-allowed' : 'pointer',
                background: loading ? 'rgba(139,92,246,0.4)' : 'linear-gradient(135deg, #6C63FF, #8b5cf6)',
                border: 'none', color: '#fff', fontFamily: "'Sora', sans-serif",
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                boxShadow: '0 8px 24px rgba(108,99,255,0.35)', transition: 'all 0.2s',
              }}
            >
              {loading ? (
                <>
                  <span style={{ display: 'inline-block', width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  {mode === 'login' ? 'Signing in…' : 'Creating account…'}
                </>
              ) : mode === 'login' ? '🔑 Sign In' : '✨ Create Account'}
            </button>
          </div>

          {/* Demo accounts */}
          {mode === 'login' && (
            <div style={{ marginTop: 20, padding: '14px 16px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 12 }}>
              <div style={{ fontSize: 11, color: '#7c86a2', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>Demo Accounts</div>
              {[
                { label: 'Participant', email: 'arjun@demo.com', pass: 'demo123'  },
                { label: 'Conductor',  email: 'priya@demo.com', pass: 'demo123'  },
                { label: 'Admin',      email: 'admin@demo.com', pass: 'admin123' },
              ].map(d => (
                <button key={d.email}
                  onClick={() => { set('email', d.email); set('password', d.pass); setError('') }}
                  style={{ display: 'block', width: '100%', textAlign: 'left', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '7px 10px', marginBottom: 6, cursor: 'pointer', fontSize: 12, color: '#c4b5fd', fontFamily: "'Sora', sans-serif" }}
                >
                  <span style={{ color: '#a78bfa', fontWeight: 700 }}>{d.label}:</span> {d.email} / {d.pass}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
