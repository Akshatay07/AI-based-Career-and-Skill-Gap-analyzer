import { useState, useEffect, useCallback, useMemo } from "react";
import type { UserProfile } from "../../types/profile";
import type { JobOpportunity, SavedJob } from "../../types/job";
import {
  fetchLiveJobs,
  fetchSavedJobs,
  saveJobBookmark,
  removeJobBookmark,
} from "../../services/api";

interface JobOpportunitiesTabProps {
  token: string | null;
  profile: UserProfile | null;
  onTestWithAi: (job: JobOpportunity) => void;
  onGoToEdit?: () => void;
}

const QUICK_SEARCH_ROLES = [
  "All Openings",
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "Python",
  "AI & Machine Learning",
  "DevOps Engineer",
  "Data Analyst",
];

export default function JobOpportunitiesTab({
  token,
  profile,
  onTestWithAi,
  onGoToEdit,
}: JobOpportunitiesTabProps) {
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState(profile?.targetRole || "");
  const [locationQuery, setLocationQuery] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [selectedRolePill, setSelectedRolePill] = useState("All Openings");

  // Tab view: "live" | "saved"
  const [viewMode, setViewMode] = useState<"live" | "saved">("live");

  // Data state
  const [jobs, setJobs] = useState<JobOpportunity[]>([]);
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingJobId, setSavingJobId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState("");

  const candidateSkills = useMemo(
    () => profile?.currentSkills || [],
    [profile?.currentSkills]
  );

  // Load Saved Jobs from MongoDB (if logged in)
  const loadSavedJobs = useCallback(async () => {
    if (!token) return;
    try {
      const saved = await fetchSavedJobs(token);
      setSavedJobs(saved);
    } catch (err) {
      console.warn("Could not load saved jobs:", err);
    }
  }, [token]);

  // Load live jobs from backend
  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const queryToUse =
        selectedRolePill !== "All Openings"
          ? selectedRolePill
          : searchQuery.trim();

      const results = await fetchLiveJobs(
        {
          query: queryToUse,
          location: locationQuery.trim(),
          remoteOnly,
          skills: candidateSkills,
        },
        token
      );
      setJobs(results);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load live jobs. Please check your network connection."
      );
    } finally {
      setLoading(false);
    }
  }, [selectedRolePill, searchQuery, locationQuery, remoteOnly, candidateSkills, token]);

  // Initial load
  useEffect(() => {
    loadJobs();
    loadSavedJobs();
  }, [loadJobs, loadSavedJobs]);

  // Handle Quick Role Pill Click
  const handlePillClick = (role: string) => {
    setSelectedRolePill(role);
    if (role === "All Openings") {
      setSearchQuery("");
    } else {
      setSearchQuery(role);
    }
  };

  // Check if job is in user's saved list
  const isJobSaved = (jobId: string) => {
    return savedJobs.some((saved) => saved.id === jobId);
  };

  // Toggle Save Bookmark
  const handleToggleBookmark = async (job: JobOpportunity) => {
    if (!token) {
      setError("Please log in to bookmark jobs to your personal profile.");
      return;
    }

    setSavingJobId(job.id);
    setFeedbackMsg("");

    try {
      if (isJobSaved(job.id)) {
        const updated = await removeJobBookmark(token, job.id);
        setSavedJobs(updated);
        setFeedbackMsg(`Removed "${job.title}" from saved jobs.`);
      } else {
        const updated = await saveJobBookmark(token, job);
        setSavedJobs(updated);
        setFeedbackMsg(`⭐ Saved "${job.title}" to your bookmarks!`);
      }
      setTimeout(() => setFeedbackMsg(""), 3500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update bookmark");
    } finally {
      setSavingJobId(null);
    }
  };

  // Remove saved job directly from Saved view
  const handleRemoveSavedJob = async (jobId: string, title: string) => {
    if (!token) return;
    try {
      const updated = await removeJobBookmark(token, jobId);
      setSavedJobs(updated);
      setFeedbackMsg(`Removed "${title}" from saved jobs.`);
      setTimeout(() => setFeedbackMsg(""), 3500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove job");
    }
  };

  return (
    <div className="live-jobs-container">
      {/* Header Banner */}
      <div className="live-jobs-header-card">
        <div className="live-jobs-title-block">
          <div className="live-badge-row">
            <span className="live-pulse-dot" />
            <span className="live-badge-text">Real-Time Job Aggregator</span>
            <span className="live-badge-source">Arbeitnow &amp; Remotive APIs</span>
          </div>
          <h2 className="live-jobs-heading">Live Career Opportunities &amp; LinkedIn Feeds</h2>
          <p className="live-jobs-subheading">
            Discover real-time verified job openings with direct application links, 1-click LinkedIn deep searches,
            and automated compatibility scoring against your profile skills.
          </p>
        </div>

        {/* View Toggle Tabs */}
        <div className="jobs-view-tabs">
          <button
            type="button"
            className={`jobs-view-tab ${viewMode === "live" ? "active" : ""}`}
            onClick={() => setViewMode("live")}
          >
            🌐 All Live Openings
            <span className="jobs-count-chip">{jobs.length}</span>
          </button>
          <button
            type="button"
            className={`jobs-view-tab ${viewMode === "saved" ? "active" : ""}`}
            onClick={() => setViewMode("saved")}
          >
            ⭐ Saved Bookmarks
            <span className="jobs-count-chip">{savedJobs.length}</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedbackMsg && <div className="jobs-toast-feedback">{feedbackMsg}</div>}
      {error && <div className="card-error" style={{ marginBottom: "1.25rem" }}>{error}</div>}

      {viewMode === "live" ? (
        <>
          {/* Search & Filter Controls */}
          <div className="jobs-filter-panel">
            <div className="jobs-filter-row">
              <div className="search-field-group">
                <span className="search-field-icon">🔍</span>
                <input
                  type="text"
                  className="search-input-field"
                  placeholder="Search by job title, skill (e.g. React, Node.js, Python), or company..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedRolePill("Custom");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") loadJobs();
                  }}
                />
              </div>

              <div className="search-field-group location-group">
                <span className="search-field-icon">📍</span>
                <input
                  type="text"
                  className="search-input-field"
                  placeholder="Location or Country (e.g. Remote, India, Berlin)..."
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") loadJobs();
                  }}
                />
              </div>

              <label className="remote-toggle-label">
                <input
                  type="checkbox"
                  checked={remoteOnly}
                  onChange={(e) => setRemoteOnly(e.target.checked)}
                />
                <span>Remote Only</span>
              </label>

              <button
                type="button"
                className="btn btn-primary jobs-search-btn"
                onClick={loadJobs}
                disabled={loading}
              >
                {loading ? "Refreshing..." : "Search Jobs"}
              </button>
            </div>

            {/* Quick Filter Pills */}
            <div className="quick-roles-pills">
              <span className="pills-label">Popular Paths:</span>
              {QUICK_SEARCH_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  className={`role-pill-btn ${
                    selectedRolePill === role ? "active" : ""
                  }`}
                  onClick={() => handlePillClick(role)}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Profile Skill Matching Context Banner */}
          <div className="skills-match-status-strip">
            <div className="strip-left">
              <span className="strip-icon">🎯</span>
              <span>
                Matching with your <strong>{candidateSkills.length} saved profile skills</strong>
                {profile?.targetRole ? ` for target role "${profile.targetRole}"` : ""}
              </span>
            </div>
            {candidateSkills.length === 0 && onGoToEdit && (
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={onGoToEdit}
              >
                + Add Skills for Accurate Match %
              </button>
            )}
          </div>

          {/* Job Feed List */}
          {loading ? (
            <div className="jobs-loading-skeleton">
              <div className="spinner" />
              <p>Fetching real-time opportunities and scoring skill compatibility...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="jobs-empty-state">
              <span className="empty-icon">🔎</span>
              <h3>No job postings matched your current search filters</h3>
              <p>Try clearing your location or searching for broader terms like &ldquo;Developer&rdquo; or &ldquo;Engineer&rdquo;.</p>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setSearchQuery("");
                  setLocationQuery("");
                  setRemoteOnly(false);
                  setSelectedRolePill("All Openings");
                }}
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="jobs-grid">
              {jobs.map((job) => {
                const isSaved = isJobSaved(job.id);
                const score = job.matchScore || 70;
                const scoreClass =
                  score >= 75 ? "score-high" : score >= 50 ? "score-med" : "score-low";

                return (
                  <div key={job.id} className="job-card">
                    {/* Top Meta Header */}
                    <div className="job-card-top">
                      <div className="job-company-block">
                        <span className="job-company-name">{job.company}</span>
                        <div className="job-meta-tags">
                          <span className="job-location-tag">
                            {job.isRemote ? "🌐 Remote" : `📍 ${job.location}`}
                          </span>
                          <span className="job-source-tag">{job.source}</span>
                          {job.salary && (
                            <span className="job-salary-tag">💰 {job.salary}</span>
                          )}
                        </div>
                      </div>

                      <div className="job-top-actions">
                        <div className={`job-score-badge ${scoreClass}`}>
                          <span className="score-number">{score}%</span>
                          <span className="score-text">Match</span>
                        </div>

                        <button
                          type="button"
                          className={`bookmark-btn ${isSaved ? "saved" : ""}`}
                          title={isSaved ? "Remove from bookmarks" : "Save this job"}
                          onClick={() => handleToggleBookmark(job)}
                          disabled={savingJobId === job.id}
                        >
                          {isSaved ? "★" : "☆"}
                        </button>
                      </div>
                    </div>

                    {/* Job Title */}
                    <h3 className="job-title-text">{job.title}</h3>

                    {/* Matched vs Missing Skills */}
                    <div className="job-skills-breakdown">
                      {job.matchedSkills && job.matchedSkills.length > 0 && (
                        <div className="skills-group">
                          <span className="skills-group-label matched-label">
                            ✓ Matched:
                          </span>
                          <div className="skill-chips-row">
                            {job.matchedSkills.slice(0, 5).map((skill) => (
                              <span key={skill} className="skill-chip chip-matched">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {job.missingSkills && job.missingSkills.length > 0 && (
                        <div className="skills-group">
                          <span className="skills-group-label missing-label">
                            + To Learn:
                          </span>
                          <div className="skill-chips-row">
                            {job.missingSkills.slice(0, 4).map((skill) => (
                              <span key={skill} className="skill-chip chip-missing">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Snippet */}
                    <p className="job-description-snippet">{job.descriptionSnippet}</p>

                    {/* Action Buttons */}
                    <div className="job-card-actions">
                      <a
                        href={job.applyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-primary apply-now-btn"
                      >
                        🚀 Apply Now
                      </a>

                      <a
                        href={job.linkedinSearchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-secondary linkedin-search-btn"
                        title="Search recruiter posts and connections on LinkedIn"
                      >
                        <span className="linkedin-icon">in</span> LinkedIn Search
                      </a>

                      <button
                        type="button"
                        className="btn btn-sm btn-outline test-ai-btn"
                        title="Evaluate this job posting with Gemini AI skill assessment"
                        onClick={() => onTestWithAi(job)}
                      >
                        ⚡ Test with AI
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Saved Jobs View */
        <div className="saved-jobs-section">
          {savedJobs.length === 0 ? (
            <div className="jobs-empty-state">
              <span className="empty-icon">⭐</span>
              <h3>You have not bookmarked any jobs yet</h3>
              <p>
                Browse the &ldquo;All Live Openings&rdquo; feed and click the star (☆) button on any job card
                to save it to your personal profile.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setViewMode("live")}
              >
                Explore Live Feed
              </button>
            </div>
          ) : (
            <div className="jobs-grid">
              {savedJobs.map((saved) => (
                <div key={saved.id} className="job-card saved-card">
                  <div className="job-card-top">
                    <div className="job-company-block">
                      <span className="job-company-name">{saved.company}</span>
                      <div className="job-meta-tags">
                        <span className="job-location-tag">
                          {saved.isRemote ? "🌐 Remote" : `📍 ${saved.location}`}
                        </span>
                        <span className="job-source-tag">{saved.source}</span>
                        <span className="job-date-tag">
                          Saved: {new Date(saved.savedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="bookmark-btn saved"
                      title="Remove bookmark"
                      onClick={() => handleRemoveSavedJob(saved.id, saved.title)}
                    >
                      ★
                    </button>
                  </div>

                  <h3 className="job-title-text">{saved.title}</h3>

                  {saved.tags && saved.tags.length > 0 && (
                    <div className="skill-chips-row" style={{ marginBottom: "0.75rem" }}>
                      {saved.tags.slice(0, 6).map((t) => (
                        <span key={t} className="skill-chip">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="job-description-snippet">{saved.descriptionSnippet}</p>

                  <div className="job-card-actions">
                    <a
                      href={saved.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-primary apply-now-btn"
                    >
                      🚀 Apply Now
                    </a>

                    <a
                      href={
                        saved.linkedinSearchUrl ||
                        `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(
                          `${saved.title} ${saved.company}`
                        )}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-secondary linkedin-search-btn"
                    >
                      <span className="linkedin-icon">in</span> LinkedIn Search
                    </a>

                    <button
                      type="button"
                      className="btn btn-sm btn-outline test-ai-btn"
                      onClick={() =>
                        onTestWithAi({
                          id: saved.id,
                          title: saved.title,
                          company: saved.company,
                          location: saved.location,
                          isRemote: saved.isRemote,
                          jobType: "Full-time",
                          tags: saved.tags,
                          descriptionSnippet: saved.descriptionSnippet,
                          description: saved.descriptionSnippet,
                          applyUrl: saved.applyUrl,
                          linkedinSearchUrl: saved.linkedinSearchUrl || "",
                          postedAt: saved.savedAt,
                          source: saved.source,
                        })
                      }
                    >
                      ⚡ Test with AI
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

