# Frontend-Backend Integration Guide

## Overview
The frontend has been integrated with the FastAPI backend for real-time data fetching. Mock data has been replaced with actual API calls for:
- **Register Page**: Fetches sessions from `/api/schedule/sessions` and registers participants
- **Schedule Page**: Displays live session schedule from the backend
- **FAQ Page**: Uses secure backend proxy at `/api/faq/chat` (API key is server-side)
- **Dashboard & Attendance Pages**: Prepared for integration (currently use mock data pending authentication system)

## Environment Setup

### Backend (.env)
Located in `Backend/` directory:
```
DATABASE_URL=postgresql://...
RESEND_API_KEY=your_resend_key
ANTHROPIC_API_KEY=your_anthropic_key
EMAIL_FROM=noreply@renovationfoundation.org
FRONTEND_URL=http://localhost:5173
SECRET_KEY=your_secret_key
```

### Frontend (.env.local)
Located in `Frontend/` directory:
```
VITE_API_URL=http://localhost:8000
```

## Running the Application

### Start Backend
```bash
cd Backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: `http://localhost:8000`
API Docs available at: `http://localhost:8000/docs`

### Start Frontend
```bash
cd Frontend
npm run dev
```

Frontend will be available at: `http://localhost:5173`

## API Integration Points

### 1. RegisterPage.tsx ✅
- **Fetches sessions**: `GET /api/schedule/sessions`
- **Submits registration**: `POST /api/registration/register`
- **Flow**: Browse sessions → Enter details → Register → Get Participant ID
- **Data stored**: Participant info saved to localStorage for dashboard use
- **Status**: FULLY INTEGRATED

### 2. SchedulePage.tsx ✅
- **Fetches sessions**: `GET /api/schedule/sessions`
- **Displays live/upcoming/completed sessions**
- **Status**: FULLY INTEGRATED

### 3. FAQPage.tsx ✅
- **Static FAQs**: Displayed from hardcoded categories
- **AI Chatbot**: Uses secure backend proxy at `POST /api/faq/chat`
- **Security**: API key stays on server, frontend doesn't expose credentials
- **Status**: FULLY INTEGRATED

### 4. AttendancePage.tsx ⏳
- **Current state**: Mock data (3 sessions, 4 recent check-ins)
- **Pending integration**:
  - Fetch today's sessions: `GET /api/attendance/sessions?date=today`
  - QR Check-in: `POST /api/attendance/checkin/qr`
  - OTP Check-in: `POST /api/attendance/checkin/otp`
  - Manual Check-in: `POST /api/attendance/checkin/manual`
- **Blocker**: Requires user authentication/participant ID context

### 5. DashboardPage.tsx ⏳
- **Current state**: Mock user profile and sessions
- **Pending integration**:
  - Get profile: `GET /api/dashboard/profile?user_id={id}`
  - Get sessions: `GET /api/dashboard/sessions?user_id={id}`
  - Get reminders: `GET /api/reminders/my?user_id={id}`
  - Get certificates: Certificate data included in profile response
- **Blocker**: Requires user context/authentication

## Key Features Implemented

### 1. Error Handling ✅
- Network error messages displayed to user
- API failure fallbacks
- Form validation before submission
- Failed check-ins show descriptive messages

### 2. Loading States ✅
- Loading spinners while fetching data
- Disabled buttons during submission
- Skeleton patterns for data loading

### 3. Data Persistence ✅
- Participant info saved to localStorage after registration
- Can be used for later authentication

### 4. API Utilities ✅
- Centralized API functions in `api.ts`
- Consistent error handling
- Reusable across components
- Support for authentication headers (when needed)

## Sessions Data Structure

The backend provides sessions with this structure:
```json
{
  "id": "session_id",
  "title": "Session Title",
  "date": "2026-04-10",
  "time": "10:00 AM",
  "venue": "Location",
  "mode": "online|offline|hybrid",
  "speaker": "Speaker Name OR {name, role, avatar}",
  "capacity": 100,
  "registered": 75,
  "description": "Session description",
  "tags": ["tag1", "tag2"],
  "join_link": "optional_zoom_link"
}
```

## Next Steps to Complete Integration

### Phase 1: User Authentication (Required)
1. Implement login/signup system
2. Store JWT token or session ID
3. Include auth token in API requests
4. Update Dashboard and Attendance pages to use authenticated user context

### Phase 2: Complete Remaining Pages
1. **AttendancePage**: 
   - Get participant ID from localStorage or auth
   - Fetch today's sessions
   - Implement check-in methods
   - Show real-time checkin list

2. **DashboardPage**:
   - Use participant ID to fetch user profile
   - Display registered sessions
   - Show certificates
   - Display reminders

### Phase 3: Additional Features
1. Add Certificates page integration
2. Add Quiz page integration  
3. Add Feedback submission
4. Add Reminder management
5. Add Settings page

## Testing the Integration

### Test Registration Flow
1. Go to RegisterPage
2. Browse/search sessions
3. Click "Register Now"
4. Fill in your details
5. Confirm registration
6. Get unique Participant ID
7. Check browser localStorage for participant info

### Test FAQ Chatbot
1. Go to FAQPage
2. Open chat window (bottom-right button)
3. Ask a question like "How do I register?"
4. Response comes from backend (which calls Anthropic API securely)

### Test Schedule
1. Go to SchedulePage
2. View sessions loaded from backend
3. Filter by status/mode
4. Click on session to see details

## Database Schema Expected

The backend expects these tables (auto-migrated):
- `sessions`: All available sessions
- `profiles`: User/participant profiles
- `registrations`: Session registrations (links profiles to sessions)
- `attendance`: Check-in records
- `reminders`: User reminders
- `quiz`: Quiz data
- `feedback`: Feedback submissions
- `certificates`: Generated certificates

## Troubleshooting

### "Failed to load sessions"
- Ensure backend is running at the correct URL in `.env.local`
- Check browser DevTools → Network tab for failed requests
- Verify backend database connection

### "Connection error with chatbot"
- Ensure `ANTHROPIC_API_KEY` is set in Backend `.env`
- Check that the backend `/api/faq/chat` endpoint is responding
- Verify API key has sufficient credits

### "Blank dropdown after registering"
- Data might not be syncing correctly
- Check localStorage in DevTools
- Hard refresh the page (Ctrl+Shift+R)

### 404 errors from API
- Verify backend endpoint paths match the API utility functions
- Check that all routes are properly registered in `main.py`
- Ensure request/response payload formats match

## API Reference

All centralized API calls are in `Frontend/src/api.ts`. Base URL is configurable via `VITE_API_URL`.

Available functions:
- `registerForSession()`
- `getScheduleSessions()`
- `chatWithFAQ()`
- `checkInWithQR()`
- `checkInWithOTP()`
- `getUserProfile()`
- `getUserReminders()`
- `submitFeedback()`
- And more...

## Documentation

- Backend API docs: `http://localhost:8000/docs` (when running)
- Frontend components: See individual `.tsx` files in `Frontend/src/`
- Backend routes: See files in `Backend/routes/`

## Security Notes

✅ **Secure Practices Implemented**:
1. API keys never exposed in frontend code
2. FAQ uses backend proxy for AI requests
3. Email confirmations via backend API
4. Participant data stored securely
5. CORS configured for development

⚠️ **Still Needed**:
1. HTTPS for production
2. JWT/OAuth authentication
3. Rate limiting on API endpoints
4. Input validation on all forms
5. SQL injection prevention (already handled by SQLAlchemy ORM)

