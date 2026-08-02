import { useState, useEffect, useRef } from 'react';

export function useAnalysis(company, transcript, onScoreUpdate) {
  const [scores, setScores] = useState(null);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!transcript || transcript.length < 10) return;

    setLoading(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/analyze/transcript', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript, company }),
        });
        const data = await res.json();
        setScores(data.scores || {});
        onScoreUpdate?.(data);
      } catch (err) {
        const localScores = estimateLocalScores(transcript);
        setScores(localScores);
        onScoreUpdate?.({ scores: localScores });
      } finally {
        setLoading(false);
      }
    }, 2000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [transcript]);

  return { scores, loading };
}

function estimateLocalScores(text) {
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const fillerWords = ['um', 'uh', 'like', 'you know', 'kind of', 'sort of'];
  let fillerCount = 0;
  const t = text.toLowerCase();
  fillerWords.forEach((w) => { fillerCount += t.split(w).length - 1; });

  const grammarScore = Math.max(0, Math.min(100, 70 + wordCount * 0.3 - fillerCount * 3));
  const commScore = Math.max(0, Math.min(100, 40 + wordCount * 0.4 - fillerCount * 4));
  const voiceScore = Math.round(grammarScore * 0.4 + commScore * 0.4 + Math.max(0, 100 - fillerCount * 6) * 0.2);
  const confidence = Math.min(100, 30 + wordCount * 0.4);
  const bodyLanguage = 60;

  return {
    confidenceScore: Math.round(confidence),
    communicationScore: Math.round(commScore),
    grammarScore: Math.round(grammarScore),
    voiceScore,
    bodyLanguageScore: bodyLanguage,
  };
}