import { useState } from "react";
import type { UserProfile } from "../../types/profile";
import type { RoleAnalysisResult } from "../../types/role";
import { analyzeCustomJobWithAi } from "../../services/api";

interface CustomJobTabProps {
  token: string | null;
  profile: UserProfile | null;
  onUpdateTargetRole: (newRole: string) => void;
  onGoToRoadmap: () => void;
  onGoToEdit: () => void;
}

const SAMPLE_JOB_POSTINGS = [
  {
    label: "Cloud & DevOps Engineer (Sample)",
    text: `Job Title: Associate Cloud & DevOps Engineer
Company: CloudScale Solutions
Location: Remote / Hybrid

About the Role:
We are seeking an ambitious Associate Cloud Engineer to help manage infrastructure and deployments.

Requirements & Core Competencies:
- Strong Linux command line proficiency and Bash scripting.
- Experience with Cloud platforms (AWS or Azure: IAM, VPC, EC2, S3).
- Containerization hands-on experience using Docker.
- Building CI/CD deployment pipelines (GitHub Actions or Jenkins).
- Solid understanding of Git version control.

Nice to Have / Bonus:
- Familiarity with Kubernetes orchestration.
- Basic Infrastructure as Code using Terraform.
- Scripting in Python for cloud automation.
- Basic monitoring with Prometheus or Grafana.`,
  },
  {
    label: "Full Stack Web Developer (Sample)",
    text: `Position: Junior Full Stack Developer
Company: Apex Digital Labs
Experience: 0-2 Years

Overview:
Looking for a passionate developer to build modern web applications and microservice backends.

Must-Have Requirements:
- Proficiency in JavaScript and TypeScript.
- Hands-on experience with React.js and modern state management.
- Backend development with Node.js and Express.
- Experience designing and integrating RESTful APIs.
- Database knowledge with MongoDB or PostgreSQL.

Good-to-Have Skills:
- Experience with Next.js and Tailwind CSS.
- Basic Docker containerization.
- Unit testing with Jest.
- Cloud deployment on Vercel or AWS.`,
  },
  {
    label: "Cybersecurity Analyst (Sample)",
    text: `Role: Cyber Defense & Security Operations Analyst
Company: SecureGrid Technologies
Experience Level: Entry Level / Fresher

Responsibilities:
Analyze alerts, inspect network traffic, and maintain defensive security posture.

Core Qualifications:
- Solid grasp of Network Security fundamentals and TCP/IP protocols.
- Packet analysis and troubleshooting with Wireshark.
- Linux system administration and log analysis.
- Experience with SIEM tools (Splunk, Wazuh, or ELK).
- Understanding of web application security (OWASP Top 10).

Preferred Bonus:
- Basic Python scripting for security automation.
- Familiarity with ethical hacking and vulnerability scanners (Nmap, Metasploit).
- Security+ or equivalent certification knowledge.`,
  },
];

