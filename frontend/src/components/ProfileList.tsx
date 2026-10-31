import type { UserProfile } from "../types/profile";

interface ProfileListProps {
  profiles: UserProfile[];
  loading: boolean;
  onRefresh: () => void;
}

export default function ProfileList({ profiles, loading, onRefresh }: ProfileListProps) {
  return (
    <div className="card list-card">
      <div className="list-card-header">
        <div>
          <h2>Saved Profiles in MongoDB</h2>
          <p className="card-subtitle">
            Live records stored in local database: <code>career_skill_analyzer</code>
          </p>
        </div>
        <button
          id="refresh-profiles-btn"
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onRefresh}
          disabled={loading}
          title="Fetch latest from MongoDB"
        >
          {loading ? "Refreshing..." : "↻ Refresh"}
        </button>
      </div>

      {loading && profiles.length === 0 ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Connecting to MongoDB and loading profiles...</p>
        </div>
      ) : profiles.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📂</div>
          <h3>No Profiles Saved Yet</h3>
          <p>Fill out the form to save your first career profile to MongoDB!</p>
        </div>
      ) : (
        <div className="profiles-container">
          <div className="profiles-counter">
            Showing <strong>{profiles.length}</strong> {profiles.length === 1 ? "profile" : "profiles"}
          </div>

          <div className="profiles-grid">
            {profiles.map((profile) => (
              <div key={profile._id} className="profile-item-card">
                <div className="profile-header-row">
                  <div>
                    <h3 className="profile-name">{profile.name}</h3>
                    <span className="profile-email">{profile.email}</span>
                  </div>
                  <span className="role-badge">{profile.targetRole}</span>
                </div>

                <div className="profile-meta-row">
                  <span className="meta-tag experience-tag">
                    🎯 {profile.experienceLevel}
                  </span>
                  {profile.education?.degree && (
                    <span className="meta-tag education-tag">
                      🎓 {profile.education.degree}
                      {profile.education.fieldOfStudy ? ` in ${profile.education.fieldOfStudy}` : ""}
                      {profile.education.graduationYear ? ` ('${profile.education.graduationYear.toString().slice(-2)})` : ""}
                    </span>
                  )}
                </div>

                {/* Skills tags */}
                <div className="profile-skills-section">
                  <span className="skills-heading">Skills:</span>
                  <div className="profile-skills-list">
                    {profile.currentSkills && profile.currentSkills.length > 0 ? (
                      profile.currentSkills.map((skill, idx) => (
                        <span key={idx} className="skill-pill">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="no-skills-text">No skills listed</span>
                    )}
                  </div>
                </div>

                {/* Compass & Date Footer */}
                <div className="profile-footer-row">
                  <span className="db-id-hint" title="MongoDB document ObjectId">
                    MongoDB ID: <code>{profile._id}</code>
                  </span>
                  {profile.createdAt && (
                    <span className="profile-date">
                      {new Date(profile.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
