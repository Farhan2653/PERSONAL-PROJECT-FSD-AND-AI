import os
import json
import uuid
import asyncio
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from analysis.face_analysis import FaceAnalyzer
from analysis.voice_analysis import VoiceAnalyzer
from analysis.body_language import BodyLanguageAnalyzer
from analysis.scoring import ScoringEngine

app = FastAPI(title="AI Interview Simulator", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

face_analyzer = FaceAnalyzer()
voice_analyzer = VoiceAnalyzer()
body_analyzer = BodyLanguageAnalyzer()
scoring_engine = ScoringEngine()

FRONTEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend", "dist")


class AnalysisRequest(BaseModel):
    transcript: Optional[str] = ""
    company: str = "google"
    duration_seconds: float = 0.0


class FrameData(BaseModel):
    company: str = "google"
    frame_count: int = 0
    face_detected_count: int = 0
    eye_contact_values: List[float] = []
    confidence_values: List[float] = []


@app.get("/api/interviewers")
def list_interviewers():
    return scoring_engine.interviewers


@app.get("/api/interviewers/{company}")
def get_interviewer(company: str):
    data = scoring_engine.get_interviewer(company.lower())
    if not data:
        raise HTTPException(status_code=404, detail=f"Interviewer '{company}' not found")
    persona = scoring_engine.get_interviewer_persona(company)
    questions = scoring_engine.get_questions(company)
    return {"persona": persona, "questions": questions}


@app.post("/api/analyze/transcript")
async def analyze_transcript(request: AnalysisRequest):
    voice_result = voice_analyzer.analyze_text(request.transcript)

    confidence_score = min(100.0, max(0.0, 50.0 + request.duration_seconds * 0.5))
    communication_score = voice_result["communication_score"]
    grammar_score = voice_result["grammar_score"]

    voice_score = voice_analyzer.calculate_voice_score(request.transcript)

    return {
        "transcript": request.transcript,
        "voiceAnalysis": voice_result,
        "scores": {
            "confidenceScore": round(confidence_score, 1),
            "communicationScore": communication_score,
            "grammarScore": grammar_score,
            "voiceScore": voice_score,
        },
    }


@app.post("/api/analyze/voice")
async def analyze_voice(request: AnalysisRequest):
    voice_result = voice_analyzer.analyze_text(request.transcript or "")
    voice_score = voice_analyzer.calculate_voice_score(request.transcript or "")
    return voice_result | {"voiceScore": voice_score}


@app.post("/api/analyze/body")
async def analyze_body(request: FrameData):
    result = face_analyzer.analyze_frame(_generate_placeholder_frame())
    body_score = body_analyzer.calculate_body_language_score([])
    return {
        "faceAnalysis": result,
        "bodyLanguageScore": body_score,
    }


def _generate_placeholder_frame():
    import numpy as np
    return np.zeros((480, 640, 3), dtype=np.uint8)


@app.post("/api/analyze/full")
async def full_analysis(request: AnalysisRequest):
    voice_result = voice_analyzer.analyze_text(request.transcript or "")
    voice_score = voice_analyzer.calculate_voice_score(request.transcript or "")

    confidence_score = min(100.0, max(0.0, 40.0 + (request.duration_seconds or 0) * 0.3))
    communication_score = voice_result["communication_score"]
    grammar_score = voice_result["grammar_score"]

    face_result = {"face_detected": False, "eye_contact_score": 0.0, "confidence_score": 0.0, "face_landmarks": None, "mouth_open": False, "head_pose": {"pitch": 0.0, "yaw": 0.0, "roll": 0.0}}
    try:
        face_result = face_analyzer.analyze_frame(_generate_placeholder_frame())
    except Exception:
        pass

    eye_contact_score = face_result.get("eye_contact_score", 0.0) * 100
    confidence_from_face = face_result.get("confidence_score", 0.0) * 100
    body_score = body_analyzer.calculate_body_language_score([])

    combined_confidence = round(
        (confidence_score + confidence_from_face) / 2.0, 1
    )

    scores = {
        "confidenceScore": combined_confidence,
        "communicationScore": communication_score,
        "grammarScore": grammar_score,
        "voiceScore": voice_score,
        "bodyLanguageScore": body_score,
        "eyeContactScore": round(eye_contact_score, 1),
    }

    hiring_prob = scoring_engine.calculate_hiring_probability(scores)

    return {
        "scores": scores,
        "hiringProbability": hiring_prob,
        "voiceAnalysis": voice_result,
        "faceAnalysis": face_result,
        "company": request.company,
        "interviewer": scoring_engine.get_interviewer_persona(request.company),
        "recommendation": scoring_engine.generate_score_report(scores, request.company)["recommendation"],
    }


@app.post("/api/interview/evaluate")
async def evaluate_interview(request: AnalysisRequest):
    scores = {
        "confidenceScore": 0.0,
        "communicationScore": 0.0,
        "grammarScore": 0.0,
        "voiceScore": 0.0,
        "bodyLanguageScore": 0.0,
    }

    if request.transcript:
        voice_result = voice_analyzer.analyze_text(request.transcript)
        scores["communicationScore"] = voice_result["communication_score"]
        scores["grammarScore"] = voice_result["grammar_score"]
        scores["voiceScore"] = voice_analyzer.calculate_voice_score(request.transcript)
        scores["confidenceScore"] = min(100.0, 30.0 + len(request.transcript.split()) * 0.5)
        scores["bodyLanguageScore"] = 50.0

    hiring_prob = scoring_engine.calculate_hiring_probability(scores)
    report = scoring_engine.generate_score_report(scores, request.company)

    return report


@app.get("/api/interview/questions/{company}")
def get_questions(company: str):
    questions = scoring_engine.get_questions(company)
    return {"company": company, "questions": questions}


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "AI Interview Simulator"}


try:
    if os.path.exists(FRONTEND_DIR):
        app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")

        @app.get("/{full_path:path}")
        async def serve_frontend(full_path: str):
            path = os.path.join(FRONTEND_DIR, full_path)
            if os.path.exists(path) and os.path.isfile(path):
                return FileResponse(path)
            return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))
except Exception:
    pass
