import type { UserProfile } from "../../types/profile";
import type { AuthUser } from "../../types/auth";

interface DashboardOverviewProps {
  user: AuthUser;
  profile: UserProfile | null;
  onGoToEdit: () => void;
  onGoToGap: () => void;
}

export default function DashboardOverview({
  user,
  profile,
  onGoToEdit,
  onGoToGap,
}: DashboardOverviewProps) {
  const skills = profile?.currentSkills || [];
  const targetRole = profile?.targetRole;

  if (!profile || !targetRole) {
    return (
      <div className="card empty-dashboard-card">
        <div className="empty-dashboard-illustration">🚀</div>
        <h2>Let's Configure Your Career Profile</h2>
        <p className="empty-sub">
          You haven't selected your dream career role or added your current skills yet. Set them up
          now to run your skill gap analysis!
        </p>
        <button
          type="button"
          className="btn btn-primary btn-lg"
          onClick={onGoToEdit}
        >
          Set Up My Career Profile ✏️
        </button>
      </div>
    );
  }

  return (
    <div className="overview-layout-grid">
      {/* Left Column: Career Target Spotlight & Skill Gap CTA */}
      <div className="overview-col-main">
        {/* Target Role Spotlight Card */}
        <div className="card role-spotlight-card">
          <div className="card-top-row">
            <span className="card-kicker">Target Career Direction</span>
            <button
              type="button"
              className="text-link-btn"
              onClick={onGoToEdit}
            >
              Change Role ↗
            </button>
          </div>

          <div className="spotlight-title-row">
            <div className="role-icon-box">🎯</div>
            <div>
              <h3 className="spotlight-role-name">{targetRole}</h3>
              <div className="spotlight-meta-badges">
                <span className="badge badge-indigo">{profile.experienceLevel}</span>
                <span className="badge badge-emerald">Verified in Database</span>
              </div>
            </div>
          </div>

          <p className="spotlight-desc">
            Your career gap analysis will evaluate how closely your current skills match the standard
            qualifications and requirements expected for a <strong>{targetRole}</strong>.
          </p>

          {/* High-impact Gap Analysis Action Box */}
          <div className="launch-analysis-banner">
            <div className="launch-text">
              <h4>Ready to check your skill readiness?</h4>
              <p>Compare your {skills.length} skills against industry benchmarks.</p>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-launch"
              onClick={onGoToGap}
            >
              Analyze Skill Gap ⚡
            </button>
          </div>
        </div>

        {/* Education & Academic Credentials */}
        <div className="card education-card">
          <div className="card-top-row">
            <span className="card-kicker">Academic Background</span>
            <button
              type="button"
              className="text-link-btn"
              onClick={onGoToEdit}
            >
              Update ↗
            </button>
          </div>

          {profile.education?.degree ? (
            <div className="education-detail-row">
              <div className="edu-icon-circle">🎓</div>
              <div className="edu-info-block">
                <h4 className="edu-degree-title">
                  {profile.education.degree}
                  {profile.education.fieldOfStudy ? ` in ${profile.education.fieldOfStudy}` : ""}
                </h4>
                <p className="edu-institution-text">
                  {profile.education.institution || "College / University not specified"}
                </p>
                {profile.education.graduationYear && (
                  <span className="edu-year-badge">Class of {profile.education.graduationYear}</span>
                )}
              </div>
            </div>
          ) : (
            <div className="education-empty-notice">
              <p>No education details added yet.</p>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onGoToEdit}
              >
                + Add Education
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Skills Arsenal */}
      <div className="overview-col-side">
        <div className="card skills-arsenal-card">
          <div className="card-top-row">
            <div>
              <span className="card-kicker">My Competencies</span>
              <h3 className="card-heading-clean">Skills Arsenal</h3>
            </div>
            <span className="count-pill">{skills.length} Total</span>
          </div>

          <p className="skills-sub-desc">
            These are the skills you currently possess and are saved in your profile.
          </p>

          <div className="skills-cloud-container">
            {skills.length > 0 ? (
              skills.map((skill, index) => (
                <div key={index} className="arsenal-skill-chip">
                  <span className="chip-check">✓</span>
                  <span className="chip-text">{skill}</span>
                </div>
              ))
            ) : (
              <div className="no-skills-box">
                <p>No skills recorded in your profile yet.</p>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={onGoToEdit}
                >
                  + Add Skills
                </button>
              </div>
            )}
          </div>

          <div className="skills-footer-action">
            <button
              type="button"
              className="btn btn-secondary btn-block"
              onClick={onGoToEdit}
            >
              + Add / Edit Skills in Arsenal
            </button>
          </div>
        </div>

        {/* Database & Sync Status Card */}
        <div className="card db-meta-card">
          <div className="db-meta-header">
            <span className="status-dot online"></span>
            <strong>Database Synchronization</strong>
          </div>
          <div className="db-meta-list">
            <div className="db-meta-item">
              <span>Database</span>
              <code>career_skill_analyzer</code>
            </div>
            <div className="db-meta-item">
              <span>User ID</span>
              <code>{user._id}</code>
            </div>
            <div className="db-meta-item">
              <span>Profile Record</span>
              <code>{profile._id || "Linked"}</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
