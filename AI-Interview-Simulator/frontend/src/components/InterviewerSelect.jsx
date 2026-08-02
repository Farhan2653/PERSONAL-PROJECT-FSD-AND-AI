import React, { useState, useRef, useEffect, useCallback } from 'react';
import { mockInterviews } from '../utils/interviewerData';

function InterviewerSelect({ company, setCompany, onStart, customInterviewers, onSelectCustom }) {
  const [mode, setMode] = useState('preset');
  const [showCreate, setShowCreate] = useState(false);
  const [newInterviewer, setNewInterviewer] = useState({
    name: '',
    style: '',
    tagline: '',
    color: '#6366f1',
    questions: [''],
  });

  const companies = [
    { 
      id: 'google', 
      name: 'Google', 
      color: '#4285F4',
      lightColor: '#e8f0fe',
      style: 'Technical & Analytical', 
      tagline: 'Solve complex problems with rigorous analysis and system design.',
      Logo: GoogleLogo,
    },
    { 
      id: 'amazon', 
      name: 'Amazon', 
      color: '#FF9900',
      lightColor: '#fff7ed',
      style: 'Leadership Principles', 
      tagline: 'Demonstrate ownership, customer obsession, and deliver results.',
      Logo: AmazonLogo,
    },
    { 
      id: 'meta', 
      name: 'Meta', 
      color: '#1877F2',
      lightColor: '#eff6ff',
      style: 'Product & Growth', 
      tagline: 'Move fast, build impact, and measure what matters.',
      Logo: MetaLogo,
    },
    { 
      id: 'microsoft', 
      name: 'Microsoft', 
      color: '#00A4EF',
      lightColor: '#f0f9ff',
      style: 'Growth Mindset & Collaboration', 
      tagline: 'Learn it all, not know it all. Collaborate to ship.',
      Logo: MicrosoftLogo,
    },
  ];

  const handleCreateInterviewer = () => {
    if (!newInterviewer.name.trim() || newInterviewer.questions.filter(Boolean).length === 0) return;
    
    const interviewer = {
      id: `custom-${Date.now()}`,
      name: newInterviewer.name,
      style: newInterviewer.style || 'Custom',
      tagline: newInterviewer.tagline || '',
      color: newInterviewer.color,
      questions: newInterviewer.questions.filter(Boolean),
      isCustom: true,
    };
    
    const updated = [...(customInterviewers || []), interviewer];
    onSelectCustom?.(updated);
    setShowCreate(false);
    setNewInterviewer({
      name: '',
      style: '',
      tagline: '',
      color: '#6366f1',
      questions: [''],
    });
  };

  const addQuestionField = () => {
    setNewInterviewer(prev => ({
      ...prev,
      questions: [...prev.questions, ''],
    }));
  };

  const updateQuestion = (index, value) => {
    setNewInterviewer(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => i === index ? value : q),
    }));
  };

  const removeQuestion = (index) => {
    setNewInterviewer(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 className="section-title">Choose Your Interviewer</h2>
        <p className="section-subtitle">Select a company to practice with their real interview style and questions</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
        <button 
          className={`btn ${mode === 'preset' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setMode('preset')}
        >
          Preset Interviewers
        </button>
        <button 
          className={`btn ${mode === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setMode('custom')}
        >
          Custom Interviewer
        </button>
      </div>

      {mode === 'preset' && (
        <>
          <div className="company-grid">
            {companies.map((c) => (
              <div
                key={c.id}
                className={`company-card ${company === c.id ? 'selected' : ''}`}
                onClick={() => setCompany(c.id)}
                style={{ 
                  borderColor: company === c.id ? c.color : undefined,
                }}
              >
                <div className="company-logo">
                  <c.Logo />
                </div>
                <h3>{c.name}</h3>
                <p className="company-style">{c.style}</p>
                <p className="company-tagline">{c.tagline}</p>
              </div>
            ))}
          </div>
          <div className="start-interview-btn" style={{ textAlign: 'center' }}>
            <button className="btn btn-primary btn-lg" onClick={onStart}>
              Start Interview
            </button>
          </div>
        </>
      )}

      {mode === 'custom' && (
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          {!showCreate ? (
            <>
              {customInterviewers && customInterviewers.length > 0 ? (
                <div className="company-grid" style={{ marginBottom: '24px' }}>
                  {customInterviewers.map((interviewer) => (
                    <div
                      key={interviewer.id}
                      className={`company-card ${company === interviewer.id ? 'selected' : ''}`}
                      onClick={() => {
                        setCompany(interviewer.id);
                        onSelectCustom?.(customInterviewers);
                      }}
                      style={{ 
                        borderColor: company === interviewer.id ? interviewer.color : undefined,
                      }}
                    >
                      <div className="company-logo">
                        <CustomLogo initials={interviewer.name.slice(0, 2).toUpperCase()} color={interviewer.color} />
                      </div>
                      <h3>{interviewer.name}</h3>
                      <p className="company-style">{interviewer.style}</p>
                      <p className="company-tagline">{interviewer.tagline}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  <p style={{ marginBottom: '20px' }}>No custom interviewers yet. Create your first one below.</p>
                </div>
              )}
              <div style={{ textAlign: 'center' }}>
                <button className="btn btn-primary btn-lg" onClick={() => setShowCreate(true)}>
                  Create Custom Interviewer
                </button>
                {customInterviewers && customInterviewers.length > 0 && (
                  <button className="btn btn-primary btn-lg" onClick={onStart} style={{ marginLeft: '12px' }}>
                    Start Interview
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
              <h3 style={{ marginBottom: '20px', fontSize: '1.1rem', fontWeight: 700 }}>Create Custom Interviewer</h3>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Interviewer Name
                </label>
                <input
                  type="text"
                  value={newInterviewer.name}
                  onChange={(e) => setNewInterviewer(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Startup Founder"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '2px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.95rem',
                    fontFamily: 'inherit',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Interview Style
                </label>
                <input
                  type="text"
                  value={newInterviewer.style}
                  onChange={(e) => setNewInterviewer(prev => ({ ...prev, style: e.target.value }))}
                  placeholder="e.g., Casual and conversational"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '2px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.95rem',
                    fontFamily: 'inherit',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Tagline
                </label>
                <input
                  type="text"
                  value={newInterviewer.tagline}
                  onChange={(e) => setNewInterviewer(prev => ({ ...prev, tagline: e.target.value }))}
                  placeholder="e.g., Focus on real-world scenarios"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '2px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.95rem',
                    fontFamily: 'inherit',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Theme Color
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#3b82f6'].map(color => (
                    <button
                      key={color}
                      onClick={() => setNewInterviewer(prev => ({ ...prev, color }))}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: color,
                        border: newInterviewer.color === color ? '3px solid var(--text)' : '3px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Questions
                </label>
                {newInterviewer.questions.map((q, index) => (
                  <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      value={q}
                      onChange={(e) => updateQuestion(index, e.target.value)}
                      placeholder={`Question ${index + 1}`}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        border: '2px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.95rem',
                        fontFamily: 'inherit',
                        background: 'var(--bg)',
                        color: 'var(--text)',
                      }}
                    />
                    {newInterviewer.questions.length > 1 && (
                      <button
                        onClick={() => removeQuestion(index)}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--bg-card)',
                          color: 'var(--danger)',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addQuestionField}
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: '8px' }}
                >
                  Add Question
                </button>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>
                  Cancel
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={handleCreateInterviewer}
                  disabled={!newInterviewer.name.trim() || newInterviewer.questions.filter(Boolean).length === 0}
                >
                  Save Interviewer
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function AmazonLogo() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="12" y="20" textAnchor="middle" fill="#FF9900" fontSize="18" fontWeight="700" fontFamily="Arial, sans-serif">a</text>
    </svg>
  );
}

function MetaLogo() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="12" y="18" textAnchor="middle" fill="#1877F2" fontSize="18">∞</text>
    </svg>
  );
}

function MicrosoftLogo() {
  return (
    <svg viewBox="0 0 21 21" width="28" height="28" fill="none">
      <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
      <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
    </svg>
  );
}

function CustomLogo({ initials, color = '#6366f1' }) {
  return (
    <svg viewBox="0 0 28 28" width="28" height="28" fill="none">
      <rect width="28" height="28" rx="6" fill={color} opacity="0.12"/>
      <text x="14" y="18" textAnchor="middle" fill={color} fontSize="12" fontWeight="700">
        {initials}
      </text>
    </svg>
  );
}

export default InterviewerSelect;
