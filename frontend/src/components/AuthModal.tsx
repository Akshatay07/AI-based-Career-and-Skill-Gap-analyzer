import { useState } from "react";
import { registerUser, loginUser } from "../services/api";
import type { AuthUser } from "../types/auth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: AuthUser, token: string) => void;
  initialMode?: "login" | "register";
}

export default function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = "login",
}: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "register") {
        if (!name.trim()) {
          throw new Error("Please enter your name");
        }
        const res = await registerUser(name.trim(), email.trim(), password);
        onAuthSuccess(res.user, res.token);
      } else {
        const res = await loginUser(email.trim(), password);
        onAuthSuccess(res.user, res.token);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  // Quick helper to fill demo account
  const handleUseDemoAccount = () => {
    setMode("login");
    setEmail("akshata@example.com");
    setPassword("password123");
    setError("");
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          title="Close"
        >
          ✕
        </button>

        {/* Tab Headers */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            Log In
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === "register" ? "active" : ""}`}
            onClick={() => {
              setMode("register");
              setError("");
            }}
          >
            Sign Up
          </button>
        </div>

        <div className="modal-body">
          <h2 className="auth-title">
            {mode === "login"
              ? "Welcome Back!"
              : "Create Your Career Account"}
          </h2>
          <p className="auth-subtitle">
            {mode === "login"
              ? "Log in to view your career profile and skill gap analysis"
              : "Register to build your profile, identify gaps, and get AI guidance"}
          </p>

          {error && (
            <div className="alert alert-error">
              <span>⚠️</span>
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === "register" && (
              <div className="form-group">
                <label htmlFor="auth-name">Full Name</label>
                <input
                  id="auth-name"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Akshata"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="auth-email">Email Address</label>
              <input
                id="auth-email"
                type="email"
                className="form-control"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="auth-password">Password</label>
              <input
                id="auth-password"
                type="password"
                className="form-control"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading
                ? "Processing..."
                : mode === "login"
                ? "Log In to Dashboard"
                : "Create Free Account"}
            </button>
          </form>

          {/* Demo account helper */}
          <div className="demo-helper">
            <span>Want to test quickly? </span>
            <button
              type="button"
              className="demo-link-btn"
              onClick={handleUseDemoAccount}
            >
              Fill Demo Credentials
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