export default function CustomJobTab({
  token,
  profile,
  onUpdateTargetRole,
  onGoToRoadmap,
}: CustomJobTabProps) {
  const [jobText, setJobText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [analysisResult, setAnalysisResult] = useState<RoleAnalysisResult | null>(null);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState("");

  const handleAnalyze = async () => {
    if (!token) {
      setError("Please log in to analyze custom job postings.");
      return;
    }

    if (!jobText.trim() || jobText.trim().length < 25) {
      setError("Please paste a complete job description (at least 25 characters).");
      return;
    }

    setError("");
    setSavedSuccessMsg("");
    setLoading(true);

    try {
      const result = await analyzeCustomJobWithAi(
        token,
        jobText.trim(),
        profile?.currentSkills
      );
      setAnalysisResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze job description.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = (sampleText: string) => {
    setJobText(sampleText);
    setError("");
  };

  const handleSetAsTarget = (roleTitle: string) => {
    onUpdateTargetRole(roleTitle);
    setSavedSuccessMsg(`"${roleTitle}" is now set as your active career target role!`);
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setJobText("");
    setError("");
    setSavedSuccessMsg("");
  };

  return (
    <div className="custom-job-tab-container">
      {/* Top Banner */}
      <div className="card custom-job-banner">
        <div className="custom-job-banner-left">
          <div className="ai-model-tag">
            <span className="ai-sparkle-dot"></span>
            <span>Powered by Google Gemini Flash AI</span>
          </div>

          <h2 className="custom-job-title">Analyze Custom Job Description</h2>
          <p className="custom-job-sub">
            Found an opening on LinkedIn, Indeed, or Naukri? Paste the raw job posting text below.
            Gemini Flash AI will extract its core must-haves and bonus requirements, then evaluate
            your profile against them in real time (~2s).
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>⚠️</span>
          <div>{error}</div>
        </div>
      )}

      {savedSuccessMsg && (
        <div className="alert alert-success">
          <span>✓</span>
          <div>{savedSuccessMsg}</div>
        </div>
      )}

      {/* INPUT FORM (Visible when no result yet) */}
      {!analysisResult && !loading && (
        <div className="card custom-job-input-card">
          <div className="input-card-header">
            <div className="input-card-title-group">
              <span className="card-kicker">Job Description Input</span>
              <h3>Paste Job Opening Details</h3>
            </div>

            {/* Quick Load Sample Buttons */}
            <div className="sample-loaders-wrap">
              <span className="sample-label">Or try a sample:</span>
              <div className="sample-buttons-row">
                {SAMPLE_JOB_POSTINGS.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="btn-sample-job"
                    onClick={() => handleLoadSample(sample.text)}
                  >
                    ⚡ {sample.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="custom-job-textarea-wrap">
            <textarea
              className="form-control custom-job-textarea"
              rows={11}
              placeholder="Paste the job posting description here (Job title, company overview, requirements, qualifications, responsibilities, good to haves)..."
              value={jobText}
              onChange={(e) => setJobText(e.target.value)}
            />
            <div className="textarea-footer">
              <span>{jobText.length} characters</span>
              <span>Gemini Flash handles unstructured, multi-paragraph job postings</span>
            </div>
          </div>

          <div className="custom-job-action-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setJobText("")}
              disabled={!jobText}
            >
              Clear Text
            </button>
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={handleAnalyze}
              disabled={!jobText.trim()}
            >
              🚀 Analyze Job Match with Gemini Flash
            </button>
          </div>
        </div>
      )}

      {/* LOADING STATE */}
      {loading && (
        <div className="card custom-job-loading-card">
          <div className="ai-pulse-orb"></div>
          <h3 className="job-loading-title">Extracting Job Requirements with Gemini Flash</h3>
          <p className="job-loading-sub">
            Parsing qualifications, identifying core vs. bonus skills, and calculating candidate readiness...
          </p>
          <div className="job-loading-steps">
            <span>📋 Role Profiling</span>
            <span>•</span>
            <span>🎯 Core vs Bonus Separation</span>
            <span>•</span>
            <span>📊 Skill Gap Scoring</span>
          </div>
        </div>
      )}

      {/* RESULTS VIEW */}
      {analysisResult && !loading && (
        <div className="custom-job-results-layout">
          {/* Top Results Overview Card */}
          <div className="card custom-job-overview-card">
            <div className="job-overview-top">
              <div className="job-overview-left">
                <div className="job-tags-row">
                  <span className="job-category-tag">
                    🏷️ {analysisResult.role.category || "Technology"}
                  </span>
                  <span className="job-exp-tag">
                    🔥 {analysisResult.role.demandLevel || "High"} Demand
                  </span>
                  <span className="job-ai-verified-tag">Gemini Verified</span>
                </div>

                <h2 className="job-result-title">{analysisResult.role.title}</h2>
                <p className="job-result-desc">{analysisResult.role.description}</p>
                {profile && (
                  <p className="job-candidate-note">
                    Candidate: <strong>{profile.name}</strong> • Tested against {profile.currentSkills.length} skills in profile
                  </p>
                )}
              </div>

              {/* Match Score Wheel */}
              <div className="job-score-box">
                <div className="score-circle">
                  <span className="score-number">{analysisResult.scores.overallMatch}%</span>
                  <span className="score-sub">Match</span>
                </div>

                <div className="score-stats">
                  <div className="score-status-badge">
                    {analysisResult.scores.readinessStatus}
                  </div>
                  <span className="stat-matched">
                    Core: {analysisResult.scores.coreMatch}%
                  </span>
                  <span className="stat-optional">
                    Bonus: {analysisResult.scores.bonusMatch}%
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Bar */}
            <div className="job-overview-actions-row">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleReset}
              >
                🔄 Analyze Another Job
              </button>

              <div className="job-actions-right">
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => handleSetAsTarget(analysisResult.role.title)}
                >
                  ⭐ Set as My Profile Target Role
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={onGoToRoadmap}
                >
                  🤖 Generate AI Learning Roadmap
                </button>
              </div>
            </div>
          </div>

          {/* Competency Gap Breakdowns */}
          <div className="gap-grids-container">
            {/* Core Must-Haves Card */}
            <div className="card core-requirements-card">
              <div className="card-top-row">
                <div>
                  <span className="card-kicker">Critical Requirements</span>
                  <h3 className="section-title">Must-Have Core Skills</h3>
                </div>
                <span className="count-pill">
                  {analysisResult.breakdown.core.matchedCount} of {analysisResult.breakdown.core.total} Acquired
                </span>
              </div>

              <div className="metric-bar-wrap">
                <div className="progress-info-row">
                  <span className="progress-title">Core Match Readiness</span>
                  <span className="progress-val">{analysisResult.scores.coreMatch}%</span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill core-fill"
                    style={{ width: `${analysisResult.scores.coreMatch}%` }}
                  ></div>
                </div>
              </div>

              {/* Matched Core Skills */}
              <div className="skills-subgroup">
                <span className="subgroup-label">
                  ✓ Matched in Your Arsenal ({analysisResult.breakdown.core.matchedCount}):
                </span>
                <div className="skills-chips-wrap">
                  {analysisResult.breakdown.core.matched.length > 0 ? (
                    analysisResult.breakdown.core.matched.map((s: string) => (
                      <span key={s} className="skill-chip acquired-skill">
                        ✓ {s}
                      </span>
                    ))
                  ) : (
                    <span className="no-skills-msg">
                      None of the required core skills are in your profile yet.
                    </span>
                  )}
                </div>
              </div>

              {/* Missing Core Skills */}
              <div className="skills-subgroup">
                <span className="subgroup-label label-missing">
                  ✕ Missing Must-Haves ({analysisResult.breakdown.core.missingCount}):
                </span>
                <div className="skills-chips-wrap">
                  {analysisResult.breakdown.core.missing.length > 0 ? (
                    analysisResult.breakdown.core.missing.map((s: string) => (
                      <span key={s} className="skill-chip missing-skill">
                        ✕ {s}
                      </span>
                    ))
                  ) : (
                    <span className="all-matched-msg">
                      🎉 Perfect! You possess all core requirements for this role!
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Optional / Bonus Competencies Card */}
            <div className="card optional-requirements-card">
              <div className="card-top-row">
                <div>
                  <span className="card-kicker">Competitive Edge</span>
                  <h3 className="section-title">Bonus &amp; Good-to-Have Skills</h3>
                </div>
                <span className="count-pill">
                  {analysisResult.breakdown.optional.matchedCount} of {analysisResult.breakdown.optional.total} Acquired
                </span>
              </div>

              <div className="metric-bar-wrap">
                <div className="progress-info-row">
                  <span className="progress-title">Bonus Match Readiness</span>
                  <span className="progress-val">{analysisResult.scores.bonusMatch}%</span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill bonus-fill"
                    style={{ width: `${analysisResult.scores.bonusMatch}%` }}
                  ></div>
                </div>
              </div>

              {/* Matched Bonus Skills */}
              <div className="skills-subgroup">
                <span className="subgroup-label">
                  ✓ Acquired Bonus Skills ({analysisResult.breakdown.optional.matchedCount}):
                </span>
                <div className="skills-chips-wrap">
                  {analysisResult.breakdown.optional.matched.length > 0 ? (
                    analysisResult.breakdown.optional.matched.map((s: string) => (
                      <span key={s} className="skill-chip bonus-acquired-skill">
                        ✓ {s}
                      </span>
                    ))
                  ) : (
                    <span className="no-skills-msg">
                      No optional bonus skills currently in your profile.
                    </span>
                  )}
                </div>
              </div>

              {/* Missing Bonus Skills */}
              <div className="skills-subgroup">
                <span className="subgroup-label label-missing">
                  ✕ Missing Competitive Edge ({analysisResult.breakdown.optional.missingCount}):
                </span>
                <div className="skills-chips-wrap">
                  {analysisResult.breakdown.optional.missing.length > 0 ? (
                    analysisResult.breakdown.optional.missing.map((s: string) => (
                      <span key={s} className="skill-chip missing-skill-optional">
                        + {s}
                      </span>
                    ))
                  ) : (
                    <span className="all-matched-msg">
                      ⭐ All bonus competitive qualifications satisfied!
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
