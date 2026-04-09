from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text
from db import get_db

router = APIRouter()


# ── Pydantic Models ───────────────────────────────────────────────────────────

class SubmitQuizBody(BaseModel):
    quiz_id:   str
    email:     str              # used to look up the participant
    answers:   List[Optional[int]]   # index of selected option per question, None = skipped


# ── GET /api/quiz/list ────────────────────────────────────────────────────────
# All quizzes with session info and the user's previous score if any
@router.get("/list")
def get_quiz_list(email: str = None, db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT
            q.id, q.title, q.difficulty, q.duration_seconds,
            q.pass_mark, q.total_questions,
            s.id   AS session_id,
            s.title AS session_title,
            ARRAY_AGG(DISTINCT t.name) AS tags
        FROM quizzes q
        JOIN sessions s ON s.id = q.session_id
        LEFT JOIN quiz_tags qt ON qt.quiz_id = q.id
        LEFT JOIN tags t       ON t.id = qt.tag_id
        GROUP BY q.id, s.id
        ORDER BY q.created_at DESC
    """)).fetchall()

    # Get scores for this user if email provided
    scores: dict = {}
    if email:
        score_rows = db.execute(text("""
            SELECT qa.quiz_id, qa.score_pct, qa.passed, qa.completed_at
            FROM quiz_attempts qa
            JOIN profiles p ON p.id = qa.participant_id
            WHERE p.email = :email
            ORDER BY qa.completed_at DESC
        """), {"email": email}).fetchall()
        for sr in score_rows:
            qid = str(sr.quiz_id)
            if qid not in scores:
                scores[qid] = {"score": sr.score_pct, "passed": sr.passed}

    diff_colors = {"Beginner": "#4ade80", "Intermediate": "#fb923c", "Advanced": "#f87171"}

    return {
        "quizzes": [
            {
                "id":               str(r.id),
                "session_id":       str(r.session_id),
                "session_title":    r.session_title,
                "title":            r.title,
                "difficulty":       r.difficulty,
                "difficulty_color": diff_colors.get(r.difficulty, "#a78bfa"),
                "duration":         r.duration_seconds,
                "total_questions":  r.total_questions,
                "pass_mark":        r.pass_mark,
                "tags":             [t for t in (r.tags or []) if t],
                "completed":        str(r.id) in scores,
                "score":            scores.get(str(r.id), {}).get("score"),
                "passed":           scores.get(str(r.id), {}).get("passed"),
            }
            for r in rows
        ]
    }


# ── GET /api/quiz/{quiz_id}/questions ─────────────────────────────────────────
# Returns questions WITHOUT correct answers (frontend shows them after selection)
@router.get("/{quiz_id}/questions")
def get_quiz_questions(quiz_id: str, db: Session = Depends(get_db)):
    quiz = db.execute(text("""
        SELECT q.id, q.title, q.difficulty, q.duration_seconds, q.pass_mark,
               s.title AS session_title
        FROM quizzes q
        JOIN sessions s ON s.id = q.session_id
        WHERE q.id = :qid
    """), {"qid": quiz_id}).fetchone()

    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    questions = db.execute(text("""
        SELECT id, question_text, options, correct_index, explanation, order_num
        FROM quiz_questions
        WHERE quiz_id = :qid
        ORDER BY order_num
    """), {"qid": quiz_id}).fetchall()

    return {
        "quiz": {
            "id":            str(quiz.id),
            "title":         quiz.title,
            "session_title": quiz.session_title,
            "difficulty":    quiz.difficulty,
            "duration":      quiz.duration_seconds,
            "pass_mark":     quiz.pass_mark,
        },
        "questions": [
            {
                "id":          str(q.id),
                "question":    q.question_text,
                "options":     q.options,             # JSON array stored in DB
                "correct":     q.correct_index,       # sent so frontend can show answer
                "explanation": q.explanation or "",
                "order":       q.order_num,
            }
            for q in questions
        ],
    }


# ── POST /api/quiz/submit ─────────────────────────────────────────────────────
@router.post("/submit")
def submit_quiz(body: SubmitQuizBody, db: Session = Depends(get_db)):
    # Get quiz meta
    quiz = db.execute(text("""
        SELECT id, pass_mark, total_questions FROM quizzes WHERE id = :qid
    """), {"qid": body.quiz_id}).fetchone()

    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    # Get correct answers
    questions = db.execute(text("""
        SELECT id, correct_index, explanation, question_text, options
        FROM quiz_questions
        WHERE quiz_id = :qid
        ORDER BY order_num
    """), {"qid": body.quiz_id}).fetchall()

    if len(body.answers) != len(questions):
        raise HTTPException(status_code=400, detail=f"Expected {len(questions)} answers, got {len(body.answers)}")

    # Grade
    correct_count = sum(
        1 for i, q in enumerate(questions)
        if body.answers[i] is not None and body.answers[i] == q.correct_index
    )
    score_pct = round((correct_count / len(questions)) * 100)
    passed    = score_pct >= quiz.pass_mark

    # Look up participant
    participant = db.execute(text(
        "SELECT id FROM profiles WHERE email = :email"
    ), {"email": body.email}).fetchone()

    if participant:
        # Upsert attempt — allow retries, keep best score
        db.execute(text("""
            INSERT INTO quiz_attempts (quiz_id, participant_id, score_pct, passed, answers_json)
            VALUES (:qid, :pid, :score, :passed, :answers::jsonb)
            ON CONFLICT (quiz_id, participant_id)
            DO UPDATE SET
                score_pct    = GREATEST(quiz_attempts.score_pct, EXCLUDED.score_pct),
                passed       = EXCLUDED.passed,
                answers_json = EXCLUDED.answers_json,
                completed_at = now()
        """), {
            "qid":     body.quiz_id,
            "pid":     participant.id,
            "score":   score_pct,
            "passed":  passed,
            "answers": str(body.answers),
        })
        db.commit()

    # Build detailed review
    review = [
        {
            "question":   q.question_text,
            "options":    q.options,
            "your_answer":body.answers[i],
            "correct":    q.correct_index,
            "is_correct": body.answers[i] == q.correct_index,
            "explanation":q.explanation or "",
        }
        for i, q in enumerate(questions)
    ]

    grade_label = (
        "Excellent!" if score_pct >= 90 else
        "Great Job!" if score_pct >= 75 else
        "Good Effort" if score_pct >= 60 else
        "Keep Trying"
    )

    return {
        "score":         score_pct,
        "correct":       correct_count,
        "total":         len(questions),
        "passed":        passed,
        "pass_mark":     quiz.pass_mark,
        "grade_label":   grade_label,
        "review":        review,
    }


# ── GET /api/quiz/{quiz_id}/stats ─────────────────────────────────────────────
# Admin: aggregated quiz stats
@router.get("/{quiz_id}/stats")
def get_quiz_stats(quiz_id: str, db: Session = Depends(get_db)):
    row = db.execute(text("""
        SELECT
            COUNT(*)                            AS attempts,
            ROUND(AVG(score_pct), 1)            AS avg_score,
            COUNT(*) FILTER (WHERE passed=TRUE) AS passed_count,
            MAX(score_pct)                      AS top_score
        FROM quiz_attempts
        WHERE quiz_id = :qid
    """), {"qid": quiz_id}).fetchone()

    return {
        "attempts":     row.attempts or 0,
        "avg_score":    float(row.avg_score) if row.avg_score else 0,
        "passed":       row.passed_count or 0,
        "top_score":    row.top_score or 0,
        "pass_rate":    round((row.passed_count / row.attempts) * 100) if row.attempts else 0,
    }


# ── GET /api/quiz/{quiz_id}/leaderboard ───────────────────────────────────────
@router.get("/{quiz_id}/leaderboard")
def get_leaderboard(quiz_id: str, limit: int = 10, db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT
            p.full_name,
            qa.score_pct,
            qa.passed,
            qa.completed_at
        FROM quiz_attempts qa
        JOIN profiles p ON p.id = qa.participant_id
        WHERE qa.quiz_id = :qid
        ORDER BY qa.score_pct DESC, qa.completed_at ASC
        LIMIT :limit
    """), {"qid": quiz_id, "limit": limit}).fetchall()

    return {
        "leaderboard": [
            {
                "rank":         i + 1,
                "name":         r.full_name,
                "score":        r.score_pct,
                "passed":       r.passed,
                "completed_at": str(r.completed_at)[:10],
            }
            for i, r in enumerate(rows)
        ]
    }
