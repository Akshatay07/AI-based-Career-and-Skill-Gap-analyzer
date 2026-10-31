import type { AuthUser } from "../types/auth";

interface HeaderProps {
  backendOnline: boolean | null;
  onRefreshHealth: () => void;
  currentUser: AuthUser | null;
  onOpenAuth: (mode: "login" | "register") => void;
  onLogout: () => void;
}

export default function Header({
  backendOnline,
  onRefreshHealth,
  currentUser,
  onOpenAuth,
  onLogout,
}: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header-container">
        <div className="brand-group">
          <div className="brand-icon">🚀</div>
          <div>
            <h1 className="brand-title">AI Career &amp; Skill Gap Analyzer</h1>
            <p className="brand-subtitle">
              Intelligent career path exploration &amp; personalized skill gap assessments
            </p>
          </div>
        </div>

        <div className="header-actions">
          {/* Status indicators */}
          <div className="status-indicators">
            <div className="status-pill db-pill" title="Connected to mongodb://127.0.0.1:27017">
              <span className="status-dot online"></span>
              <span>Local MongoDB</span>
            </div>

            <button
              type="button"
              className={`status-pill ${
                backendOnline === true
                  ? "status-online"
                  : backendOnline === false
                  ? "status-offline"
                  : "status-checking"
              }`}
              onClick={onRefreshHealth}
              title="Click to re-check backend health status"
            >
              <span
                className={`status-dot ${
                  backendOnline === true
                    ? "online"
                    : backendOnline === false
                    ? "offline"
                    : "checking"
                }`}
              ></span>
              <span>
                {backendOnline === true
                  ? "API Online"
                  : backendOnline === false
                  ? "API Offline"
                  : "Checking..."}
              </span>
            </button>
          </div>

          {/* User Auth Section */}
          <div className="user-nav">
            {currentUser ? (
              <div className="logged-in-user">
                <div className="user-badge" title={currentUser.email}>
                  <span className="avatar-icon">👤</span>
                  <span className="user-name">{currentUser.name}</span>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={onLogout}
                >
                  Log Out
                </button>
              </div>
            ) : (
              <div className="auth-buttons">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => onOpenAuth("login")}
                >
                  Log In
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => onOpenAuth("register")}
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
