// ── QUIZ PAGE — SessionFlow
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

// ── Mock Quiz Data ─────────────────────────────────────────────
const QUIZZES = [
  {
    id: 'q1',
    sessionId: 's1',
    sessionTitle: 'Introduction to Social Impact Measurement',
    topic: 'Social Impact',
    difficulty: 'Beginner',
    difficultyColor: '#4ade80',
    duration: 300, // seconds
    totalQuestions: 6,
    passMark: 60,
    questions: [
      {
        id: 1,
        question: 'Which framework is most commonly used by NGOs to measure social impact?',
        options: ['SROI (Social Return on Investment)', 'EBITDA Analysis', 'Net Promoter Score', 'Balanced Scorecard'],
        correct: 0,
        explanation: 'SROI (Social Return on Investment) is the most widely adopted framework for NGOs to quantify and communicate the social, environmental, and economic value they create relative to resources invested.',
      },
      {
        id: 2,
        question: 'What does "Theory of Change" describe in the context of NGO work?',
        options: ['A financial audit process', 'How and why an intervention leads to desired outcomes', 'The organizational structure of an NGO', 'A donor reporting template'],
        correct: 1,
        explanation: 'Theory of Change is a methodology that explains how and why a set of activities is expected to lead to desired long-term goals, mapping the causal pathway from inputs to impact.',
      },
      {
        id: 3,
        question: 'Which of the following is an example of an OUTPUT metric?',
        options: ['Reduction in poverty rate', 'Number of training sessions conducted', 'Improved livelihoods of beneficiaries', 'Policy change at government level'],
        correct: 1,
        explanation: 'Outputs are the direct, tangible products of activities — like sessions conducted, kits distributed, or people trained. Outcomes and impacts are longer-term changes resulting from those outputs.',
      },
      {
        id: 4,
        question: 'The "M&E" in NGO operations stands for:',
        options: ['Management & Evaluation', 'Monitoring & Execution', 'Monitoring & Evaluation', 'Mission & Engagement'],
        correct: 2,
        explanation: 'M&E stands for Monitoring & Evaluation — a systematic approach to tracking program performance (monitoring) and assessing whether goals are being achieved (evaluation).',
      },
      {
        id: 5,
        question: 'Which data collection method is best for capturing community sentiment at scale?',
        options: ['In-depth interviews', 'Focus group discussions', 'Large-scale surveys', 'Ethnographic observation'],
        correct: 2,
        explanation: 'Large-scale surveys are most effective for capturing broad sentiment patterns across large populations, though they must be combined with qualitative methods for depth.',
      },
      {
        id: 6,
        question: 'What is "attribution" in social impact measurement?',
        options: ['Crediting donors for funding', 'Linking observed change to a specific intervention', 'Publishing an annual report', 'Setting KPIs for staff'],
        correct: 1,
        explanation: 'Attribution refers to establishing a credible causal link between your intervention and the observed change — accounting for other factors that may have contributed to the outcome.',
      },
    ],
  },
  {
    id: 'q2',
    sessionId: 's2',
    sessionTitle: 'Community Fundraising Strategies',
    topic: 'Fundraising',
    difficulty: 'Intermediate',
    difficultyColor: '#fb923c',
    duration: 240,
    totalQuestions: 5,
    passMark: 60,
    questions: [
      {
        id: 1,
        question: 'Which fundraising model relies on many small contributions from a large number of people?',
        options: ['Major donor fundraising', 'Crowdfunding', 'Corporate CSR grants', 'Endowment fundraising'],
        correct: 1,
        explanation: 'Crowdfunding aggregates small donations from a large number of people, typically via online platforms. It\'s especially effective for specific, tangible projects with strong storytelling.',
      },
      {
        id: 2,
        question: 'What is the "donor pyramid" concept?',
        options: ['A scheme where donors recruit other donors', 'A model categorizing donors from small, frequent givers to major philanthropists', 'A government grant structure', 'An internal org chart for fundraising teams'],
        correct: 1,
        explanation: 'The donor pyramid segments supporters by engagement level — from broad awareness at the base (small donors, volunteers) to a narrow peak of major donors — guiding how to nurture relationships.',
      },
      {
        id: 3,
        question: 'Which metric best indicates the health of a recurring donation program?',
        options: ['Total funds raised', 'Donor retention rate', 'Average gift size', 'Cost per acquisition'],
        correct: 1,
        explanation: 'Donor retention rate measures the percentage of donors who give again in subsequent periods. High retention is far more cost-effective than constantly acquiring new donors.',
      },
      {
        id: 4,
        question: 'In India, which law governs foreign donations to NGOs?',
        options: ['IT Act 2000', 'FCRA (Foreign Contribution Regulation Act)', 'CSR Act Section 135', 'NGO Registration Act'],
        correct: 1,
        explanation: 'The Foreign Contribution (Regulation) Act (FCRA) governs receipt and use of foreign donations by Indian NGOs. Organizations must be FCRA-registered to legally accept foreign funds.',
      },
      {
        id: 5,
        question: 'What does "cost per rupee raised" (CPRR) measure?',
        options: ['The tax benefit for donors', 'Fundraising efficiency — how much is spent to raise one rupee', 'The overhead ratio of the NGO', 'Investment returns on the endowment'],
        correct: 1,
        explanation: 'CPRR (Cost Per Rupee Raised) measures fundraising efficiency. Lower CPRR = more of every rupee donated goes to the mission. Sector benchmarks typically aim for ₹0.10–0.20 per ₹1 raised.',
      },
    ],
  },
  {
    id: 'q3',
    sessionId: 's3',
    sessionTitle: 'Youth Leadership & Civic Engagement',
    topic: 'Leadership',
    difficulty: 'Advanced',
    difficultyColor: '#f87171',
    duration: 180,
    totalQuestions: 5,
    passMark: 70,
    questions: [
      {
        id: 1,
        question: 'Which leadership style is most effective for building youth-led civic movements?',
        options: ['Autocratic leadership', 'Servant leadership', 'Transactional leadership', 'Bureaucratic leadership'],
        correct: 1,
        explanation: 'Servant leadership — prioritizing the needs and growth of others — is most effective in civic movements because it builds trust, distributed ownership, and long-term sustainability.',
      },
      {
        id: 2,
        question: 'What is the minimum voting age in India?',
        options: ['16 years', '21 years', '18 years', '20 years'],
        correct: 2,
        explanation: 'The 61st Constitutional Amendment (1988) lowered the voting age in India from 21 to 18 years, significantly expanding youth political participation.',
      },
      {
        id: 3,
        question: 'Which UN framework focuses specifically on youth civic participation?',
        options: ['Agenda 2030 (SDGs)', 'UN Youth Strategy 2030', 'Millennium Development Goals', 'UN Global Compact'],
        correct: 1,
        explanation: 'The UN Youth Strategy 2030 ("Youth 2030") specifically addresses youth engagement in peace, human rights, and development — providing a global framework for civic participation programs.',
      },
      {
        id: 4,
        question: '"Participatory budgeting" is an example of:',
        options: ['Corporate governance', 'Direct democratic civic engagement', 'NGO financial planning', 'Government auditing'],
        correct: 1,
        explanation: 'Participatory budgeting is a direct democratic process where community members — including youth — decide how to allocate a portion of public budget, giving citizens real decision-making power.',
      },
      {
        id: 5,
        question: 'Which psychological concept best explains why youth disengage from civic processes?',
        options: ['Imposter syndrome', 'Civic efficacy gap', 'Dunning-Kruger effect', 'Confirmation bias'],
        correct: 1,
        explanation: 'The "civic efficacy gap" refers to the disconnect between civic knowledge and the belief that one\'s participation can produce real change. Bridging this gap is central to youth leadership programs.',
      },
    ],
  },
]

