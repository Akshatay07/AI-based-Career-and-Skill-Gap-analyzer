import { useState, useEffect } from "react";
import type { UserProfile, CreateProfileInput } from "../../types/profile";
import { saveMyProfile } from "../../services/api";

interface EditProfileViewProps {
  token: string | null;
  initialProfile: UserProfile | null;
  defaultName: string;
  onProfileSaved: (savedProfile: UserProfile) => void;
  onCancel: () => void;
}

const COMMON_ROLES = [
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "Data Scientist",
  "DevOps Engineer",
  "AI/ML Engineer",
];

const SUGGESTED_SKILLS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "Express",
  "MongoDB",
  "Python",
  "SQL",
  "Git",
  "HTML",
  "CSS",
  "Docker",
  "Java",
  "AWS",
];

export default function EditProfileView({
  token,
  initialProfile,
  defaultName,
  onProfileSaved,
  onCancel,
}: EditProfileViewProps) {
  const [targetRole, setTargetRole] = useState(initialProfile?.targetRole || "");
  const [experienceLevel, setExperienceLevel] = useState<CreateProfileInput["experienceLevel"]>(
    initialProfile?.experienceLevel || "Fresher/Student"
  );

  // Education
  const [degree, setDegree] = useState(initialProfile?.education?.degree || "");
  const [fieldOfStudy, setFieldOfStudy] = useState(initialProfile?.education?.fieldOfStudy || "");
  const [institution, setInstitution] = useState(initialProfile?.education?.institution || "");
  const [graduationYear, setGraduationYear] = useState<number | "">(
    initialProfile?.education?.graduationYear || ""
  );

  // Skills
  const [skills, setSkills] = useState<string[]>(initialProfile?.currentSkills || []);
  const [skillInput, setSkillInput] = useState("");

  // Feedback states
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (initialProfile) {
      setTargetRole(initialProfile.targetRole || "");
      setExperienceLevel(initialProfile.experienceLevel || "Fresher/Student");
      setSkills(initialProfile.currentSkills || []);
      setDegree(initialProfile.education?.degree || "");
      setFieldOfStudy(initialProfile.education?.fieldOfStudy || "");
      setInstitution(initialProfile.education?.institution || "");
      setGraduationYear(initialProfile.education?.graduationYear || "");
    }
  }, [initialProfile]);

  const handleAddSkill = (skillToAdd: string) => {
    const trimmed = skillToAdd.trim();
    if (!trimmed) return;
    if (!skills.includes(trimmed)) {
      setSkills((prev) => [...prev, trimmed]);
    }
    setSkillInput("");
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  const handleKeyDownSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSkill(skillInput);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!targetRole.trim()) {
      setErrorMessage("Please select or enter your target career role.");
      return;
    }

    setLoading(true);

    try {
      const payload: Partial<CreateProfileInput> = {
        name: defaultName,
        targetRole: targetRole.trim(),
        currentSkills: skills,
        experienceLevel,
        education: {
          degree: degree.trim(),
          fieldOfStudy: fieldOfStudy.trim(),
          institution: institution.trim(),
          graduationYear: graduationYear === "" ? undefined : Number(graduationYear),
        },
      };

      if (!token) {
        throw new Error("You must be logged in to update your profile");
      }

      const saved = await saveMyProfile(token, payload);
      setSuccessMessage("Changes saved successfully to your MongoDB profile!");
      onProfileSaved(saved);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-profile-container">
      <div className="edit-view-header">
        <div>
          <h2>Profile &amp; Career Settings</h2>
          <p className="edit-view-subtitle">
            Update your career goals, education history, and current skill set
          </p>
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>
          ← Back to Overview
        </button>
      </div>

      {successMessage && (
        <div className="alert alert-success" role="alert">
          <span>✓</span>
          <div>{successMessage}</div>
        </div>
      )}

      {errorMessage && (
        <div className="alert alert-error" role="alert">
          <span>⚠️</span>
          <div>{errorMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="edit-profile-form">
        {/* Section 1: Target Career Goal */}
        <div className="card edit-section-card">
          <div className="section-header-row">
            <span className="section-number">1</span>
            <div>
              <h3>Target Career Direction</h3>
              <p className="section-subtext">The job role you want to assess yourself against</p>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="target-role-input">
              Target Career Role <span className="required">*</span>
            </label>
            <input
              id="target-role-input"
              type="text"
              className="form-control"
              placeholder="e.g. Full Stack Developer, Data Scientist"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              required
            />

            <div className="quick-suggestions">
              <span className="suggestions-label">Suggestions:</span>
              {COMMON_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  className={`suggestion-pill ${targetRole === role ? "active" : ""}`}
                  onClick={() => setTargetRole(role)}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="experience-select">Current Experience Level</label>
            <select
              id="experience-select"
              className="form-control"
              value={experienceLevel}
              onChange={(e) =>
                setExperienceLevel(e.target.value as CreateProfileInput["experienceLevel"])
              }
            >
              <option value="Fresher/Student">Fresher / Student</option>
              <option value="Entry Level">Entry Level (0-2 years)</option>
              <option value="Intermediate">Intermediate (2-5 years)</option>
              <option value="Experienced">Experienced (5+ years)</option>
            </select>
          </div>
        </div>

        {/* Section 2: Skills Arsenal */}
        <div className="card edit-section-card">
          <div className="section-header-row">
            <span className="section-number">2</span>
            <div>
              <h3>My Skills Arsenal</h3>
              <p className="section-subtext">
                Add every technology, tool, and language you are currently confident with
              </p>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="skill-input">
              Add a Skill <span className="helper-text">(Press Enter or click Add)</span>
            </label>
            <div className="skill-input-row">
              <input
                id="skill-input"
                type="text"
                className="form-control"
                placeholder="e.g. React, Python, PostgreSQL, Docker"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleKeyDownSkill}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleAddSkill(skillInput)}
              >
                + Add Skill
              </button>
            </div>

            <div className="quick-suggestions">
              <span className="suggestions-label">Popular Skills:</span>
              {SUGGESTED_SKILLS.map((skill) => {
                const isSelected = skills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    className={`suggestion-pill ${isSelected ? "selected" : ""}`}
                    onClick={() =>
                      isSelected ? handleRemoveSkill(skill) : handleAddSkill(skill)
                    }
                  >
                    {isSelected ? `✓ ${skill}` : `+ ${skill}`}
                  </button>
                );
              })}
            </div>

            <div className="selected-skills-container">
              {skills.length === 0 ? (
                <span className="no-skills-hint">
                  No skills in your profile yet. Add some above to start the gap analysis.
                </span>
              ) : (
                skills.map((skill) => (
                  <span key={skill} className="skill-chip">
                    {skill}
                    <button
                      type="button"
                      className="skill-remove-btn"
                      onClick={() => handleRemoveSkill(skill)}
                      title={`Remove ${skill}`}
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Academic Background */}
        <div className="card edit-section-card">
          <div className="section-header-row">
            <span className="section-number">3</span>
            <div>
              <h3>Education &amp; Background</h3>
              <p className="section-subtext">Optional educational qualifications</p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="degree-input">Degree</label>
              <input
                id="degree-input"
                type="text"
                className="form-control"
                placeholder="e.g. B.Tech / BCA / BS"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="field-input">Field of Study</label>
              <input
                id="field-input"
                type="text"
                className="form-control"
                placeholder="e.g. Computer Science"
                value={fieldOfStudy}
                onChange={(e) => setFieldOfStudy(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="institution-input">Institution / College</label>
              <input
                id="institution-input"
                type="text"
                className="form-control"
                placeholder="e.g. University Name"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="year-input">Graduation Year</label>
              <input
                id="year-input"
                type="number"
                min="1980"
                max="2035"
                className="form-control"
                placeholder="e.g. 2026"
                value={graduationYear}
                onChange={(e) =>
                  setGraduationYear(e.target.value === "" ? "" : Number(e.target.value))
                }
              />
            </div>
          </div>
        </div>

        {/* Sticky Actions Bar */}
        <div className="edit-sticky-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary btn-save-large"
            disabled={loading}
          >
            {loading ? "Saving to MongoDB..." : "Save Profile Changes ✓"}
          </button>
        </div>
      </form>
    </div>
  );
}
