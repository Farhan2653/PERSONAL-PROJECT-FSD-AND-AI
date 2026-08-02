import React, { useState, useRef, useEffect } from 'react';

function QuestionPanel({ company, questionIndex, totalQuestions, question, onSubmit, isAnalyzing }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [capturedAnswer, setCapturedAnswer] = useState('');
  const [answerComplete, setAnswerComplete] = useState(false);
  const [followUp, setFollowUp] = useState(null);
  const [isFollowUpMode, setIsFollowUpMode] = useState(false);
  const [apiAvailable, setApiAvailable] = useState(null);
  const [micError, setMicError] = useState(null);
  const recognitionRef = useRef(null);
  const silenceTimeoutRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const isFollowUpModeRef = useRef(false);
  const onSubmitRef = useRef(onSubmit);
  const isManuallyStoppedRef = useRef(false);

  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);

  useEffect(() => {
    isFollowUpModeRef.current = isFollowUpMode;
    return () => {};
  }, [isFollowUpMode]);

  useEffect(() => {
    const hasApi = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    setApiAvailable(hasApi);
  }, []);

  const startRecording = (isFollowUp = false) => {
    if (!apiAvailable) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let currentFinalParts = [];

    isManuallyStoppedRef.current = false;

    recognition.onresult = (event) => {
      let interim = '';
      currentFinalParts = [];

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const part = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          currentFinalParts.push(part);
        } else {
          interim += part;
        }
      }

      setTranscript(interim);
      const newFinal = currentFinalParts.join(' ');
      finalTranscriptRef.current = (finalTranscriptRef.current + ' ' + newFinal).trim();
      
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }

      if (isFollowUp) {
        setIsFollowUpMode(true);
        setFollowUp(null);
      }

      silenceTimeoutRef.current = setTimeout(() => {
        if (isManuallyStoppedRef.current) return;
        isManuallyStoppedRef.current = true;
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
        const completeText = finalTranscriptRef.current.trim();
        if (completeText.length > 10) {
          setCapturedAnswer(completeText);
          setIsRecording(false);
          setAnswerComplete(true);
        }
      }, 2000);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      setMicError(event.error);
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };

    recognition.onaudiostart = () => {
      console.log('Audio capture started');
    };

    recognition.onend = () => {
      const shouldRestart = !isManuallyStoppedRef.current && isRecording;
      if (shouldRestart) {
        setTimeout(() => {
          if (recognitionRef.current && !isManuallyStoppedRef.current && isRecording) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.warn('Restart failed:', e);
            }
          }
        }, 100);
      }
      if (isManuallyStoppedRef.current) {
        setIsRecording(false);
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };

    recognitionRef.current = recognition;
    finalTranscriptRef.current = '';
    setTranscript('');
    setCapturedAnswer('');
    setMicError(null);
    setIsRecording(true);
    setAnswerComplete(false);
    recognition.start();
  };

  const stopRecording = () => {
    isManuallyStoppedRef.current = true;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    setIsRecording(false);
  };

  const handleSubmitAnswer = (text) => {
    if (text.trim() && onSubmitRef.current) {
      onSubmit(text.trim());
      setTranscript('');
      setCapturedAnswer('');
      setAnswerComplete(false);
      setFollowUp(null);
      setIsFollowUpMode(false);
      finalTranscriptRef.current = '';
    }
  };

  const handleFollowUpAnswerComplete = () => {
    const fullAnswer = finalTranscriptRef.current.trim();
    if (fullAnswer.length > 10) {
      setCapturedAnswer(fullAnswer);
      setAnswerComplete(true);
      setIsRecording(false);
    }
  };

  const handleMainAnswerComplete = () => {
    const fullAnswer = finalTranscriptRef.current.trim();
    if (fullAnswer.length > 10) {
      const wordCount = fullAnswer.split(/\s+/).filter(Boolean).length;
      if (wordCount < 15 && !isFollowUpModeRef.current) {
        const followUpQuestions = [
          "Could you please elaborate on that?",
          "Can you give me a specific example?",
          "Tell me more about your thought process.",
          "What was the outcome of that situation?",
        ];
        setFollowUp(followUpQuestions[Math.floor(Math.random() * followUpQuestions.length)]);
        setIsFollowUpMode(true);
        setFollowUp(prev => prev);
      } else {
        handleSubmitAnswer(fullAnswer);
      }
    }
  };

  const handleFollowUpAnswer = () => {
    finalTranscriptRef.current = '';
    setTranscript('');
    setCapturedAnswer('');
    setAnswerComplete(false);
    startRecording(true);
  };

  const handleSkipFollowUp = () => {
    handleSubmitAnswer(capturedAnswer || 'No answer provided');
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, []);

  const progress = ((questionIndex + 1) / totalQuestions) * 100;
  const currentQuestion = isFollowUpMode && followUp ? followUp : question;

  return (
    <div className="card question-panel">
      <div className="question-header">
        <div className="question-number">{questionIndex + 1}</div>
        <div className="question-meta">
          <h3>{currentQuestion}</h3>
          {isFollowUpMode && (
            <span style={{ fontSize: '0.8rem', color: 'var(--warning)', fontWeight: 500, marginTop: '4px', display: 'inline-block' }}>
              Follow-up question
            </span>
          )}
        </div>
      </div>
      <div className="question-progress">
        <div className="question-progress-bar" style={{ width: `${progress}%` }} />
      </div>
      <div className="question-footer">
        <span>Question {questionIndex + 1} of {totalQuestions}</span>
        <span className="company-badge">
          <span className="company-dot" style={{ background: company === 'google' ? '#4285F4' : company === 'amazon' ? '#FF9900' : company === 'meta' ? '#1877F2' : '#00A4EF' }} />
          {company.charAt(0).toUpperCase() + company.slice(1)}
        </span>
      </div>

      <div className="answer-area" style={{ marginTop: '24px' }}>
        {!answerComplete ? (
          <div style={{
            padding: '24px',
            background: 'var(--bg)',
            border: '2px dashed var(--border)',
            borderRadius: 'var(--radius)',
            textAlign: 'center',
            minHeight: '140px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
          }}>
            {!isRecording ? (
              <>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}>
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" x2="12" y1="19" y2="22"/>
                </svg>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                  {isFollowUpMode ? 'Click below to answer the follow-up' : 'Click below and speak your answer'}
                </p>
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => startRecording(isFollowUpMode)}
                  disabled={isAnalyzing || apiAvailable === false}
                  style={{ minWidth: '200px' }}
                >
                  {isFollowUpMode ? 'Answer Follow-up' : 'Start Recording'}
                </button>
                {apiAvailable === false && (
                  <p style={{ color: 'var(--danger)', fontSize: '0.8rem', margin: 0 }}>
                    Speech recognition not supported. Use Chrome or Edge.
                  </p>
                )}
                {micError && (
                  <p style={{ color: 'var(--danger)', fontSize: '0.8rem', margin: 0, textAlign: 'left', maxWidth: '400px' }}>
                    Microphone error ({micError}): {micError === 'not-allowed' ? 'Please allow microphone access and refresh the page.' : micError === 'no-speech' ? 'No speech detected. Try speaking clearly into the microphone.' : 'Please check your microphone connection.'}
                  </p>
                )}
              </>
            ) : (
              <>
                <div style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'pulse 2s infinite',
                }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="var(--danger)">
                    <circle cx="12" cy="12" r="6"/>
                  </svg>
                </div>
                <p style={{ color: 'var(--text)', fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                  Listening...
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                  Speak clearly and pause when done
                </p>
                {(transcript) && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic', marginTop: '8px', maxWidth: '500px', lineHeight: 1.5 }}>
                    "{transcript}"
                  </p>
                )}
                <button
                  className="btn btn-secondary"
                  onClick={stopRecording}
                  style={{ marginTop: '8px' }}
                >
                  Stop Recording
                </button>
              </>
            )}
          </div>
        ) : (
          <div style={{
            padding: '20px',
            background: 'var(--success-light)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: 'var(--radius)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span style={{ color: '#065f46', fontWeight: 600, fontSize: '0.9rem' }}>
                {isFollowUpMode ? 'Follow-up Answer Captured' : 'Answer Captured'}
              </span>
            </div>
            <p style={{ color: 'var(--text)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
              {capturedAnswer}
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button
                className="btn btn-primary"
                onClick={() => handleSubmitAnswer(capturedAnswer)}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? 'Analyzing...' : isFollowUpMode ? 'Submit Follow-up' : 'Submit Answer'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setAnswerComplete(false);
                  setTranscript('');
                  setCapturedAnswer('');
                  finalTranscriptRef.current = '';
                }}
              >
                Record Again
              </button>
            </div>
          </div>
        )}

        {followUp && !isFollowUpMode && answerComplete && (
          <div style={{
            marginTop: '16px',
            padding: '16px 20px',
            background: 'var(--warning-light)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: 'var(--radius)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <p style={{ color: '#92400e', fontWeight: 600, fontSize: '0.9rem', margin: '0 0 4px 0' }}>Suggested Follow-up</p>
              <p style={{ color: 'var(--text)', fontSize: '0.95rem', margin: 0 }}>{followUp}</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setFollowUp(followUp);
                  setIsFollowUpMode(false);
                  finalTranscriptRef.current = '';
                  setTranscript('');
                  setCapturedAnswer('');
                  setAnswerComplete(false);
                  startRecording(true);
                }}
              >
                Answer Follow-up
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleSubmitAnswer(capturedAnswer)}
              >
                Skip
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default QuestionPanel;
