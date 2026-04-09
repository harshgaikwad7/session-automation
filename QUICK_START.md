# Quick Start - Renovatio SessionFlow

## 🚀 Getting Started

### Prerequisites
- Python 3.12+ with pip
- Node.js 18+ with npm
- PostgreSQL database (or Neon PostgreSQL)

### 1. Backend Setup

```bash
# Navigate to backend
cd Backend

# Install dependencies (already done, but verify)
pip install -r requirements.txt

# Configure your environment
# Edit .env file with your actual values:
# - DATABASE_URL (PostgreSQL connection string)
# - ANTHROPIC_API_KEY (for FAQ chatbot)
# - RESEND_API_KEY (for email confirmations)

# Run the server
python -m uvicorn main:app --reload
```

✅ Backend ready at: `http://localhost:8000`
📚 API Docs at: `http://localhost:8000/docs`

### 2. Frontend Setup

```bash
# Navigate to frontend
cd Frontend

# Install dependencies (if needed)
npm install

# Start development server
npm run dev
```

✅ Frontend ready at: `http://localhost:5173`

## 🧪 Testing the Integration

### Register & Get Participant ID
1. Open http://localhost:5173
2. Click "Register"
3. Browse sessions (loaded from backend!)
4. Click "Register Now"
5. Fill in name and email
6. Get unique Participant ID (e.g., RF-XXXXXX)

### Check FAQ Chatbot
1. Click "FAQ"
2. Open chat (bottom-right 💬 button)
3. Ask: "How do I check in?"
4. Response comes from backend (via Anthropic Claude)

### Browse Schedule
1. Click "Schedule"
2. See all sessions from backend database
3. Filter by status (Live, Upcoming, Completed)
4. Filter by mode (Online, Offline, Hybrid)

## 📊 What's Connected

| Page | Status | Features |
|------|--------|----------|
| Register | ✅ Connected | Browse sessions, register with email, get Participant ID |
| Schedule | ✅ Connected | View all sessions, live status, filter by mode |
| FAQ | ✅ Connected | Browse FAQs, AI chatbot via backend proxy |
| Attendance | ⏳ Partial | Uses mock data (needs authentication) |
| Dashboard | ⏳ Partial | Uses mock data (needs authentication) |

## ⚙️ Configuration

### Backend (.env)
```
DATABASE_URL=postgresql://user:pass@host/dbname
RESEND_API_KEY=your_resend_api_key
ANTHROPIC_API_KEY=your_anthropic_key
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:8000
```

## 🛠️ Backend Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /api/schedule/sessions | List all sessions |
| GET | /api/schedule/sessions/{id} | Get session details |
| POST | /api/registration/register | Register for session |
| POST | /api/faq/chat | Chat with AI (backend proxy) |
| GET | /api/faq/categories | Get FAQ categories |
| POST | /api/attendance/checkin/qr | Check-in with QR |
| POST | /api/attendance/checkin/otp | Check-in with OTP |
| GET | /api/dashboard/profile | Get user profile |
| GET | /api/dashboard/sessions | Get user's sessions |

Full docs: `http://localhost:8000/docs`

## 🐛 Troubleshooting

### "Failed to connect to backend"
```bash
# Check if backend is running
curl http://localhost:8000/

# Should return: {"status": "ok", "message": "SessionFlow API is running"}
```

### "Error: VITE_API_URL not found"
- Create `Frontend/.env.local` with:
  ```
  VITE_API_URL=http://localhost:8000
  ```
- Restart npm dev server

### "Anthropic API error"
- Verify `ANTHROPIC_API_KEY` is set in `Backend/.env`
- Check API key validity and credit balance

### Database connection failed
- Verify DATABASE_URL in `Backend/.env`
- Ensure PostgreSQL is running
- Check credentials are correct

## 📝 Next Steps

1. **Set up authentication** (login/signup)
2. **Complete Dashboard integration** (show user's sessions)
3. **Enable Attendance check-in** (QR, OTP, manual)
4. **Add Quiz functionality**
5. **Deploy both services** (production)

## 📚 Documentation

- [Full Integration Guide](./FRONTEND_BACKEND_INTEGRATION.md)
- [Backend README](./Backend/README.md) - if exists
- [Frontend README](./Frontend/README.md) - if exists
- API Interactive Docs: http://localhost:8000/docs (Swagger)

## ✨ Key Features

- ✅ Real-time session loading from database
- ✅ Instant participant ID generation
- ✅ AI-powered FAQ chatbot (secure backend proxy)
- ✅ Session filtering and search
- ✅ Email confirmation system
- ✅ QR-code based attendance check-in
- ✅ Auto-generated certificates

## 🚀 Production Deployment

When ready to deploy:
1. Set `FRONTEND_URL` to production domain in Backend `.env`
2. Update `VITE_API_URL` to production API domain in Frontend `.env.local`
3. Use environment variables for sensitive keys (don't commit .env files)
4. Enable HTTPS on both backend and frontend
5. Set up CI/CD pipeline for automated testing and deployment

---

**Questions?** Check the detailed guide in `FRONTEND_BACKEND_INTEGRATION.md`
