export function calculateOverallScore(scores) {
  if (!scores) return 0;
  const { confidenceScore = 0, communicationScore = 0, grammarScore = 0, voiceScore = 0, bodyLanguageScore = 0, eyeContactScore = 0 } = scores;
  const total = confidenceScore + communicationScore + grammarScore + voiceScore + bodyLanguageScore + eyeContactScore;
  return Math.round(total / 6);
}

export function getScoreColor(score) {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#fbbc04';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

export function getScoreLabel(score) {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Strong';
  if (score >= 55) return 'Good';
  if (score >= 40) return 'Average';
  return 'Needs Work';
}