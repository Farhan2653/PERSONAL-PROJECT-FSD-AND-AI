import React from 'react';

function Navbar({ user, onSignOut, onSignIn, currentView, onNavigate }) {
  const isDemo = user?.sub === 'demo-user';
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)
    : 'U';

  return (
    <nav className="navbar">
      <a className="navbar-brand" href="#" onClick={(e) => { e.preventDefault(); onNavigate('home'); }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
        <span>AI Interview Simulator</span>
      </a>

      <div className="navbar-nav">
        <button
          className={`nav-link ${currentView === 'home' ? 'active' : ''}`}
          onClick={() => onNavigate('home')}
        >
          Practice
        </button>
        <button
          className={`nav-link ${currentView === 'history' ? 'active' : ''}`}
          onClick={() => onNavigate('history')}
        >
          History
        </button>
      </div>

      <div className="nav-user">
        {isDemo ? (
          <>
            <div className="nav-avatar">{initials}</div>
            <div>
              <div className="nav-user-name">{user?.name}</div>
              <div className="nav-user-email">{user?.email}</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={onSignIn}>
              Sign In
            </button>
          </>
        ) : (
          <>
            {user?.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="nav-avatar"
                style={{ borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <div className="nav-avatar">{initials}</div>
            )}
            <div>
              <div className="nav-user-name">{user?.name}</div>
              <div className="nav-user-email">{user?.email}</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={onSignOut}>
              Sign out
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
