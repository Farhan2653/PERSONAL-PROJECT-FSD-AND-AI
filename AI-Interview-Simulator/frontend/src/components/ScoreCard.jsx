import React from 'react';

function ScoreCard({ label, value, color }) {
  return (
    <div className="score-card">
      <div className="score-label">{label}</div>
      <div className="score-value" style={{ color }}>{Math.round(value)}</div>
      <div className="score-bar">
        <div
          className="score-bar-fill"
          style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }}
        />
      </div>
    </div>
  );
}

export default ScoreCard;
