import type { UserProfile } from "../../types/profile";

interface SkillGapTabProps {
  profile: UserProfile | null;
  onGoToEdit: () => void;
}

// Sample role benchmarks to demonstrate the analysis concept
const ROLE_BENCHMARKS: Record<string, string[]> = {
  "Full Stack Developer": [
    "JavaScript",
    "TypeScript",
    "React",
    "Node.js",
    "Express",
    "MongoDB",
    "SQL",
    "Git",
    "REST APIs",
    "HTML",
    "CSS",
  ],
  "Frontend Developer": [
    "JavaScript",
    "TypeScript",
    "React",
    "HTML",
    "CSS",
    "Git",
    "Responsive Design",
    "TailwindCSS",
    "Web Performance",
  ],
  "Backend Developer": [
    "Node.js",
    "Express",
    "Python",
    "MongoDB",
    "SQL",
    "REST APIs",
    "Docker",
    "Git",
    "Authentication",
    "System Design",
  ],
  "Data Scientist": [
    "Python",
    "SQL",
    "Machine Learning",
    "Pandas",
    "NumPy",
    "Data Visualization",
    "Git",
    "Statistics",
  ],
};

export default function SkillGapTab({ profile, onGoToEdit }: SkillGapTabProps) {
  const targetRole = profile?.targetRole;
  const userSkills = (profile?.currentSkills || []).map((s) => s.toLowerCase());

  if (!targetRole) {
    return (
      <div className="card empty-gap-card">
        <div className="empty-gap-icon">🎯</div>
        <h2>No Target Role Selected</h2>
        <p>Please select your target dream role in your profile to run the skill gap analysis.</p>
        <button type="button" className="btn btn-primary" onClick={onGoToEdit}>
          Select Target Role
        </button>
      </div>
    );
  }

  // Find benchmark skills for role, or provide fallback
  const benchmarkSkills =
    ROLE_BENCHMARKS[targetRole] || [
      "JavaScript",
      "React",
      "Node.js",
      "SQL",
      "Git",
      "REST APIs",
      "System Architecture",
    ];

  // Calculate matching vs missing
  const matchingSkills = benchmarkSkills.filter((b) =>
    userSkills.includes(b.toLowerCase())
  );
  const missingSkills = benchmarkSkills.filter(
    (b) => !userSkills.includes(b.toLowerCase())
  );

  const matchPercentage = Math.round(
    (matchingSkills.length / benchmarkSkills.length) * 100
  );

  return (
    <div className="skill-gap-tab-container">
      {/* Top Gap Summary Banner */}
      <div className="card gap-summary-banner">
        <div className="gap-banner-content">
          <span className="gap-kicker">Role Readiness Analysis</span>
          <h2 className="gap-title">Target: {targetRole}</h2>
          <p className="gap-description">
            We evaluated your current skills against the industry baseline requirements for a{" "}
            <strong>{targetRole}</strong>.
          </p>
        </div>

        {/* Circular / Big Match Score */}
        <div className="gap-score-box">
          <div className="score-circle">
            <span className="score-number">{matchPercentage}%</span>
            <span className="score-sub">Match</span>
          </div>
          <div className="score-stats">
            <span className="stat-matched">✓ {matchingSkills.length} Acquired</span>
            <span className="stat-missing">⚡ {missingSkills.length} To Learn</span>
          </div>
        </div>
      </div>

      {/* Two Column Breakdown */}
      <div className="gap-grid">
        {/* Acquired / Matching Skills */}
        <div className="card gap-column-card">
          <div className="gap-col-header">
            <div className="col-header-icon success-icon">✓</div>
            <div>
              <h3>Matched Skills ({matchingSkills.length})</h3>
              <p>Skills you already possess that meet this role's requirements</p>
            </div>
          </div>

          <div className="skills-tag-wrap">
            {matchingSkills.length > 0 ? (
              matchingSkills.map((skill) => (
                <div key={skill} className="skill-chip acquired-skill">
                  <span>✓</span>
                  <span>{skill}</span>
                </div>
              ))
            ) : (
              <p className="no-skills-hint">
                None of your current skills matched the standard benchmark yet. Try adding more
                skills in settings.
              </p>
            )}
          </div>
        </div>

        {/* Missing Skills / The Gap */}
        <div className="card gap-column-card missing-card">
          <div className="gap-col-header">
            <div className="col-header-icon warning-icon">⚡</div>
            <div>
              <h3>Skill Gaps to Close ({missingSkills.length})</h3>
              <p>Recommended skills to learn next to become job-ready</p>
            </div>
          </div>

          <div className="skills-tag-wrap">
            {missingSkills.length > 0 ? (
              missingSkills.map((skill) => (
                <div key={skill} className="skill-chip missing-skill-chip">
                  <span>+</span>
                  <span>{skill}</span>
                </div>
              ))
            ) : (
              <div className="all-matched-banner">
                🎉 Incredible! You've matched 100% of the core benchmark skills for this role!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feature 3 Sneak Peek - AI Career Roadmap */}
      <div className="card ai-teaser-card">
        <div className="ai-teaser-badge">Planned: Feature 3</div>
        <div className="ai-teaser-body">
          <div className="ai-teaser-icon">🤖</div>
          <div className="ai-teaser-text">
            <h3>AI-Powered Learning Roadmap (Google Gemini)</h3>
            <p>
              In our next milestone, we will connect the Google Gemini API to automatically generate
              a personalized, step-by-step learning schedule and project suggestions for your{" "}
              <strong>{missingSkills.length} missing skills</strong>!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
