import React, { useRef, useEffect, useState } from 'react';
import { FaceDetector } from '@mediapipe/face_detection';

function Camera({ autoStart = false }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceDetectionReady, setFaceDetectionReady] = useState(false);
  const streamRef = useRef(null);
  const faceDetectorRef = useRef(null);
  const rafIdRef = useRef(null);
  const lastFaceTimeRef = useRef(0);

  useEffect(() => {
    const faceDetector = new FaceDetector({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.4.1628005423/${file}`;
      },
    });
    faceDetector.setOptions({
      model: 'short',
      minDetectionConfidence: 0.5,
    });
    faceDetector.onResults((results) => {
      const now = Date.now();
      const hasFaces = results.detections && results.detections.length > 0;
      if (hasFaces) {
        lastFaceTimeRef.current = now;
        setFaceDetected(true);
        drawFaceResults(results);
      }
    });
    faceDetectorRef.current = faceDetector;
    setFaceDetectionReady(true);

    return () => {
      if (faceDetector) {
        faceDetector.close();
      }
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  function drawFaceResults(results) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(-1, 1);
    ctx.translate(-canvas.width, 0);

    const video = videoRef.current;
    if (video) {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 3;
      ctx.fillStyle = 'rgba(74, 222, 128, 0.1)';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'left';

      if (results.detections && results.detections.length > 0) {
        results.detections.forEach((detection) => {
          const box = detection.boundingBox;
          if (box) {
            const x = (box.xCenter - box.width / 2) * canvas.width;
            const y = (box.yCenter - box.height / 2) * canvas.height;
            const w = box.width * canvas.width;
            const h = box.height * canvas.height;
            ctx.strokeRect(x, y, w, h);
            ctx.fillRect(x, y, w, h);
            ctx.fillText('Face detected', x + 4, y + 16);
          }
        });
      }
    }

    ctx.restore();
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: true,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => detectFaces(), 500);
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err.message);
      setCameraActive(false);
    }
  }

  async function detectFaces() {
    if (!videoRef.current || !cameraActive || !faceDetectorRef.current) return;
    const video = videoRef.current;
    if (video.readyState < 2) {
      rafIdRef.current = requestAnimationFrame(() => detectFaces());
      return;
    }

    try {
      await faceDetectorRef.current.send({ image: video });
    } catch (err) {
      console.warn('Face detection error:', err);
    }

    const elapsed = Date.now() - lastFaceTimeRef.current;
    if (elapsed > 1500) {
      setFaceDetected(false);
    }

    if (cameraActive) {
      rafIdRef.current = requestAnimationFrame(() => detectFaces());
    }
  }

  function stopCamera() {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setFaceDetected(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  useEffect(() => {
    if (autoStart) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [autoStart]);

  return (
    <div className="card" style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>Live Camera</h4>
        {cameraActive ? (
          <span className="analysis-badge badge-live">Live</span>
        ) : (
          <button className="btn btn-secondary btn-sm" onClick={startCamera}>
            Start Camera
          </button>
        )}
      </div>
      <div className="camera-preview" style={{ position: 'relative', width: '100%', height: 'auto' }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{ display: cameraActive ? 'block' : 'none', width: '100%', height: 'auto', borderRadius: '8px' }}
        />
        {!cameraActive && (
          <div className="camera-placeholder">
            <span>Camera Off</span>
          </div>
        )}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: cameraActive ? 'block' : 'none',
            borderRadius: '8px',
            transform: 'scaleX(-1)',
          }}
        />
      </div>
      {cameraActive && (
        <div className={`camera-status ${faceDetected ? 'detected' : 'live'}`}>
          <span className="status-dot" />
          {faceDetected ? 'Face detected' : faceDetectionReady ? 'No face detected' : 'Initializing...'}
        </div>
      )}
      {cameraActive && (
        <button className="btn btn-secondary btn-sm" onClick={stopCamera} style={{ marginTop: '10px', width: '100%' }}>
          Stop Camera
        </button>
      )}
    </div>
  );
}

export default Camera;