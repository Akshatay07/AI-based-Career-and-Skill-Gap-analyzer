import { useState, useEffect } from "react";
import type { UserProfile } from "../../types/profile";
import type { CareerRole, RoleAnalysisResult } from "../../types/role";
import { analyzeSkillsAgainstRole } from "../../services/api";
import RoleExplorerModal from "./RoleExplorerModal";

interface SkillGapTabProps {
  profile: UserProfile | null;
  roles: CareerRole[];
  onGoToEdit: () => void;
  onUpdateTargetRole: (newRoleTitle: string) => void;
  onGoToRoadmap: () => void;
}

export default function SkillGapTab({
  profile,
  roles,
  onGoToEdit,
  onUpdateTargetRole,
  onGoToRoadmap,
}: SkillGapTabProps) {
  const targetRole = profile?.targetRole;
  const userSkills = profile?.currentSkills || [];

  // Comparison role state (defaults to user's saved target role, but user can simulate others)
  const [activeComparisonRole, setActiveComparisonRole] = useState<string>(targetRole || "");
  const [analysis, setAnalysis] = useState<RoleAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);

  // Sync with profile's target role on initial load or change
  useEffect(() => {
    if (targetRole && !activeComparisonRole) {
      setActiveComparisonRole(targetRole);
    }
  }, [targetRole, activeComparisonRole]);

  // Run analysis whenever comparison role or skills change
  useEffect(() => {
    const roleToAnalyze = activeComparisonRole || targetRole;
    if (!roleToAnalyze) return;

    let isMounted = true;
    setLoading(true);
    setError("");

    analyzeSkillsAgainstRole(roleToAnalyze, userSkills)
      .then((res) => {
        if (isMounted) {
          setAnalysis(res);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "Failed to analyze skills");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeComparisonRole, targetRole, userSkills]);

  if (!targetRole && !activeComparisonRole) {
    return (
      <div className="card empty-gap-card">
        <div className="empty-gap-icon">🎯</div>
        <h2>No Target Role Selected</h2>
        <p>
          Please select your dream career role to calculate your skill readiness against MongoDB
          industry benchmarks.
        </p>
        <button type="button" className="btn btn-primary" onClick={onGoToEdit}>
          Select Target Role ✏️
        </button>
      </div>
    );
  }

  const isSimulated =
    activeComparisonRole &&
    targetRole &&
    activeComparisonRole.toLowerCase() !== targetRole.toLowerCase();

  return (
    <div className="skill-gap-tab-container">
      {/* Top Gap Summary Banner */}
      <div className="card gap-summary-banner">
        <div className="gap-banner-content">
          <div className="role-switch-row">
            <span className="gap-kicker">
              {isSimulated ? "Simulated Comparison Role" : "Target Role Readiness"}
            </span>
            <button
              type="button"
              className="role-compare-btn"
              onClick={() => setIsExplorerOpen(true)}
            >
              🔄 Compare With Another Role
            </button>
          </div>

          <h2 className="gap-title">
            {analysis?.role?.title || activeComparisonRole || targetRole}
          </h2>

          <p className="gap-description">
            {analysis?.role?.description ||
              `Evaluated against the industry baseline requirements for ${activeComparisonRole || targetRole}.`}
          </p>

          {isSimulated && (
            <div className="simulation-notice-bar">
              <span>
                💡 You are previewing <strong>{activeComparisonRole}</strong>. Your saved profile target is{" "}
                <strong>{targetRole}</strong>.
              </span>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => onUpdateTargetRole(activeComparisonRole)}
              >
                Set As My Target Role
              </button>
            </div>
          )}
        </div>

        {/* Big Match Score Box */}
        <div className="gap-score-box">
          <div className="score-circle">
            <span className="score-number">
              {loading ? "..." : `${analysis?.scores.overallMatch || 0}%`}
            </span>
            <span className="score-sub">Match</span>
          </div>

          <div className="score-stats">
            <div className="score-status-badge">
              {analysis?.scores.readinessStatus || "Evaluating"}
            </div>
            <span className="stat-matched">
              ✓ {analysis?.breakdown.core.matchedCount || 0} Core Acquired
            </span>
            <span className="stat-missing">
              ⚡ {analysis?.breakdown.core.missingCount || 0} Core Gaps
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bars Row */}
      {analysis && (
        <div className="card gap-metrics-row">
          <div className="progress-group">
            <div className="progress-info-row">
              <span className="progress-title">Core Essential Requirements</span>
              <span className="progress-val">
                {analysis.breakdown.core.matchedCount} of {analysis.breakdown.core.total} skills (
                {analysis.scores.coreMatch}%)
              </span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill core-fill"
                style={{ width: `${analysis.scores.coreMatch}%` }}
              ></div>
            </div>
          </div>

          <div className="progress-group">
            <div className="progress-info-row">
              <span className="progress-title">Bonus / Competitive Skills</span>
              <span className="progress-val">
                {analysis.breakdown.optional.matchedCount} of {analysis.breakdown.optional.total} skills (
                {analysis.scores.bonusMatch}%)
              </span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill bonus-fill"
                style={{ width: `${analysis.scores.bonusMatch}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="alert alert-error">
          <span>⚠️</span>
          <div>{error}</div>
        </div>
      )}

      {/* Two Column Detailed Breakdown */}
      {analysis && (
        <div className="gap-grid">
          {/* Column 1: Core Essential Gaps vs Matched */}
          <div className="card gap-column-card">
            <div className="gap-col-header">
              <div className="col-header-icon warning-icon">⚡</div>
              <div>
                <h3>Critical Core Gaps ({analysis.breakdown.core.missingCount})</h3>
                <p>Must-have skills you need to learn to be considered for this role</p>
              </div>
            </div>

            <div className="skills-tag-wrap">
              {analysis.breakdown.core.missing.length > 0 ? (
                analysis.breakdown.core.missing.map((skill) => (
                  <div key={skill} className="skill-chip missing-skill-chip core-gap-chip">
                    <span className="gap-priority-dot">●</span>
                    <span>{skill}</span>
                    <span className="skill-priority-tag">Must-Have</span>
                  </div>
                ))
              ) : (
                <div className="all-matched-banner">
                  🎉 Outstanding! You have acquired all core required skills for this role!
                </div>
              )}
            </div>

            {/* Matched Core Skills Sub-section */}
            <div className="matched-sub-section">
              <h4 className="matched-sub-title">
                ✓ Core Skills Already Acquired ({analysis.breakdown.core.matchedCount})
              </h4>
              <div className="skills-tag-wrap-compact">
                {analysis.breakdown.core.matched.map((skill) => (
                  <span key={skill} className="skill-chip acquired-skill">
                    ✓ {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: Bonus & Competitive Skills */}
          <div className="card gap-column-card">
            <div className="gap-col-header">
              <div className="col-header-icon bonus-icon">✨</div>
              <div>
                <h3>Bonus Competencies ({analysis.breakdown.optional.total})</h3>
                <p>Modern industry extras that give you an edge over other applicants</p>
              </div>
            </div>

            <div className="skills-tag-wrap">
              {analysis.breakdown.optional.missing.length > 0 ? (
                analysis.breakdown.optional.missing.map((skill) => (
                  <div key={skill} className="skill-chip optional-gap-chip">
                    <span>+</span>
                    <span>{skill}</span>
                    <span className="bonus-tag">Bonus</span>
                  </div>
                ))
              ) : (
                <div className="all-matched-banner">
                  🌟 All bonus competencies acquired! You are highly competitive.
                </div>
              )}
            </div>

            {/* Matched Optional Skills */}
            {analysis.breakdown.optional.matched.length > 0 && (
              <div className="matched-sub-section">
                <h4 className="matched-sub-title">
                  ✓ Bonus Competencies Acquired ({analysis.breakdown.optional.matchedCount})
                </h4>
                <div className="skills-tag-wrap-compact">
                  {analysis.breakdown.optional.matched.map((skill) => (
                    <span key={skill} className="skill-chip acquired-skill">
                      ✓ {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Gemini AI Learning Roadmap Action Card */}
      <div className="card ai-teaser-card active-ai-card">
        <div className="ai-teaser-badge">Powered by Gemini 3.8 Flash</div>
        <div className="ai-teaser-body">
          <div className="ai-teaser-icon">🤖</div>
          <div className="ai-teaser-text">
            <h3>Generate Personalized AI Learning Roadmap</h3>
            <p>
              Ready to close the gap? Google Gemini will analyze your{" "}
              <strong>{analysis?.breakdown.core.missingCount || 0} critical skill gaps</strong> and
              build a step-by-step weekly roadmap, interactive checklist, and portfolio project suggestions for you!
            </p>
            <div className="ai-cta-action">
              <button
                type="button"
                className="btn btn-primary"
                onClick={onGoToRoadmap}
              >
                🚀 Open AI Learning Roadmap
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Role Explorer Modal */}
      <RoleExplorerModal
        isOpen={isExplorerOpen}
        onClose={() => setIsExplorerOpen(false)}
        roles={roles}
        currentRoleTitle={activeComparisonRole || targetRole}
        onSelectRole={(newRole) => {
          setActiveComparisonRole(newRole);
          onUpdateTargetRole(newRole);
        }}
        onSimulateRole={(role) => {
          setActiveComparisonRole(role.title);
        }}
      />
    </div>
  );
}
