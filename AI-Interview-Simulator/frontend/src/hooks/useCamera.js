import { useEffect, useRef, useState } from 'react';

export function useCamera(onAnalysis) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [active, setActive] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [eyeContactScore, setEyeContactScore] = useState(0);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
      setActive(true);
      cycleAnalysis();
    } catch (err) {
      console.warn('Camera error:', err.message);
    }
  }

  function stop() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setActive(false);
  }

  function cycleAnalysis() {
    if (!active || !videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = 320;
    canvas.height = 240;
    if (video.readyState >= 2) {
      ctx.drawImage(video, 0, 0, 320, 240);
    }

    const imageData = ctx.getImageData(0, 0, 320, 240);
    const meanBrightness = imageData.data.reduce((s, v, i) => (i % 4 === 3 ? s : s + v), 0) / (320 * 240 * 255);
    const detected = meanBrightness > 0.05 && meanBrightness < 0.95;
    setFaceDetected(detected);

    const eyeContact = detected ? Math.min(meanBrightness * 2.5, 1.0) : 0;
    setEyeContactScore(eyeContact);

    onAnalysis?.({ faceDetected: detected, eyeContactScore: eyeContact });

    setTimeout(cycleAnalysis, 1000);
  }

  useEffect(() => {
    return stop;
  }, []);

  return { videoRef, canvasRef, active, start, stop, faceDetected, eyeContactScore };
}