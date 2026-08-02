import cv2
import numpy as np
import sys
import os
from contextlib import redirect_stderr
from io import StringIO

_mp_available = False
_has_solutions = False
_face_mesh = None

def _try_import_mediapipe():
    global _mp_available, _has_solutions, _face_mesh
    if _face_mesh is not None:
        return
    try:
        import mediapipe as mp
        _has_solutions = hasattr(mp, 'solutions')
        if _has_solutions:
            try:
                devnull = open(os.devnull, 'w')
                old_stderr_fd = os.dup(2)
                old_stderr_py = sys.stderr
                sys.stderr = devnull
                os.dup2(devnull.fileno(), 2)
                try:
                    mp_face_mesh = mp.solutions.face_mesh
                    _face_mesh = mp_face_mesh.FaceMesh(
                        max_num_faces=1,
                        refine_landmarks=True,
                        min_detection_confidence=0.5,
                        min_tracking_confidence=0.5,
                    )
                except Exception:
                    _face_mesh = None
                finally:
                    sys.stderr = old_stderr_py
                    os.dup2(old_stderr_fd, 2)
                    os.close(old_stderr_fd)
                    devnull.close()
                _mp_available = _face_mesh is not None
            except Exception:
                _face_mesh = None
                _mp_available = False
        else:
            _mp_available = False
    except Exception:
        _mp_available = False
        _has_solutions = False


class FaceAnalyzer:
    def __init__(self):
        self._mesh = None
        self._mp_available = False
        self.frame_count = 0
        self._init_mp = False

    def _ensure_mp(self):
        if not self._init_mp:
            self._init_mp = True
            _try_import_mediapipe()
            self._mesh = _face_mesh
            self._mp_available = _mp_available and self._mesh is not None

    def analyze_frame(self, frame):
        self._ensure_mp()
        self.frame_count += 1
        h, w, _ = frame.shape
        result = {
            "face_detected": False,
            "eye_contact_score": 0.0,
            "confidence_score": 0.0,
            "face_landmarks": None,
            "mouth_open": False,
            "head_pose": {"pitch": 0.0, "yaw": 0.0, "roll": 0.0},
        }

        if self._mp_available and self._mesh is not None:
            try:
                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                face_results = self._mesh.process(rgb)
                if face_results and face_results.multi_face_landmarks:
                    result["face_detected"] = True
                    landmarks = face_results.multi_face_landmarks[0]
                    result["face_landmarks"] = [[lm.x, lm.y, lm.z] for lm in landmarks.landmark]
                    result["eye_contact_score"] = self._calc_eye_contact(landmarks, w, h)
                    result["mouth_open"] = self._is_mouth_open(landmarks, w, h)
                    nose_tip = landmarks.landmark[1]
                    nose_tip_x = nose_tip.x * w
                    nose_tip_y = nose_tip.y * h
                    face_center_x = w / 2
                    face_center_y = h / 2
                    head_offset = np.sqrt((nose_tip_x - face_center_x) ** 2 + (nose_tip_y - face_center_y) ** 2)
                    result["head_pose"]["yaw"] = min(head_offset / (w / 2), 1.0)
                    result["confidence_score"] = 0.5
            except Exception:
                pass

        if not result["face_detected"]:
            result = self._opencv_fallback(frame, result)

        return result

    def _calc_eye_contact(self, landmarks, w, h):
        LEFT_EYE = [33, 133, 160, 159, 158, 157, 173]
        RIGHT_EYE = [362, 263, 385, 386, 387, 388, 466]
        try:
            left = self._ear(landmarks, LEFT_EYE, w, h)
            right = self._ear(landmarks, RIGHT_EYE, w, h)
            return min(max((left + right) / 2.0 * 3.0, 0.0), 1.0)
        except Exception:
            return 0.5

    def _ear(self, landmarks, indices, w, h):
        try:
            points = [(landmarks.landmark[i].x * w, landmarks.landmark[i].y * h) for i in indices if i < len(landmarks.landmark)]
            if len(points) < 6:
                return 0.0
            v1 = np.linalg.norm(np.array(points[1]) - np.array(points[5]))
            v2 = np.linalg.norm(np.array(points[2]) - np.array(points[4]))
            h_len = np.linalg.norm(np.array(points[0]) - np.array(points[3]))
            return (v1 + v2) / (2.0 * h_len) if h_len > 0 else 0.0
        except Exception:
            return 0.0

    def _is_mouth_open(self, landmarks, w, h):
        try:
            upper = landmarks.landmark[13]
            lower = landmarks.landmark[14]
            if upper.visibility < 0.5 or lower.visibility < 0.5:
                return False
            return abs(upper.y - lower.y) * h > h * 0.04
        except Exception:
            return False

    def _opencv_fallback(self, frame, result):
        try:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            face_cascade = cv2.CascadeClassifier(cascade_path)
            if face_cascade.empty():
                result["face_detected"] = False
                result["confidence_score"] = 0.3
                result["eye_contact_score"] = 0.5
                return result
            faces = face_cascade.detectMultiScale(gray, 1.1, 4)
            if len(faces) > 0:
                result["face_detected"] = True
                result["confidence_score"] = 0.7
                result["eye_contact_score"] = 0.5
        except Exception:
            result["face_detected"] = False
            result["confidence_score"] = 0.3
            result["eye_contact_score"] = 0.5
        return result

    def calculate_body_language_score(self, frame_count, face_detected_count, eye_contact_avg, confidence_avg):
        if frame_count == 0:
            return 0.0
        detection_rate = face_detected_count / frame_count
        eye_contact_factor = min(eye_contact_avg * 2.0, 1.0)
        base_score = detection_rate * 0.4 + eye_contact_factor * 0.4 + confidence_avg * 0.2
        return round(min(max(base_score, 0.0), 1.0) * 100, 1)

    def close(self):
        if self._mesh:
            try:
                self._mesh.close()
            except Exception:
                pass
