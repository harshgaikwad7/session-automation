// ── CONTENT PAGE — SessionFlow ─────────────────────────────────────────────
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

// ── Types ───────────────────────────────────────────────────────────────────
type ContentType   = 'ppt' | 'notes' | 'recording' | 'resource'
type SortOption    = 'newest' | 'oldest' | 'az' | 'popular'
type ViewMode      = 'grid' | 'list'

interface ContentItem {
  id: string
  title: string
  session: string
  speaker: string
  date: string
  type: ContentType
  size: string
  duration?: string       // for recordings
  pages?: number          // for ppts/notes
  downloads: number
  views: number
  tags: string[]
  isNew: boolean
  locked: boolean         // requires registration
}

// ── Mock Data ────────────────────────────────────────────────────────────────
const CONTENT_ITEMS: ContentItem[] = [
  {
    id: 'c1', title: 'Social Impact Measurement — Full Slide Deck',
    session: 'Introduction to Social Impact Measurement', speaker: 'Dr. Priya Sharma',
    date: 'Apr 10, 2026', type: 'ppt', size: '4.2 MB', pages: 48,
    downloads: 312, views: 891, tags: ['Impact', 'NGO', 'Framework'], isNew: true, locked: false,
  },
  {
    id: 'c2', title: 'Session Recording — Full 90-min Lecture',
    session: 'Introduction to Social Impact Measurement', speaker: 'Dr. Priya Sharma',
    date: 'Apr 10, 2026', type: 'recording', size: '1.1 GB', duration: '1h 32m',
    downloads: 178, views: 634, tags: ['Impact', 'NGO'], isNew: true, locked: false,
  },
  {
    id: 'c3', title: 'Curated Notes — Key Frameworks & Takeaways',
    session: 'Introduction to Social Impact Measurement', speaker: 'Dr. Priya Sharma',
    date: 'Apr 10, 2026', type: 'notes', size: '820 KB', pages: 12,
    downloads: 445, views: 1102, tags: ['Impact', 'Summary'], isNew: true, locked: false,
  },
  {
    id: 'c4', title: 'Community Fundraising — Strategy Slides',
    session: 'Community Fundraising Strategies', speaker: 'Rahul Mehta',
    date: 'Apr 14, 2026', type: 'ppt', size: '3.8 MB', pages: 36,
    downloads: 201, views: 560, tags: ['Fundraising', 'Strategy'], isNew: false, locked: false,
  },
  {
    id: 'c5', title: 'Donor Psychology — Supplemental Reading',
    session: 'Community Fundraising Strategies', speaker: 'Rahul Mehta',
    date: 'Apr 14, 2026', type: 'resource', size: '2.1 MB', pages: 24,
    downloads: 134, views: 389, tags: ['Fundraising', 'Psychology'], isNew: false, locked: false,
  },
  {
    id: 'c6', title: 'Session Recording — Fundraising Workshop',
    session: 'Community Fundraising Strategies', speaker: 'Rahul Mehta',
    date: 'Apr 14, 2026', type: 'recording', size: '890 MB', duration: '1h 15m',
    downloads: 98, views: 412, tags: ['Fundraising'], isNew: false, locked: true,
  },
  {
    id: 'c7', title: 'Youth Leadership — Workshop Slides',
    session: 'Youth Leadership & Civic Engagement', speaker: 'Aisha Khan',
    date: 'Apr 18, 2026', type: 'ppt', size: '5.1 MB', pages: 54,
    downloads: 267, views: 744, tags: ['Youth', 'Leadership'], isNew: false, locked: false,
  },
  {
    id: 'c8', title: 'Civic Engagement Toolkit — Reference Guide',
    session: 'Youth Leadership & Civic Engagement', speaker: 'Aisha Khan',
    date: 'Apr 18, 2026', type: 'notes', size: '1.4 MB', pages: 18,
    downloads: 389, views: 920, tags: ['Civic', 'Leadership', 'Tools'], isNew: false, locked: false,
  },
  {
    id: 'c9', title: 'Full Session Recording — Youth Leadership',
    session: 'Youth Leadership & Civic Engagement', speaker: 'Aisha Khan',
    date: 'Apr 18, 2026', type: 'recording', size: '760 MB', duration: '58m',
    downloads: 156, views: 501, tags: ['Youth', 'Leadership'], isNew: false, locked: true,
  },
]

