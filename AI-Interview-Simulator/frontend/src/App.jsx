import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import InterviewerSelect from './components/InterviewerSelect';
import QuestionPanel from './components/QuestionPanel';
import Camera from './components/Camera';
import Dashboard from './components/Dashboard';
import PastInterviews from './components/PastInterviews';
import { mockInterviews, getRandomQuestions } from './utils/interviewerData';

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('ais_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [view, setView] = useState('home');
  const [company, setCompany] = useState('google');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [interviewQuestions, setInterviewQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [finalScores, setFinalScores] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [pastInterviews, setPastInterviews] = useState(() => {
    const saved = localStorage.getItem('ais_interviews');
    return saved ? JSON.parse(saved) : [];
  });
  const [customInterviewers, setCustomInterviewers] = useState(() => {
    const saved = localStorage.getItem('ais_custom_interviewers');
    return saved ? JSON.parse(saved) : [];
  });

  const allInterviewers = { ...mockInterviews, ...Object.fromEntries(customInterviewers.map(ci => [ci.id, ci])) };
  const interviewerData = allInterviewers[company] || mockInterviews.google;

  useEffect(() => {
    if (user) {
      localStorage.setItem('ais_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('ais_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('ais_interviews', JSON.stringify(pastInterviews));
  }, [pastInterviews]);

  useEffect(() => {
    localStorage.setItem('ais_custom_interviewers', JSON.stringify(customInterviewers));
  }, [customInterviewers]);

  const handleSignIn = (credentialResponse) => {
    const payload = JSON.parse(atob(credentialResponse.credential.split('.')[1]));
    const userData = {
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      sub: payload.sub,
    };
    setUser(userData);
    setView('home');
  };

  const handleSignOut = () => {
    setUser(null);
    setView('home');
    setFinalScores(null);
    setAnswers([]);
    setCurrentQuestionIndex(0);
  };

  const handleNavbarSignIn = () => {
    setView('auth');
  };

  const handleDemoSignIn = () => {
    setUser({
      email: 'demo@example.com',
      name: 'Demo User',
      picture: null,
      sub: 'demo-user',
    });
    setView('home');
  };

  const handleStartInterview = () => {
    const selectedQs = getRandomQuestions(interviewerData.questions);
    setInterviewQuestions(selectedQs);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setFinalScores(null);
    setView('interview');
  };

  const handleAnswerSubmit = async (answer) => {
    setAnswers((prev) => [...prev, answer]);

    if (currentQuestionIndex < interviewQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setIsAnalyzing(true);
      try {
        const fullText = answers.concat([answer]).join(' ');
         const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/analyze/full`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcript: fullText,
            company: company,
            duration_seconds: answers.length * 15,
          }),
        });
        const data = await response.json();

        let scores = data.scores || {
          confidenceScore: 75,
          communicationScore: data.voiceAnalysis?.communication_score || 70,
          grammarScore: data.voiceAnalysis?.grammar_score || 75,
          voiceScore: data.voiceAnalysis?.voice_score || 70,
          bodyLanguageScore: 70,
          eyeContactScore: 70,
        };
        let hiringProb = data.hiringProbability || 65;
        let recommendation = data.recommendation || 'Good candidate';

        const result = { scores, hiringProbability: hiringProb, recommendation, company, date: new Date().toISOString() };
        setFinalScores(result);
        
        if (user) {
          setPastInterviews((prev) => [result, ...prev]);
        }
        
        setView('results');
      } catch (err) {
        const voiceResult = handleLocalAnalysis(answers.concat([answer]).join(' '));
        const result = { ...voiceResult, company, date: new Date().toISOString() };
        setFinalScores(result);
        
        if (user) {
          setPastInterviews((prev) => [result, ...prev]);
        }
        
        setView('results');
      }
      setIsAnalyzing(false);
    }
  };

  const handleLocalAnalysis = (text) => {
    const words = text.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const fillerWords = ['um', 'uh', 'like', 'you know', 'kind of', 'sort of', 'basically', 'literally', 'i mean'];
    let fillerCount = 0;
    const lowerText = text.toLowerCase();
    fillerWords.forEach((w) => { fillerCount += lowerText.split(w).length - 1; });

    const grammarScore = Math.max(0, Math.min(100, 80 + (wordCount > 10 ? 10 : -5) - fillerCount * 3));
    const commScore = Math.max(0, Math.min(100, 50 + wordCount * 0.5 - fillerCount * 5));
    const voiceScore = Math.round(grammarScore * 0.4 + commScore * 0.4 + Math.max(0, 100 - fillerCount * 5) * 0.2);
    const confidenceScore = Math.min(100, 40 + wordCount * 0.3 + (wordCount > 20 ? 10 : 0));

    return {
      scores: {
        confidenceScore: Math.round(confidenceScore * 10) / 10,
        communicationScore: Math.round(commScore * 10) / 10,
        grammarScore: Math.round(grammarScore * 10) / 10,
        voiceScore,
        bodyLanguageScore: 65,
      },
      hiringProbability: Math.round(((confidenceScore + commScore + grammarScore + voiceScore) / 4) * 10) / 10,
      recommendation: confidenceScore > 70 ? 'Strong candidate — high hiring potential' : 'Moderate candidate — needs improvement in areas noted',
    };
  };

  const handleRestart = () => {
    setView('home');
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setFinalScores(null);
    setCompany('google');
  };

  const handleViewHistory = () => {
    setView('history');
  };

  const handleSelectCompany = (selectedCompany) => {
    setCompany(selectedCompany);
  };

  const renderView = () => {
    if (view === 'auth') {
      return (
        <div className="auth-page">
          <div className="auth-card">
            <h1>AI Interview Simulator</h1>
            <p>Sign in to start practicing interviews and track your progress over time.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
              <GoogleSignInButton onSignIn={handleSignIn} />
              <button className="btn btn-secondary" onClick={handleDemoSignIn} style={{ maxWidth: '280px', width: '100%' }}>
                Continue as Demo User
              </button>
            </div>
            <div className="auth-footer">
              Demo mode uses local storage only. Sign in with Google to sync your history across devices.
            </div>
          </div>
        </div>
      );
    }

    if (!user) {
      return (
        <div className="auth-page">
          <div className="auth-card">
            <h1>AI Interview Simulator</h1>
            <p>Sign in to start practicing interviews and track your progress over time.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
              <GoogleSignInButton onSignIn={handleSignIn} />
              <button className="btn btn-secondary" onClick={handleDemoSignIn} style={{ maxWidth: '280px', width: '100%' }}>
                Continue as Demo User
              </button>
            </div>
            <div className="auth-footer">
              Demo mode uses local storage only. Sign in with Google to sync your history across devices.
            </div>
          </div>
        </div>
      );
    }

    switch (view) {
      case 'history':
        return (
          <PastInterviews 
            interviews={pastInterviews} 
            onBack={() => setView('home')} 
            onRestart={handleRestart}
          />
        );
      case 'interview':
        return (
          <div className="interview-container">
            <div className="interview-main">
              <QuestionPanel
                company={company}
                questionIndex={currentQuestionIndex}
                totalQuestions={interviewQuestions.length}
                question={interviewQuestions[currentQuestionIndex]}
                onSubmit={handleAnswerSubmit}
                isAnalyzing={isAnalyzing}
              />
              <div className="side-panel">
                <Camera autoStart={view === 'interview'} />
                {answers.length > 0 && (
                  <div className="answer-preview">
                    <h4>Your Responses</h4>
                    <p>{answers.length} of {interviewQuestions.length} answered</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 'results':
        return finalScores ? (
          <div className="interview-container">
            <Dashboard
              scores={finalScores.scores}
              hiringProbability={finalScores.hiringProbability}
              recommendation={finalScores.recommendation}
              company={finalScores.company || company}
              onRestart={handleRestart}
              onHistory={handleViewHistory}
            />
          </div>
        ) : null;
      case 'home':
      default:
        return (
          <div className="interview-container">
            <div className="welcome-banner">
              <div>
                <h2>Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}</h2>
                <p>Select an interviewer to begin your practice session.</p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={handleViewHistory}>
                View Past Interviews
              </button>
            </div>
            <InterviewerSelect
              company={company}
              setCompany={handleSelectCompany}
              onStart={handleStartInterview}
              customInterviewers={customInterviewers}
              onSelectCustom={setCustomInterviewers}
            />
          </div>
        );
    }
  };

  if (!user) {
    return renderView();
  }

  return (
    <div className="app">
      <Navbar 
        user={user} 
        onSignOut={handleSignOut} 
        onSignIn={handleNavbarSignIn}
        currentView={view} 
        onNavigate={setView} 
      />
      <main style={{ flex: 1 }}>
        {renderView()}
      </main>
    </div>
  );
}

function GoogleSignInButton({ onSignIn }) {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
    
    if (clientId === 'YOUR_GOOGLE_CLIENT_ID') {
      alert('Please set your Google OAuth Client ID in the environment variables.\n\nGet one at: https://console.cloud.google.com/apis/credentials');
      setLoading(false);
      return;
    }

    const googleScript = document.createElement('script');
    googleScript.src = 'https://accounts.google.com/gsi/client';
    googleScript.async = true;
    googleScript.defer = true;
    googleScript.onload = () => {
      try {
        google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            onSignIn(response);
            setLoading(false);
          },
        });
        google.accounts.id.prompt();
      } catch (e) {
        console.error('Google Sign-In error:', e);
        setLoading(false);
      }
    };
    document.head.appendChild(googleScript);
  };

  return (
    <button className="google-btn" onClick={handleClick} disabled={loading}>
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      {loading ? 'Signing in...' : 'Sign in with Google'}
    </button>
  );
}

export default App;
