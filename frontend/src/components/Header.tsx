import { useState, useRef, useEffect } from "react";
import type { AuthUser } from "../types/auth";

interface HeaderProps {
  backendOnline: boolean | null;
  dbConnected?: boolean | null;
  isHealthChecking?: boolean;
  onRefreshHealth: () => void | Promise<void>;
  currentUser: AuthUser | null;
  onOpenAuth: (mode: "login" | "register") => void;
  onLogout: () => void;
}

export default function Header({
  backendOnline,
  dbConnected,
  isHealthChecking,
  onRefreshHealth,
  currentUser,
  onOpenAuth,
  onLogout,
}: HeaderProps) {
  const [showStatusPopover, setShowStatusPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowStatusPopover(false);
      }
    }
    if (showStatusPopover) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showStatusPopover]);

  const handleStatusCheck = async () => {
    setShowStatusPopover((prev) => !prev);
    if (!showStatusPopover) {
      await onRefreshHealth();
    }
  };

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
          {/* Unified Status Check Button */}
          <div className="status-check-wrapper" ref={popoverRef}>
            <button
              type="button"
              className={`status-check-btn ${
                isHealthChecking
                  ? "status-checking"
                  : backendOnline && dbConnected
                  ? "status-online"
                  : backendOnline === false || dbConnected === false
                  ? "status-offline"
                  : ""
              }`}
              onClick={handleStatusCheck}
              title="Click to check if API and MongoDB are working properly"
            >
              <span
                className={`status-dot ${
                  isHealthChecking
                    ? "checking"
                    : backendOnline && dbConnected
                    ? "online"
                    : backendOnline === false || dbConnected === false
                    ? "offline"
                    : "checking"
                }`}
              ></span>
              <span>{isHealthChecking ? "Checking..." : "Status Check"}</span>
            </button>

            {/* Status Details Popover */}
            {showStatusPopover && (
              <div className="status-popover">
                <div className="status-popover-header">
                  <span className="status-popover-title">System Health Status</span>
                  <button
                    type="button"
                    className="popover-close-btn"
                    onClick={() => setShowStatusPopover(false)}
                    title="Close"
                  >
                    ✕
                  </button>
                </div>

                <div className="status-popover-body">
                  <div className="status-row">
                    <div className="status-row-info">
                      <span
                        className={`status-dot ${
                          backendOnline === true
                            ? "online"
                            : backendOnline === false
                            ? "offline"
                            : "checking"
                        }`}
                      ></span>
                      <span className="status-name">Backend API (Express)</span>
                    </div>
                    <span
                      className={`status-badge ${
                        backendOnline === true ? "badge-online" : "badge-offline"
                      }`}
                    >
                      {backendOnline === true
                        ? "Running (Port 5000)"
                        : backendOnline === false
                        ? "Offline"
                        : "Checking..."}
                    </span>
                  </div>

                  <div className="status-row">
                    <div className="status-row-info">
                      <span
                        className={`status-dot ${
                          dbConnected === true
                            ? "online"
                            : dbConnected === false
                            ? "offline"
                            : "checking"
                        }`}
                      ></span>
                      <span className="status-name">Local MongoDB</span>
                    </div>
                    <span
                      className={`status-badge ${
                        dbConnected === true ? "badge-online" : "badge-offline"
                      }`}
                    >
                      {dbConnected === true
                        ? "Connected"
                        : dbConnected === false
                        ? "Disconnected"
                        : "Checking..."}
                    </span>
                  </div>
                </div>

                <div className="status-popover-footer">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm btn-block"
                    onClick={() => onRefreshHealth()}
                    disabled={isHealthChecking}
                  >
                    {isHealthChecking ? "Checking Systems..." : "🔄 Re-check Status"}
                  </button>
                </div>
              </div>
            )}
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