const TYPE_CONFIG: Record<ContentType, { label: string; icon: string; color: string; bg: string; border: string }> = {
  ppt:       { label: 'Slides',     icon: '📊', color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.3)'  },
  notes:     { label: 'Notes',      icon: '📝', color: '#4ade80', bg: 'rgba(74,222,128,0.12)',  border: 'rgba(74,222,128,0.3)'  },
  recording: { label: 'Recording',  icon: '🎬', color: '#f472b6', bg: 'rgba(244,114,182,0.12)', border: 'rgba(244,114,182,0.3)' },
  resource:  { label: 'Resource',   icon: '📎', color: '#22d3ee', bg: 'rgba(34,211,238,0.12)',  border: 'rgba(34,211,238,0.3)'  },
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest',  label: '🕐 Newest First' },
  { value: 'oldest',  label: '🕐 Oldest First' },
  { value: 'popular', label: '🔥 Most Popular' },
  { value: 'az',      label: '🔤 A → Z' },
]

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmtNum = (n: number): string => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)

// ── Preview Modal ────────────────────────────────────────────────────────────
interface PreviewModalProps {
  item: ContentItem
  onClose: () => void
  onDownload: (id: string) => void
}

function PreviewModal({ item, onClose, onDownload }: PreviewModalProps) {
  const tc = TYPE_CONFIG[item.type]

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24,
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#13132a', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 24,
          width: '100%', maxWidth: 560, overflow: 'hidden',
          animation: 'slideUp 0.25s cubic-bezier(0.34,1.2,0.64,1)',
        }}
      >
        {/* colour bar top */}
        <div style={{ height: 4, background: `linear-gradient(90deg, ${tc.color}, #8b5cf6)` }} />

        <div style={{ padding: '28px 32px' }}>
          {/* type + new badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{ background: tc.bg, border: `1px solid ${tc.border}`, borderRadius: 8, padding: '4px 12px', fontSize: 12, fontWeight: 700, color: tc.color }}>
              {tc.icon} {tc.label}
            </span>
            {item.isNew && (
              <span style={{ background: 'rgba(139,92,246,0.18)', border: '1px solid rgba(139,92,246,0.4)', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#c4b5fd' }}>✨ NEW</span>
            )}
            {item.locked && (
              <span style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#f87171' }}>🔒 Registered Only</span>
            )}
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#e2e2ff', marginBottom: 8, lineHeight: 1.4 }}>{item.title}</h2>
          <p style={{ fontSize: 13, color: '#7c86a2', marginBottom: 20 }}>
            From: <span style={{ color: '#a78bfa' }}>{item.session}</span>
          </p>

          {/* meta grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
            {[
              ['👤 Speaker', item.speaker],
              ['📅 Date',    item.date],
              ['💾 Size',    item.size],
              item.duration ? ['⏱️ Duration', item.duration] : ['📄 Pages', `${item.pages} pages`],
              ['👁️ Views',    fmtNum(item.views)],
              ['⬇️ Downloads', fmtNum(item.downloads)],
            ].map(([label, value]) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e2ff' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* tags */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
            {item.tags.map(t => (
              <span key={t} style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 6, padding: '3px 10px', fontSize: 11, color: '#a78bfa' }}>{t}</span>
            ))}
          </div>

          {/* preview placeholder */}
          {item.type === 'recording' ? (
            <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(244,114,182,0.2)', borderRadius: 14, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(244,114,182,0.15)', border: '2px solid rgba(244,114,182,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>▶</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{item.duration} · {item.size}</div>
            </div>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ fontSize: 36 }}>{tc.icon}</div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>{item.pages} pages · {item.size}</div>
            </div>
          )}

          {/* actions */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#7c86a2' }}>
              Close
            </button>
            <button
              onClick={() => { if (!item.locked) onDownload(item.id) }}
              style={{
                flex: 2, padding: '12px', borderRadius: 10, fontWeight: 700, fontSize: 14,
                cursor: item.locked ? 'not-allowed' : 'pointer',
                background: item.locked ? 'rgba(255,255,255,0.04)' : `linear-gradient(135deg, ${tc.color === '#f472b6' ? '#f472b6,#8b5cf6' : '#8b5cf6,#6d28d9'})`,
                border: item.locked ? '1px solid rgba(255,255,255,0.1)' : 'none',
                color: item.locked ? '#4b5563' : '#fff',
              }}
            >
              {item.locked ? '🔒 Register to Access' : `⬇ Download ${tc.label}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Content Card (Grid) ──────────────────────────────────────────────────────
interface ContentCardProps {
  item: ContentItem
  onPreview: (item: ContentItem) => void
  onDownload: (id: string) => void
  downloaded: boolean
}

function ContentCard({ item, onPreview, onDownload, downloaded }: ContentCardProps) {
  const tc = TYPE_CONFIG[item.type]
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${hovered ? 'rgba(139,92,246,0.45)' : 'rgba(139,92,246,0.14)'}`,
        borderRadius: 18, overflow: 'hidden', transition: 'all 0.22s', cursor: 'pointer',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
      }}
      onClick={() => onPreview(item)}
    >
      {/* colour top bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${tc.color}, transparent)` }} />

      {/* thumbnail area */}
      <div style={{
        height: 110, background: `radial-gradient(ellipse at 30% 50%, ${tc.bg} 0%, rgba(0,0,0,0) 70%), rgba(0,0,0,0.2)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ fontSize: 52, opacity: 0.85 }}>{tc.icon}</div>
        {item.type === 'recording' && (
          <div style={{ position: 'absolute', bottom: 10, right: 12, background: 'rgba(0,0,0,0.6)', borderRadius: 6, padding: '3px 8px', fontSize: 11, color: '#f472b6', fontWeight: 700, fontFamily: 'monospace' }}>
            ▶ {item.duration}
          </div>
        )}
        {item.pages && item.type !== 'recording' && (
          <div style={{ position: 'absolute', bottom: 10, right: 12, background: 'rgba(0,0,0,0.6)', borderRadius: 6, padding: '3px 8px', fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
            {item.pages}p
          </div>
        )}
        {item.isNew && (
          <div style={{ position: 'absolute', top: 10, left: 12, background: 'rgba(139,92,246,0.85)', borderRadius: 6, padding: '3px 8px', fontSize: 10, color: '#fff', fontWeight: 800, letterSpacing: 0.5 }}>NEW</div>
        )}
        {item.locked && (
          <div style={{ position: 'absolute', top: 10, right: 12, fontSize: 16 }}>🔒</div>
        )}
      </div>

      <div style={{ padding: '16px 18px 18px' }}>
        {/* type badge */}
        <span style={{ background: tc.bg, border: `1px solid ${tc.border}`, borderRadius: 6, padding: '3px 9px', fontSize: 10, fontWeight: 700, color: tc.color, display: 'inline-block', marginBottom: 10 }}>
          {tc.label}
        </span>

        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#e2e2ff', marginBottom: 6, lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {item.title}
        </h3>
        <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 14 }}>👤 {item.speaker}</p>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {item.tags.slice(0, 2).map(t => (
            <span key={t} style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 5, padding: '2px 7px', fontSize: 10, color: '#a78bfa' }}>{t}</span>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 14, fontSize: 11, color: '#6b7280' }}>
            <span>👁️ {fmtNum(item.views)}</span>
            <span>⬇ {fmtNum(item.downloads)}</span>
          </div>
          <button
            onClick={e => { e.stopPropagation(); if (!item.locked) onDownload(item.id) }}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: item.locked ? 'not-allowed' : 'pointer',
              background: downloaded ? 'rgba(74,222,128,0.15)' : item.locked ? 'rgba(255,255,255,0.04)' : 'rgba(139,92,246,0.2)',
              border: downloaded ? '1px solid rgba(74,222,128,0.4)' : item.locked ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(139,92,246,0.4)',
              color: downloaded ? '#4ade80' : item.locked ? '#4b5563' : '#c4b5fd', transition: 'all 0.18s',
            }}
          >
            {downloaded ? '✓' : item.locked ? '🔒' : '⬇'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── List Row ─────────────────────────────────────────────────────────────────
interface ListRowProps {
  item: ContentItem
  onPreview: (item: ContentItem) => void
  onDownload: (id: string) => void
  downloaded: boolean
}

function ListRow({ item, onPreview, onDownload, downloaded }: ListRowProps) {
  const tc = TYPE_CONFIG[item.type]
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onPreview(item)}
      style={{
        display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', borderRadius: 14, cursor: 'pointer',
        background: hovered ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${hovered ? 'rgba(139,92,246,0.35)' : 'rgba(255,255,255,0.07)'}`,
        transition: 'all 0.18s',
      }}
    >
      {/* icon */}
      <div style={{ width: 44, height: 44, borderRadius: 12, background: tc.bg, border: `1px solid ${tc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
        {tc.icon}
      </div>

      {/* title + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#e2e2ff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</span>
          {item.isNew && <span style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)', borderRadius: 5, padding: '1px 7px', fontSize: 9, fontWeight: 800, color: '#c4b5fd', flexShrink: 0 }}>NEW</span>}
          {item.locked && <span style={{ fontSize: 13, flexShrink: 0 }}>🔒</span>}
        </div>
        <div style={{ fontSize: 11, color: '#6b7280' }}>
          {item.speaker} · {item.date} · {item.size}{item.duration ? ` · ${item.duration}` : item.pages ? ` · ${item.pages}p` : ''}
        </div>
      </div>

      {/* type badge — hidden on small */}
      <span style={{ background: tc.bg, border: `1px solid ${tc.border}`, borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: tc.color, flexShrink: 0 }}>
        {tc.label}
      </span>

      {/* stats */}
      <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#6b7280', flexShrink: 0, minWidth: 90 }}>
        <span>⬇ {fmtNum(item.downloads)}</span>
        <span>👁️ {fmtNum(item.views)}</span>
      </div>

      {/* download btn */}
      <button
        onClick={e => { e.stopPropagation(); if (!item.locked) onDownload(item.id) }}
        style={{
          padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: item.locked ? 'not-allowed' : 'pointer', flexShrink: 0,
          background: downloaded ? 'rgba(74,222,128,0.15)' : item.locked ? 'rgba(255,255,255,0.04)' : 'rgba(139,92,246,0.2)',
          border: downloaded ? '1px solid rgba(74,222,128,0.4)' : item.locked ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(139,92,246,0.35)',
          color: downloaded ? '#4ade80' : item.locked ? '#4b5563' : '#c4b5fd', transition: 'all 0.18s',
        }}
      >
        {downloaded ? '✓ Saved' : item.locked ? '🔒 Locked' : '⬇ Download'}
      </button>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function ContentPage() {
  const navigate = useNavigate();
  const [search,        setSearch]        = useState<string>('')
  const [activeType,    setActiveType]    = useState<ContentType | 'all'>('all')
  const [sortBy,        setSortBy]        = useState<SortOption>('newest')
  const [viewMode,      setViewMode]      = useState<ViewMode>('grid')
  const [previewItem,   setPreviewItem]   = useState<ContentItem | null>(null)
  const [downloadedIds, setDownloadedIds] = useState<string[]>([])
  const [activeSession, setActiveSession] = useState<string>('all')

  const sessions = useMemo(() => {
    const s = Array.from(new Set(CONTENT_ITEMS.map(i => i.session)))
    return ['all', ...s]
  }, [])

  const filtered = useMemo(() => {
    let items = [...CONTENT_ITEMS]
    if (activeType !== 'all')    items = items.filter(i => i.type === activeType)
    if (activeSession !== 'all') items = items.filter(i => i.session === activeSession)
    if (search.trim())           items = items.filter(i =>
      i.title.toLowerCase().includes(search.toLowerCase()) ||
      i.speaker.toLowerCase().includes(search.toLowerCase()) ||
      i.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    )
    if (sortBy === 'newest')  items.sort((a, b) => b.date.localeCompare(a.date))
    if (sortBy === 'oldest')  items.sort((a, b) => a.date.localeCompare(b.date))
    if (sortBy === 'popular') items.sort((a, b) => b.downloads - a.downloads)
    if (sortBy === 'az')      items.sort((a, b) => a.title.localeCompare(b.title))
    return items
  }, [search, activeType, activeSession, sortBy])

  const handleDownload = (id: string): void => {
    setDownloadedIds(prev => prev.includes(id) ? prev : [...prev, id])
    
    // Trigger actual download from /public
    const item = CONTENT_ITEMS.find(i => i.id === id);
    if (!item) return;

    let filename = 'presentation.pdf';
    if (item.type === 'notes') filename = 'notes.pdf';
    if (item.type === 'recording') filename = 'recording.mp4';
    if (item.type === 'resource') filename = 'notes.pdf';

    const link = document.createElement('a');
    link.href = `/${filename}`;
    link.download = item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + (filename.substring(filename.lastIndexOf('.')));
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // counts per type
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: CONTENT_ITEMS.length }
    for (const item of CONTENT_ITEMS) {
      counts[item.type] = (counts[item.type] ?? 0) + 1
    }
    return counts
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d1a', color: '#e2e2ff', fontFamily: "'Sora', sans-serif", paddingBottom: 80 }}>
      <button onClick={() => navigate('/')} style={{ position: 'absolute', top: 20, left: 20, background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)', color: '#a78bfa', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', zIndex: 10 }}>← Back to Home</button>

      {/* ── Header ── */}
      <div style={{ background: 'linear-gradient(135deg, #1a1a3e 0%, #12122b 100%)', borderBottom: '1px solid rgba(139,92,246,0.2)', padding: '48px 24px 36px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* decorative circles */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 20, padding: '6px 18px', marginBottom: 20, fontSize: 13, color: '#a78bfa' }}>
          <span>📁</span> Content Library
        </div>
        <h1 style={{ fontSize: 'clamp(26px, 5vw, 44px)', fontWeight: 800, margin: '0 0 10px', background: 'linear-gradient(135deg, #fff 0%, #c4b5fd 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Session Content
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 15, margin: '0 auto 28px', maxWidth: 500 }}>
          Access slides, notes, and recordings from all sessions you've attended.
        </p>

        {/* stats strip */}
        <div style={{ display: 'inline-flex', gap: 0, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 14, overflow: 'hidden' }}>
          {[
            { label: 'Total Files', value: CONTENT_ITEMS.length },
            { label: 'Slide Decks', value: typeCounts['ppt'] ?? 0 },
            { label: 'Recordings', value: typeCounts['recording'] ?? 0 },
            { label: 'Notes',       value: typeCounts['notes'] ?? 0 },
          ].map((s, i) => (
            <div key={s.label} style={{ padding: '12px 24px', borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.07)' : 'none', textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#c4b5fd' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px 0' }}>

        {/* ── Filters row ── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 20 }}>
          {/* search */}
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: '#6b7280' }}>🔍</span>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search files, speakers, topics…"
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.22)', borderRadius: 12, padding: '11px 14px 11px 42px', color: '#e2e2ff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* sort */}
          <select
            value={sortBy} onChange={e => setSortBy(e.target.value as SortOption)}
            style={{ padding: '11px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.22)', borderRadius: 12, color: '#e2e2ff', fontSize: 13, outline: 'none', cursor: 'pointer' }}
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ background: '#1a1a3e' }}>{o.label}</option>)}
          </select>

          {/* view toggle */}
          <div style={{ display: 'flex', gap: 3, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 3 }}>
            {(['grid', 'list'] as ViewMode[]).map(v => (
              <button key={v} onClick={() => setViewMode(v)} style={{
                padding: '7px 14px', borderRadius: 8, fontSize: 16, cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                background: viewMode === v ? 'rgba(139,92,246,0.3)' : 'transparent',
                color: viewMode === v ? '#c4b5fd' : '#4b5563',
              }}>
                {v === 'grid' ? '⊞' : '☰'}
              </button>
            ))}
          </div>
        </div>

        {/* ── Type filter chips ── */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          <button onClick={() => setActiveType('all')} style={{
            padding: '8px 18px', borderRadius: 24, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.18s',
            background: activeType === 'all' ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.04)',
            border:     activeType === 'all' ? '1px solid rgba(139,92,246,0.5)' : '1px solid rgba(255,255,255,0.08)',
            color:      activeType === 'all' ? '#c4b5fd' : '#7c86a2',
          }}>
            All ({typeCounts['all']})
          </button>
          {(Object.keys(TYPE_CONFIG) as ContentType[]).map(type => {
            const tc = TYPE_CONFIG[type]
            const active = activeType === type
            return (
              <button key={type} onClick={() => setActiveType(type)} style={{
                padding: '8px 18px', borderRadius: 24, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.18s',
                background: active ? tc.bg : 'rgba(255,255,255,0.04)',
                border:     active ? `1px solid ${tc.border}` : '1px solid rgba(255,255,255,0.08)',
                color:      active ? tc.color : '#7c86a2',
              }}>
                {tc.icon} {tc.label} ({typeCounts[type] ?? 0})
              </button>
            )
          })}
        </div>

        {/* ── Session filter chips ── */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          {sessions.map(s => {
            const active = activeSession === s
            const label  = s === 'all' ? 'All Sessions' : s.length > 38 ? s.slice(0, 38) + '…' : s
            return (
              <button key={s} onClick={() => setActiveSession(s)} style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                background: active ? 'rgba(139,92,246,0.18)' : 'rgba(255,255,255,0.03)',
                border:     active ? '1px solid rgba(139,92,246,0.45)' : '1px solid rgba(255,255,255,0.07)',
                color:      active ? '#c4b5fd' : '#6b7280',
              }}>
                {label}
              </button>
            )
          })}
        </div>

        {/* ── Results count ── */}
        <div style={{ fontSize: 12, color: '#4b5563', marginBottom: 16, fontWeight: 600 }}>
          {filtered.length} file{filtered.length !== 1 ? 's' : ''} found
        </div>

        {/* ── Content grid / list ── */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#4b5563' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>📭</div>
            <p style={{ fontSize: 16 }}>No content matches your filters.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
            {filtered.map(item => (
              <ContentCard key={item.id} item={item} onPreview={setPreviewItem} onDownload={handleDownload} downloaded={downloadedIds.includes(item.id)} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(item => (
              <ListRow key={item.id} item={item} onPreview={setPreviewItem} onDownload={handleDownload} downloaded={downloadedIds.includes(item.id)} />
            ))}
          </div>
        )}
      </div>

      {/* ── Preview Modal ── */}
      {previewItem && (
        <PreviewModal item={previewItem} onClose={() => setPreviewItem(null)} onDownload={(id) => { handleDownload(id); setPreviewItem(null) }} />
      )}

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 }                         to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(30px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
    </div>
  )
}
