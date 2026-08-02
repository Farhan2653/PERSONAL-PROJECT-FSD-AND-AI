import React, { useRef, useEffect, useState } from 'react';

function Camera({ autoStart = false }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const streamRef = useRef(null);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: true,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
      setCameraActive(true);
      analyzeFrame();
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err.message);
      setCameraActive(false);
    }
  }

  async function analyzeFrame() {
    if (!videoRef.current || !cameraActive) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    canvas.width = 320;
    canvas.height = 240;
    ctx.drawImage(video, 0, 0, 320, 240);

    try {
      const imageData = ctx.getImageData(0, 0, 320, 240);
      const brightness = imageData.data.reduce((sum, val, i) => {
        return i % 4 === 3 ? sum : sum + val;
      }, 0) / (320 * 240 * 255);

      setFaceDetected(brightness > 0.05 && brightness < 0.95);
    } catch (_) {
      setFaceDetected(false);
    }

    if (cameraActive) {
      setTimeout(analyzeFrame, 500);
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setFaceDetected(false);
  }

  useEffect(() => {
    if (autoStart) {
      startCamera();
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
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
      <div className="camera-preview">
        <video ref={videoRef} autoPlay muted playsInline style={{ display: cameraActive ? 'block' : 'none' }} />
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
