import type { UserProfile } from "../types/profile";
import type { AuthUser } from "../types/auth";

interface MyProfileOverviewProps {
  user: AuthUser;
  profile: UserProfile | null;
  loading: boolean;
}

export default function MyProfileOverview({
  user,
  profile,
  loading,
}: MyProfileOverviewProps) {
  if (loading) {
    return (
      <div className="card overview-card">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your personal profile from MongoDB...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card overview-card">
      <div className="overview-header">
        <div className="user-avatar-large">
          <span>{user.name.charAt(0).toUpperCase()}</span>
        </div>
        <div>
          <h2>{user.name}</h2>
          <span className="user-email-subtitle">{user.email}</span>
        </div>
      </div>

      {profile && profile.targetRole ? (
        <div className="overview-content">
          {/* Target Role & Experience */}
          <div className="overview-highlight-box">
            <div className="highlight-item">
              <span className="highlight-label">Target Role</span>
              <span className="highlight-value role-text">{profile.targetRole}</span>
            </div>
            <div className="highlight-item">
              <span className="highlight-label">Experience</span>
              <span className="highlight-value">{profile.experienceLevel}</span>
            </div>
          </div>

          {/* Education Info */}
          {profile.education?.degree && (
            <div className="education-summary">
              <span className="summary-icon">🎓</span>
              <div>
                <strong>{profile.education.degree}</strong>
                {profile.education.fieldOfStudy ? ` in ${profile.education.fieldOfStudy}` : ""}
                {profile.education.institution ? ` &bull; ${profile.education.institution}` : ""}
                {profile.education.graduationYear ? ` (${profile.education.graduationYear})` : ""}
              </div>
            </div>
          )}

          {/* Acquired Skills */}
          <div className="overview-skills-section">
            <div className="skills-section-header">
              <span className="skills-title">My Acquired Skills</span>
              <span className="skills-count-badge">
                {profile.currentSkills?.length || 0} skills
              </span>
            </div>

            <div className="overview-skills-tags">
              {profile.currentSkills && profile.currentSkills.length > 0 ? (
                profile.currentSkills.map((skill, idx) => (
                  <span key={idx} className="skill-chip acquired-skill">
                    ✓ {skill}
                  </span>
                ))
              ) : (
                <p className="no-skills-hint">
                  No skills recorded yet. Add your current skills in the form to get started.
                </p>
              )}
            </div>
          </div>

          {/* Feature 2 Next Step Preview */}
          <div className="gap-analysis-teaser">
            <div className="teaser-badge">Up Next: Feature 2</div>
            <h3>Skill Gap Analyzer</h3>
            <p>
              The engine will compare your <strong>{profile.currentSkills?.length || 0} skills</strong> against
              the benchmark requirements for <strong>{profile.targetRole}</strong> and calculate your match percentage!
            </p>
          </div>
        </div>
      ) : (
        <div className="empty-profile-state">
          <div className="empty-icon">📝</div>
          <h3>Profile Incomplete</h3>
          <p>
            You haven't set your target career role and skills yet. Fill out the form to save your
            profile to MongoDB!
          </p>
        </div>
      )}

      <div className="overview-footer">
        <span>
          Account ID: <code>{user._id}</code>
        </span>
        {profile?._id && (
          <span>
            Profile ID: <code>{profile._id}</code>
          </span>
        )}
      </div>
    </div>
  );
}
