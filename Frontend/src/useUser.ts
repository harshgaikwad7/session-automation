// ── useUser.ts ─────────────────────────────────────────────────────────────
// Single hook to get/update the logged-in user from localStorage.
// Import this in ANY page that needs user info.
//
// Usage:
//   const { user, email, name, role, isAdmin, isConductor } = useUser()

import { useState, useEffect } from 'react'

export interface SFUser {
  id: string
  name: string
  email: string
  phone?: string
  role: 'participant' | 'conductor' | 'admin'
  joinedOn?: string
}

const getInitialUser = (): SFUser | null => {
  const raw = localStorage.getItem('sf_user')
  if (!raw) return null
  try {
    return JSON.parse(raw) as SFUser
  } catch {
    return null
  }
}

export function useUser() {
  const [user, setUser] = useState<SFUser | null>(() => getInitialUser())

  useEffect(() => {
    const syncUser = () => setUser(getInitialUser())
    window.addEventListener('storage', syncUser)
    return () => window.removeEventListener('storage', syncUser)
  }, [])

  const logout = () => {
    localStorage.removeItem('sf_user')
    window.location.href = '/login'
  }

  return {
    user,
    email:       user?.email ?? '',
    name:        user?.name ?? '',
    firstName:   user?.name?.split(' ')[0] ?? '',
    role:        user?.role ?? 'participant',
    isAdmin:     user?.role === 'admin',
    isConductor: user?.role === 'conductor' || user?.role === 'admin',
    isLoggedIn:  !!user,
    logout,
  }
}

// ── API helper ────────────────────────────────────────────────
// Use this everywhere instead of writing fetch() from scratch.
// Automatically adds Content-Type and handles errors.

export const API_BASE = 'http://localhost:8000'

export async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}
