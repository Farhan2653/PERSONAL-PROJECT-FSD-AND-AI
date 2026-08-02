import cv2
import numpy as np
import sys
from io import StringIO

_has_mediapipe = False
_pose = None
_init_attempted = False

def _try_init_mediapipe():
    global _has_mediapipe, _pose, _init_attempted
    if _init_attempted:
        return
    _init_attempted = True
    try:
        import mediapipe as mp
        if hasattr(mp, 'solutions'):
            try:
                _mp_pose = mp.solutions.pose
                old_stderr = sys.stderr
                sys.stderr = StringIO()
                _pose = _mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5)
                sys.stderr = old_stderr
                _has_mediapipe = True
            except Exception:
                sys.stderr = old_stderr
                _pose = None
                _has_mediapipe = False
        else:
            _has_mediapipe = False
    except Exception:
        _has_mediapipe = False


class BodyLanguageAnalyzer:
    def __init__(self):
        self._pose = None
        self._mp_available = False
        self._init_attempted = False

    def _ensure_mp(self):
        if not self._init_attempted:
            self._init_attempted = True
            _try_init_mediapipe()
            self._pose = _pose
            self._mp_available = _has_mediapipe

    def analyze_frame(self, frame):
        self._ensure_mp()
        result = {
            "pose_detected": False,
            "open_posture": 0.0,
            "leaning_forward": 0.0,
            "arm_crossed": False,
            "head_nod": False,
        }

        if self._mp_available and self._pose is not None:
            try:
                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                pose_results = self._pose.process(rgb)
                if pose_results and pose_results.pose_landmarks:
                    result["pose_detected"] = True
                    lm = pose_results.pose_landmarks.landmark
                    l_shoulder = lm[11]
                    r_shoulder = lm[12]
                    l_elbow = lm[13]
                    r_elbow = lm[14]
                    l_hip = lm[23]
                    r_hip = lm[24]
                    shoulder_w = abs(l_shoulder.x - r_shoulder.x)
                    elbow_d = np.sqrt((l_elbow.x - r_elbow.x) ** 2 + (l_elbow.y - r_elbow.y) ** 2)
                    if shoulder_w > 0:
                        result["open_posture"] = min(elbow_d / shoulder_w, 1.0)
                        result["arm_crossed"] = elbow_d < shoulder_w * 0.4 and (l_elbow.y + r_elbow.y) / 2 < (l_shoulder.y + r_shoulder.y) / 2
                    s_y = (l_shoulder.y + r_shoulder.y) / 2
                    h_y = (l_hip.y + r_hip.y) / 2
                    result["leaning_forward"] = min(max(s_y - h_y, 0.0) * 5.0, 1.0)
                    head_nod = abs((lm[2].y + lm[5].y) / 2 - lm[0].y)
                    result["head_nod"] = head_nod < 0.03
            except Exception:
                pass

        return result

    def calculate_body_language_score(self, frames_analysis):
        if not frames_analysis:
            return 0.0
        total = len(frames_analysis)
        if total == 0:
            return 0.0
        open_avg = sum(f.get("open_posture", 0) for f in frames_analysis) / total
        lean_avg = sum(f.get("leaning_forward", 0) for f in frames_analysis) / total
        detected_rate = sum(1 for f in frames_analysis if f.get("pose_detected")) / total
        arm_cross = sum(1 for f in frames_analysis if f.get("arm_crossed")) / total
        nod_count = sum(1 for f in frames_analysis if f.get("head_nod")) / total
        base = detected_rate * 0.3 + open_avg * 0.25 + lean_avg * 0.2 + nod_count * 0.15 - arm_cross * 0.1
        return round(min(max(base, 0.0), 1.0) * 100, 1)

    def close(self):
        if self._pose:
            try:
                self._pose.close()
            except Exception:
                pass