// ── Utility ────────────────────────────────────────────────────
const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

export default function QuizPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<'list' | 'quiz' | 'result'>('list')
  const [activeQuiz, setActiveQuiz] = useState<typeof QUIZZES[0] | null>(null)
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<(number | null)[]>([])
  const [revealed, setRevealed] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [finished, setFinished] = useState(false)
  const [score, setScore] = useState(0)
  const [completedIds, setCompletedIds] = useState<string[]>([])
  const [scores, setScores] = useState<Record<string, number>>({})
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  const handleFinish = useCallback(() => {
    stopTimer()
    setFinished(true)
    if (!activeQuiz) return
    const correct = activeQuiz.questions.reduce((acc, q, i) => acc + (selected[i] === q.correct ? 1 : 0), 0)
    const pct = Math.round((correct / activeQuiz.questions.length) * 100)
    setScore(pct)
    setCompletedIds(prev => prev.includes(activeQuiz.id) ? prev : [...prev, activeQuiz.id])
    setScores(prev => ({ ...prev, [activeQuiz.id]: pct }))
    setView('result')
  }, [activeQuiz, selected, stopTimer])

  useEffect(() => {
    if (view === 'quiz' && !finished) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { stopTimer(); handleFinish(); return 0 }
          return t - 1
        })
      }, 1000)
    }
    return stopTimer
  }, [view, finished, stopTimer, handleFinish])

  const startQuiz = (quiz: typeof QUIZZES[0]) => {
    setActiveQuiz(quiz)
    setCurrent(0)
    setSelected(new Array(quiz.questions.length).fill(null))
    setRevealed(false)
    setFinished(false)
    setTimeLeft(quiz.duration)
    setView('quiz')
  }

  const handleSelect = (optIdx: number) => {
    if (revealed) return
    const updated = [...selected]
    updated[current] = optIdx
    setSelected(updated)
  }

  const handleNext = () => {
    setRevealed(false)
    if (current < (activeQuiz!.questions.length - 1)) {
      setCurrent(c => c + 1)
    } else {
      handleFinish()
    }
  }


  const timerPct = activeQuiz ? (timeLeft / activeQuiz.duration) * 100 : 100
  const timerColor = timerPct > 50 ? '#4ade80' : timerPct > 20 ? '#fb923c' : '#f87171'
  const q = activeQuiz?.questions[current]

  // ── LIST VIEW ──────────────────────────────────────────────
  if (view === 'list') return (
    <div style={{ minHeight: '100vh', background: '#0d0d1a', color: '#e2e2ff', fontFamily: "'Sora', sans-serif", paddingBottom: 80 }}>
      <button onClick={() => navigate('/')} style={{ position: 'absolute', top: 20, left: 20, background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)', color: '#a78bfa', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', zIndex: 10 }}>← Back to Home</button>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a1a3e 0%, #12122b 100%)', borderBottom: '1px solid rgba(139,92,246,0.2)', padding: '48px 24px 36px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 20, padding: '6px 18px', marginBottom: 20, fontSize: 13, color: '#a78bfa' }}>
          <span>🧠</span> Session Quizzes
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 800, margin: '0 0 12px', background: 'linear-gradient(135deg, #fff 0%, #c4b5fd 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Test Your Knowledge
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 16, margin: '0 auto', maxWidth: 520 }}>
          Complete quizzes for sessions you've attended. Pass to earn your certificate!
        </p>
      </div>

      {/* Stats Bar */}
      <div style={{ maxWidth: 900, margin: '32px auto 0', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 36 }}>
          {[
            { label: 'Available', value: QUIZZES.length, icon: '📝', color: '#8b5cf6' },
            { label: 'Completed', value: completedIds.length, icon: '✅', color: '#4ade80' },
            { label: 'Avg Score', value: completedIds.length ? Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / completedIds.length) + '%' : '—', icon: '⭐', color: '#fb923c' },
          ].map(stat => (
            <div key={stat.label} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${stat.color}33`, borderRadius: 16, padding: '20px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{stat.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Quiz Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {QUIZZES.map((quiz, idx) => {
            const done = completedIds.includes(quiz.id)
            const sc = scores[quiz.id]
            const passed = sc >= quiz.passMark
            return (
              <div key={quiz.id} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${done ? (passed ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)') : 'rgba(139,92,246,0.15)'}`, borderRadius: 18, padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap', animation: `fadeSlide 0.4s ${idx * 0.1}s both` }}>
                {/* Number */}
                <div style={{ width: 54, height: 54, borderRadius: '50%', background: done ? (passed ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)') : 'rgba(139,92,246,0.15)', border: `2px solid ${done ? (passed ? 'rgba(74,222,128,0.5)' : 'rgba(248,113,113,0.5)') : 'rgba(139,92,246,0.4)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                  {done ? (passed ? '✅' : '❌') : '🧩'}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
                    <span style={{ background: `${quiz.difficultyColor}22`, border: `1px solid ${quiz.difficultyColor}55`, borderRadius: 8, padding: '2px 10px', fontSize: 11, fontWeight: 700, color: quiz.difficultyColor }}>{quiz.difficulty}</span>
                    <span style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 8, padding: '2px 10px', fontSize: 11, color: '#a78bfa' }}>🏷️ {quiz.topic}</span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#e2e2ff', marginBottom: 4 }}>{quiz.sessionTitle}</div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#6b7280' }}>
                    <span>❓ {quiz.totalQuestions} questions</span>
                    <span>⏱️ {Math.floor(quiz.duration / 60)} min</span>
                    <span>🎯 Pass: {quiz.passMark}%</span>
                  </div>
                </div>

                {/* Score / Action */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  {done && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 26, fontWeight: 800, color: passed ? '#4ade80' : '#f87171' }}>{sc}%</div>
                      <div style={{ fontSize: 11, color: passed ? '#4ade80' : '#f87171', fontWeight: 600 }}>{passed ? '✓ Passed' : '✗ Failed'}</div>
                    </div>
                  )}
                  <button
                    onClick={() => startQuiz(quiz)}
                    style={{ padding: '10px 24px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', background: done ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #8b5cf6, #6d28d9)', border: done ? '1px solid rgba(255,255,255,0.12)' : 'none', color: done ? '#94a3b8' : '#fff', fontFamily: "'Sora', sans-serif", whiteSpace: 'nowrap' }}>
                    {done ? '↺ Retry' : 'Start Quiz →'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <style>{`@keyframes fadeSlide { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </div>
  )

  // ── QUIZ VIEW ──────────────────────────────────────────────
  if (view === 'quiz' && activeQuiz && q) {
    const progress = ((current + 1) / activeQuiz.questions.length) * 100
    const answeredCount = selected.filter(s => s !== null).length
    return (
      <div style={{ minHeight: '100vh', background: '#0d0d1a', color: '#e2e2ff', fontFamily: "'Sora', sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px 60px' }}>
        <button onClick={() => navigate('/')} style={{ position: 'absolute', top: 20, left: 20, background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)', color: '#a78bfa', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', zIndex: 10 }}>← Back to Home</button>

        {/* Top Bar */}
        <div style={{ width: '100%', maxWidth: 680, marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <button onClick={() => { stopTimer(); setView('list') }} style={{ background: 'none', border: 'none', color: '#7c86a2', cursor: 'pointer', fontSize: 14, fontFamily: "'Sora', sans-serif", padding: 0 }}>← Exit Quiz</button>
            <div style={{ fontSize: 13, color: '#7c86a2' }}>Question <span style={{ color: '#c4b5fd', fontWeight: 700 }}>{current + 1}</span> of {activeQuiz.questions.length}</div>
            {/* Timer */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: `${timerColor}18`, border: `1px solid ${timerColor}55`, borderRadius: 10, padding: '7px 14px' }}>
              <span style={{ fontSize: 14 }}>⏱</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: timerColor, fontFamily: 'monospace', letterSpacing: 1 }}>{fmt(timeLeft)}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #8b5cf6, #22d3ee)', borderRadius: 10, transition: 'width 0.4s ease' }} />
          </div>

          {/* Question pills */}
          <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
            {activeQuiz.questions.map((_, i) => (
              <div key={i} onClick={() => { setRevealed(false); setCurrent(i) }}
                style={{ width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                  background: i === current ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)' : selected[i] !== null ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.05)',
                  border: i === current ? 'none' : selected[i] !== null ? '1px solid rgba(74,222,128,0.4)' : '1px solid rgba(255,255,255,0.1)',
                  color: i === current ? '#fff' : selected[i] !== null ? '#4ade80' : '#6b7280' }}>
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Question Card */}
        <div key={current} style={{ width: '100%', maxWidth: 680, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 20, padding: '32px', animation: 'slideIn 0.3s ease' }}>
          <div style={{ fontSize: 12, color: '#7c86a2', marginBottom: 16, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Question {current + 1}</div>
          <h2 style={{ fontSize: 'clamp(16px, 3vw, 20px)', fontWeight: 700, margin: '0 0 28px', lineHeight: 1.5, color: '#e2e2ff' }}>{q.question}</h2>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {q.options.map((opt, i) => {
              const isSelected = selected[current] === i
              const isCorrect = revealed && i === q.correct
              const isWrong = revealed && isSelected && i !== q.correct
              let bg = 'rgba(255,255,255,0.04)', border = '1px solid rgba(255,255,255,0.1)', color = '#c4b5fd'
              if (isSelected && !revealed) { bg = 'rgba(139,92,246,0.2)'; border = '1px solid rgba(139,92,246,0.6)'; color = '#e2e2ff' }
              if (isCorrect) { bg = 'rgba(74,222,128,0.15)'; border = '1px solid rgba(74,222,128,0.5)'; color = '#4ade80' }
              if (isWrong) { bg = 'rgba(248,113,113,0.15)'; border = '1px solid rgba(248,113,113,0.5)'; color = '#f87171' }
              return (
                <button key={i} onClick={() => handleSelect(i)}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 12, cursor: revealed ? 'default' : 'pointer', background: bg, border, color, textAlign: 'left', fontFamily: "'Sora', sans-serif", fontSize: 14, fontWeight: isSelected ? 700 : 500, transition: 'all 0.2s', width: '100%' }}>
                  <span style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, background: isCorrect ? 'rgba(74,222,128,0.25)' : isWrong ? 'rgba(248,113,113,0.25)' : isSelected ? 'rgba(139,92,246,0.35)' : 'rgba(255,255,255,0.07)', flexShrink: 0 }}>
                    {revealed && isCorrect ? '✓' : revealed && isWrong ? '✗' : String.fromCharCode(65 + i)}
                  </span>
                  {opt}
                </button>
              )
            })}
          </div>

          {/* Explanation */}
          {revealed && (
            <div style={{ marginTop: 20, padding: '16px 18px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', borderRadius: 12, fontSize: 13, color: '#c4b5fd', lineHeight: 1.7, animation: 'fadeIn 0.3s ease' }}>
              <span style={{ fontWeight: 700 }}>💡 Explanation: </span>{q.explanation}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
            {selected[current] !== null && !revealed && (
              <button onClick={() => setRevealed(true)} style={{ padding: '12px 22px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.4)', color: '#c4b5fd', fontFamily: "'Sora', sans-serif" }}>
                Check Answer
              </button>
            )}
            {(revealed || selected[current] !== null) && (
              <button onClick={handleNext} style={{ padding: '12px 28px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', border: 'none', color: '#fff', fontFamily: "'Sora', sans-serif" }}>
                {current < activeQuiz.questions.length - 1 ? 'Next →' : 'Finish Quiz ✓'}
              </button>
            )}
          </div>
        </div>

        {/* Bottom answered count */}
        <div style={{ marginTop: 20, fontSize: 13, color: '#6b7280' }}>
          {answeredCount} of {activeQuiz.questions.length} answered
        </div>

        <style>{`
          @keyframes slideIn { from { opacity:0; transform:translateX(20px) } to { opacity:1; transform:translateX(0) } }
          @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        `}</style>
      </div>
    )
  }

  // ── RESULT VIEW ────────────────────────────────────────────
  if (view === 'result' && activeQuiz) {
    const passed = score >= activeQuiz.passMark
    const correct = activeQuiz.questions.filter((q, i) => selected[i] === q.correct).length
    const grade = score >= 90 ? { label: 'Excellent!', icon: '🏆', color: '#fbbf24' }
      : score >= 75 ? { label: 'Great Job!', icon: '🌟', color: '#4ade80' }
      : score >= 60 ? { label: 'Good Effort', icon: '👍', color: '#22d3ee' }
      : { label: 'Keep Trying', icon: '💪', color: '#f87171' }

    return (
      <div style={{ minHeight: '100vh', background: '#0d0d1a', color: '#e2e2ff', fontFamily: "'Sora', sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px 60px' }}>
        <button onClick={() => navigate('/')} style={{ position: 'absolute', top: 20, left: 20, background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)', color: '#a78bfa', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', zIndex: 10 }}>← Back to Home</button>
        <div style={{ width: '100%', maxWidth: 600 }}>

          {/* Score circle */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto 20px' }}>
              <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="70" cy="70" r="60" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
                <circle cx="70" cy="70" r="60" fill="none" stroke={passed ? '#4ade80' : '#f87171'} strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 60}`} strokeDashoffset={`${2 * Math.PI * 60 * (1 - score / 100)}`}
                  strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.5s ease', filter: `drop-shadow(0 0 8px ${passed ? '#4ade80' : '#f87171'})` }} />
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                <div style={{ fontSize: 30, fontWeight: 800, color: passed ? '#4ade80' : '#f87171' }}>{score}%</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>Score</div>
              </div>
            </div>
            <div style={{ fontSize: 36, marginBottom: 6 }}>{grade.icon}</div>
            <h2 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 6px', color: grade.color }}>{grade.label}</h2>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: passed ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)', border: `1px solid ${passed ? 'rgba(74,222,128,0.4)' : 'rgba(248,113,113,0.4)'}`, borderRadius: 20, padding: '6px 18px', fontSize: 13, fontWeight: 700, color: passed ? '#4ade80' : '#f87171' }}>
              {passed ? '✓ Quiz Passed' : `✗ Need ${activeQuiz.passMark}% to pass`}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
            {[
              { label: 'Correct', value: correct, color: '#4ade80', icon: '✅' },
              { label: 'Wrong', value: activeQuiz.questions.length - correct, color: '#f87171', icon: '❌' },
              { label: 'Score', value: `${score}%`, color: grade.color, icon: '⭐' },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${s.color}33`, borderRadius: 14, padding: '18px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Answer Review */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 16, padding: '20px', marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#a78bfa', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>Answer Review</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activeQuiz.questions.map((qs, i) => {
                const ok = selected[i] === qs.correct
                return (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px', borderRadius: 10, background: ok ? 'rgba(74,222,128,0.06)' : 'rgba(248,113,113,0.06)', border: `1px solid ${ok ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}` }}>
                    <span style={{ fontSize: 14, flexShrink: 0, marginTop: 2 }}>{ok ? '✅' : '❌'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: '#c4b5fd', fontWeight: 600, marginBottom: 4 }}>Q{i + 1}. {qs.question}</div>
                      {!ok && selected[i] !== null && (
                        <div style={{ fontSize: 11, color: '#f87171' }}>Your answer: {qs.options[selected[i]!]}</div>
                      )}
                      <div style={{ fontSize: 11, color: '#4ade80' }}>Correct: {qs.options[qs.correct]}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setView('list')} style={{ flex: 1, padding: '13px', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#c4b5fd', fontFamily: "'Sora', sans-serif" }}>
              ← All Quizzes
            </button>
            <button onClick={() => startQuiz(activeQuiz)} style={{ flex: 1, padding: '13px', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#94a3b8', fontFamily: "'Sora', sans-serif" }}>
              ↺ Retry
            </button>
            {passed && (
              <button style={{ flex: 1, padding: '13px', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', background: 'linear-gradient(135deg, #4ade80, #16a34a)', border: 'none', color: '#fff', fontFamily: "'Sora', sans-serif" }}>
                🏆 Get Certificate
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return null
}
