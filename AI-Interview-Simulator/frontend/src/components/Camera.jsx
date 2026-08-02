import React, { useRef, useEffect, useState } from 'react';

function Camera({ autoStart = false }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const faceCanvasRef = useRef(null);
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
        videoRef.current.play().catch(() => {});
      }
      streamRef.current = stream;
      setCameraActive(true);
      setErrorMsg(null);
      setTimeout(() => analyzeFrame(), 300);
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
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
    }
    ctx.save();
    ctx.scale(-1, 1);
    ctx.translate(-canvas.width, 0);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    let detected = false;
    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const w = canvas.width;
      const h = canvas.height;

      let skinPixels = 0;
      const step = 3;
      const totalPixels = (w * h) / (step * step);

      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          const i = (y * w + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          const brightness = (r + g + b) / 3;

          if (brightness > 5) {
            if (
              r > 50 && g > 30 && b > 15 &&
              r > g && r > b &&
              r < 255 && g < 255 && b < 200 &&
              Math.abs(r - g) > 5 &&
              Math.abs(g - b) > 5
            ) {
              skinPixels++;
            }
          }
        }
      }

      const skinRatio = skinPixels / totalPixels;
      detected = skinRatio > 0.01 && skinPixels > 30;
    } catch (e) {
      detected = false;
    }

    if (detected) {
      consecutiveDetectionRef.current++;
      if (consecutiveDetectionRef.current >= 3) {
        setFaceDetected(true);
      }
    } else {
      if (consecutiveDetectionRef.current > 0) {
        consecutiveDetectionRef.current--;
      }
      if (consecutiveDetectionRef.current === 0) {
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
  }

  useEffect(() => {
    if (autoStart && !cameraActive) {
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
          <div className="camera-placeholder" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <span>Camera Off</span>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {cameraActive && (
        <div className={`camera-status ${faceDetected ? 'detected' : 'live'}`}>
          <span className="status-dot" />
          {faceDetected ? 'Live' : 'Live'}
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
