import type { AuthUser } from "../../types/auth";
import type { UserProfile } from "../../types/profile";

interface DashboardHeaderProps {
  user: AuthUser;
  profile: UserProfile | null;
  activeTab: "overview" | "edit" | "gap";
  onTabChange: (tab: "overview" | "edit" | "gap") => void;
}

export default function DashboardHeader({
  user,
  profile,
  activeTab,
  onTabChange,
}: DashboardHeaderProps) {
  const skillsCount = profile?.currentSkills?.length || 0;
  const hasTargetRole = Boolean(profile?.targetRole);

  return (
    <div className="dashboard-hero-card">
      <div className="dashboard-user-bar">
        <div className="dashboard-user-profile">
          <div className="dashboard-avatar">
            <span>{user.name.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <div className="user-greeting-row">
              <h2 className="dashboard-welcome-name">Welcome back, {user.name}!</h2>
              <span className="profile-active-tag">Active Account</span>
            </div>
            <p className="dashboard-user-sub">
              {profile?.targetRole
                ? `Aspiring ${profile.targetRole} • ${profile.experienceLevel}`
                : "Complete your profile below to start your career skill gap analysis"}
            </p>
          </div>
        </div>

        <div className="dashboard-actions">
          <button
            type="button"
            className={`btn btn-sm ${activeTab === "edit" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => onTabChange("edit")}
          >
            ✏️ {profile?.targetRole ? "Edit Profile & Skills" : "Set Up Profile"}
          </button>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="metrics-grid">
        <div className="metric-box">
          <span className="metric-icon">🎯</span>
          <div>
            <span className="metric-label">Target Role</span>
            <span className="metric-value">
              {profile?.targetRole || "Not specified yet"}
            </span>
          </div>
        </div>

        <div className="metric-box">
          <span className="metric-icon">⚡</span>
          <div>
            <span className="metric-label">Acquired Skills</span>
            <span className="metric-value">
              {skillsCount} {skillsCount === 1 ? "Skill" : "Skills"}
            </span>
          </div>
        </div>

        <div className="metric-box">
          <span className="metric-icon">🎓</span>
          <div>
            <span className="metric-label">Education</span>
            <span className="metric-value">
              {profile?.education?.degree
                ? `${profile.education.degree} ${
                    profile.education.graduationYear ? `('${profile.education.graduationYear.toString().slice(-2)})` : ""
                  }`
                : "Not added"}
            </span>
          </div>
        </div>

        <div className="metric-box highlight-metric">
          <span className="metric-icon">📊</span>
          <div>
            <span className="metric-label">Analysis Status</span>
            <span className="metric-value highlight-text">
              {hasTargetRole ? "Ready to Analyze" : "Awaiting Role"}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="dashboard-nav-tabs" aria-label="Dashboard navigation">
        <button
          type="button"
          className={`nav-tab-item ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => onTabChange("overview")}
        >
          <span className="tab-icon">📊</span>
          <span>Overview &amp; Skills</span>
        </button>

        <button
          type="button"
          className={`nav-tab-item ${activeTab === "gap" ? "active" : ""}`}
          onClick={() => onTabChange("gap")}
        >
          <span className="tab-icon">🎯</span>
          <span>Skill Gap Analyzer</span>
          <span className="tab-pill">Feature 2</span>
        </button>

        <button
          type="button"
          className={`nav-tab-item ${activeTab === "edit" ? "active" : ""}`}
          onClick={() => onTabChange("edit")}
        >
          <span className="tab-icon">⚙️</span>
          <span>Profile Settings</span>
        </button>
      </nav>
    </div>
  );
}
