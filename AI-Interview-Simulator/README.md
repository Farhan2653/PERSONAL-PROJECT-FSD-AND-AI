# AI Interview Simulator

An AI-powered interview preparation platform that analyzes face, voice, confidence, and body language in real-time, then generates a confidence score, communication rating, grammar assessment, body language evaluation, and hiring probability — imitating interviewers from Google, Amazon, Meta, and Microsoft.

## Features

- **Real-time Camera Analysis** — Face detection, eye contact tracking, and body language monitoring via webcam
- **Voice & Grammar Analysis** — NLP-based scoring of your spoken answers for grammar, clarity, and filler words
- **AI Scoring** — Confidence Score, Communication, Grammar, Body Language, Voice Quality, and Hiring Probability
- **Interviewer Personalities** — Choose from Google, Amazon, Meta, or Microsoft interviewers with company-specific questions and evaluation criteria
- **Real-time Feedback Dashboard** — Visual score cards with progress tracking during the interview

## Project Structure

```
AI-Interview-Simulator/
├── backend/
│   ├── main.py                  # FastAPI application
│   ├── requirements.txt         # Python dependencies
│   ├── analysis/
│   │   ├── face_analysis.py     # Face/eye contact detection (MediaPipe + OpenCV)
│   │   ├── voice_analysis.py    # Grammar, communication, filler word analysis
│   │   ├── body_language.py     # Pose estimation and body language scoring
│   │   └── scoring.py           # Scoring engine with hiring probability
│   └── interview_data/
│       └── interviewers.json    # Company-specific interviewer profiles & questions
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── src/
│   │   ├── main.jsx             # React entry point
│   │   ├── App.jsx              # Main application with interview flow
│   │   ├── index.css            # Global styles
│   │   ├── components/
│   │   │   ├── InterviewerSelect.jsx   # Company selector UI
│   │   │   ├── QuestionPanel.jsx       # Interview question & answer input
│   │   │   ├── Camera.jsx             # Webcam feed with face detection
│   │   │   ├── Dashboard.jsx          # Results & score display
│   │   │   └── ScoreCard.jsx          # Individual score card component
│   │   ├── hooks/
│   │   │   ├── useCamera.js           # Camera management hook
│   │   │   └── useAnalysis.js         # Analysis API hook
│   │   └── utils/
│   │       ├── scoring.js             # Client-side scoring utilities
│   │       └── interviewerData.js     # Mock interviewer data
│   └── dist/                        # Production build output
```

## Quick Start

### Prerequisites
- Node.js v22+ and npm
- Python 3.13+

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` in your browser. The frontend proxies API calls to `http://localhost:8000`.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/interviewers` | List all interviewer companies |
| GET | `/api/interviewers/{company}` | Get questions and persona for a company |
| POST | `/api/analyze/full` | Full analysis with transcript + scores |
| POST | `/api/analyze/transcript` | Analyze voice/grammar from transcript |
| POST | `/api/analyze/body` | Analyze body language from frame data |
| POST | `/api/interview/evaluate` | Complete interview evaluation |

## Interviewer Modes

| Company | Style | Focus Areas |
|---------|-------|-------------|
| Google | Technical & analytical | Problem-solving, system design, coding |
| Amazon | Leadership principles | Ownership, customer obsession, results |
| Meta | Product & growth | Product sense, system design, impact |
| Microsoft | Growth mindset & collaboration | Technical skills, teamwork, learning |

## Technology Stack

- **Frontend**: React 18, Vite, CSS3
- **Backend**: FastAPI, Python
- **AI/ML**: MediaPipe (face mesh, pose estimation), OpenCV, NLTK, scikit-learn
- **Computer Vision**: Face mesh for eye contact, pose estimation for body language