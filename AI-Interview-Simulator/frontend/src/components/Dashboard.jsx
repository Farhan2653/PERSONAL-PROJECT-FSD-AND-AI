import React from 'react';
import ScoreCard from './ScoreCard';

function Dashboard({ scores, hiringProbability, recommendation, company, onRestart, onHistory }) {
  const scoreCards = [
    { label: 'Confidence', value: scores.confidenceScore || 0, color: '#4285F4' },
    { label: 'Communication', value: scores.communicationScore || 0, color: '#0ea5e9' },
    { label: 'Grammar', value: scores.grammarScore || 0, color: '#10b981' },
    { label: 'Voice Quality', value: scores.voiceScore || 0, color: '#f59e0b' },
    { label: 'Body Language', value: scores.bodyLanguageScore || 0, color: '#6366f1' },
    { label: 'Eye Contact', value: scores.eyeContactScore || 0, color: '#ec4899' },
  ];

  const getRecommendationClass = () => {
    if (hiringProbability >= 70) return 'good';
    if (hiringProbability >= 45) return 'moderate';
    return 'poor';
  };

  const getRecommendationLabel = () => {
    if (hiringProbability >= 70) return 'Strong Hire';
    if (hiringProbability >= 45) return 'Moderate';
    return 'Needs Improvement';
  };

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 className="section-title">Interview Results</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Prepared with {company.charAt(0).toUpperCase() + company.slice(1)} Interviewer
        </p>
      </div>

      <div className="score-grid">
        {scoreCards.map((card) => (
          <ScoreCard key={card.label} label={card.label} value={card.value} color={card.color} />
        ))}
      </div>

      <div className="hiring-probability">
        <div className="hiring-prob-label">Hiring Probability</div>
        <div className="hiring-prob-value">{hiringProbability}%</div>
        <div className={`recommendation ${getRecommendationClass()}`}>
          <strong>{getRecommendationLabel()}</strong> — {recommendation}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={onRestart}>
          Start New Interview
        </button>
        <button className="btn btn-secondary" onClick={onHistory}>
          View Past Interviews
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
