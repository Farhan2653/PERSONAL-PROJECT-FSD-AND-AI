# AGENTS.md — AI Interview Simulator

## Project Overview
AI Interview Simulator is a full-stack web application for practicing job interviews with AI-powered real-time analysis of face, voice, confidence, eye contact, and body language.

## Architecture
- **Frontend**: React (Vite) at `frontend/` — serves UI, camera feed, scoring dashboard
- **Backend**: FastAPI at `backend/` — MediaPipe-based AI analysis, scoring engine
- **AI Analysis**: MediaPipe for face mesh/pose, OpenCV for camera, NLTK for NLP

## Key Files
- `backend/main.py` — FastAPI routes and API endpoints
- `backend/analysis/face_analysis.py` — Face detection, eye contact, confidence scoring
- `backend/analysis/voice_analysis.py` — Grammar, communication, filler word analysis
- `backend/analysis/body_language.py` — Pose estimation and posture scoring
- `backend/analysis/scoring.py` — Hiring probability and score report generation
- `backend/interview_data/interviewers.json` — Company-specific personas and questions
- `frontend/src/App.jsx` — Main app orchestrating interview flow
- `frontend/src/components/Camera.jsx` — Webcam component with face detection
- `frontend/src/components/QuestionPanel.jsx` — Interview question display and answer input
- `frontend/src/components/Dashboard.jsx` — Results dashboard with score cards
- `frontend/src/components/InterviewerSelect.jsx` — Company selector (Google, Amazon, Meta, Microsoft)

## Running the Project
1. Backend: `cd backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000`
2. Frontend: `cd frontend && npm run dev`
3. Open `http://localhost:3000`

## Known Issues
- MediaPipe solutions API requires `mediapipe<0.11` (version 0.10.x). Version 1.0.0+ has a different API.
- On Windows, PowerShell uses `;` instead of `&&` for command chaining.
- The backend gracefully degrades when camera or face detection is unavailable.