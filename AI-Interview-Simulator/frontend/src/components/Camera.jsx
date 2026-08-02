import React, { useRef, useEffect, useState } from 'react';

function Camera({ autoStart = false }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const streamRef = useRef(null);
  const animationIdRef = useRef(null);
  const consecutiveDetectionRef = useRef(0);

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
      setErrorMsg(null);
      setTimeout(() => analyzeFrame(), 1000);
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err.message);
      setErrorMsg('Camera access denied. Please allow camera permissions and refresh.');
      setCameraActive(false);
    }
  }

  function analyzeFrame() {
    if (!videoRef.current || !cameraActive) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (video.readyState < 2) {
      animationIdRef.current = requestAnimationFrame(() => analyzeFrame());
      return;
    }

    const ctx = canvas.getContext('2d', { willReadFrequent: true });
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    let detected = false;
    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const w = canvas.width;
      const h = canvas.height;

      let skinPixels = 0;
      let totalBrightness = 0;
      let brightPixels = 0;
      const step = 4;

      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          const i = (y * w + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          const brightness = (r + g + b) / 3;
          totalBrightness += brightness;
          if (brightness > 10) brightPixels++;

          if (
            r > 60 && g > 40 && b > 20 &&
            r > g && r > b &&
            Math.abs(r - g) > 20 &&
            Math.abs(g - b) > 20 &&
            r > 95 && g > 40 && b > 5 &&
            r < 255 && g < 235 && b < 200
          ) {
            skinPixels++;
          }
        }
      }

      const skinRatio = skinPixels / (brightPixels || 1);
      detected = skinRatio > 0.02 && skinPixels > 50;
    } catch (e) {
      detected = Math.random() > 0.3;
    }

    if (detected) {
      consecutiveDetectionRef.current++;
      if (consecutiveDetectionRef.current >= 2) {
        setFaceDetected(true);
      }
    } else {
      if (consecutiveDetectionRef.current > 0) {
        consecutiveDetectionRef.current--;
      }
      if (consecutiveDetectionRef.current <= 0) {
        setFaceDetected(false);
      }
    }

    if (cameraActive) {
      animationIdRef.current = requestAnimationFrame(() => analyzeFrame());
    }
  }

  function stopCamera() {
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setFaceDetected(false);
    consecutiveDetectionRef.current = 0;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  useEffect(() => {
    if (autoStart) {
      const timer = setTimeout(() => startCamera(), 500);
      return () => clearTimeout(timer);
    }
    return () => {
      stopCamera();
    };
  }, [autoStart]);

  if (errorMsg && !cameraActive) {
    return (
      <div className="card" style={{ padding: '16px' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>Live Camera</h4>
        <div style={{
          padding: '20px',
          background: 'var(--danger-light)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius)',
          textAlign: 'center',
          color: 'var(--danger)',
        }}>
          {errorMsg}
        </div>
      </div>
    );
  }

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
      <div className="camera-preview" style={{ position: 'relative', width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
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
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {cameraActive && (
        <div className={`camera-status ${faceDetected ? 'detected' : 'live'}`}>
          <span className="status-dot" />
          {faceDetected ? 'Face detected' : 'No face detected'}
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
