import React from 'react';

function PastInterviews({ interviews, onBack, onRestart }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCompanyColor = (company) => {
    switch (company) {
      case 'google': return '#4285F4';
      case 'amazon': return '#FF9900';
      case 'meta': return '#1877F2';
      case 'microsoft': return '#00A4EF';
      default: return '#6366f1';
    }
  };

  const getScoreColor = (value) => {
    if (value >= 70) return 'var(--success)';
    if (value >= 45) return 'var(--warning)';
    return 'var(--danger)';
  };

  const avgHiring = interviews.length > 0 
    ? Math.round(interviews.reduce((sum, i) => sum + (i.hiringProbability || 0), 0) / interviews.length)
    : 0;

  return (
    <div className="history-page">
      <div className="history-header">
        <div>
          <h2>Interview History</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            {interviews.length} session{interviews.length !== 1 ? 's' : ''} completed
          </p>
        </div>
        <button className="btn btn-secondary" onClick={onBack}>
          Back to Practice
        </button>
      </div>

      {interviews.length === 0 ? (
        <div className="history-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            <path d="M9 14l2 2 4-4"/>
          </svg>
          <p>No interviews yet. Complete your first interview to see your history here.</p>
          <button className="btn btn-primary" onClick={onRestart} style={{ marginTop: '20px' }}>
            Start Your First Interview
          </button>
        </div>
      ) : (
        <>
          <div className="history-list">
            {interviews.map((interview, idx) => (
              <div key={idx} className="history-item">
                <div className="history-date">{formatDate(interview.date)}</div>
                <div className="history-company">
                  <span 
                    className="company-dot" 
                    style={{ 
                      display: 'inline-block', 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      background: getCompanyColor(interview.company),
                      marginRight: '8px'
                    }} 
                  />
                  {interview.company?.charAt(0).toUpperCase() + interview.company?.slice(1)}
                </div>
                <div className="history-scores">
                  {interview.scores?.confidenceScore && (
                    <div className="history-score">
                      Confidence <span className="history-score-value" style={{ color: getScoreColor(interview.scores.confidenceScore) }}>{Math.round(interview.scores.confidenceScore)}</span>
                    </div>
                  )}
                  {interview.scores?.communicationScore && (
                    <div className="history-score">
                      Communication <span className="history-score-value" style={{ color: getScoreColor(interview.scores.communicationScore) }}>{Math.round(interview.scores.communicationScore)}</span>
                    </div>
                  )}
                  {interview.scores?.grammarScore && (
                    <div className="history-score">
                      Grammar <span className="history-score-value" style={{ color: getScoreColor(interview.scores.grammarScore) }}>{Math.round(interview.scores.grammarScore)}</span>
                    </div>
                  )}
                </div>
                <div className="history-hiring" style={{ color: getScoreColor(interview.hiringProbability || 0) }}>
                  {interview.hiringProbability || 0}%
                </div>
              </div>
            ))}
          </div>

          {interviews.length > 1 && (
            <div className="trends-section">
              <h3>Hiring Probability Trend</h3>
              <div className="trend-chart">
                {interviews.slice().reverse().map((interview, idx) => {
                  const value = interview.hiringProbability || 0;
                  const height = Math.max(4, (value / 100) * 140);
                  return (
                    <div key={idx} className="trend-bar-group">
                      <div className="trend-bar-value">{value}%</div>
                      <div 
                        className="trend-bar" 
                        style={{ 
                          height: `${height}px`,
                          background: value >= 70 
                            ? 'linear-gradient(to top, #10b981, #34d399)' 
                            : value >= 45 
                              ? 'linear-gradient(to top, #f59e0b, #fbbf24)' 
                              : 'linear-gradient(to top, #ef4444, #f87171)'
                        }}
                      />
                      <div className="trend-bar-label">
                        {new Date(interview.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Average hiring probability across {interviews.length} interviews: <strong style={{ color: getScoreColor(avgHiring) }}>{avgHiring}%</strong>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default PastInterviews;
