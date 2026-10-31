import { useState, useEffect } from "react";
import type { UserProfile, CreateProfileInput } from "../types/profile";
import { saveMyProfile } from "../services/api";

interface ProfileFormProps {
  token: string | null;
  initialProfile: UserProfile | null;
  onProfileSaved: (savedProfile: UserProfile) => void;
  defaultName?: string;
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

export default function ProfileForm({
  token,
  initialProfile,
  onProfileSaved,
  defaultName = "",
}: ProfileFormProps) {
  const [targetRole, setTargetRole] = useState(initialProfile?.targetRole || "");
  const [experienceLevel, setExperienceLevel] = useState<CreateProfileInput["experienceLevel"]>(
    initialProfile?.experienceLevel || "Fresher/Student"
  );

  // Education fields
  const [degree, setDegree] = useState(initialProfile?.education?.degree || "");
  const [fieldOfStudy, setFieldOfStudy] = useState(initialProfile?.education?.fieldOfStudy || "");
  const [institution, setInstitution] = useState(initialProfile?.education?.institution || "");
  const [graduationYear, setGraduationYear] = useState<number | "">(
    initialProfile?.education?.graduationYear || ""
  );

  // Skills state
  const [skills, setSkills] = useState<string[]>(initialProfile?.currentSkills || []);
  const [skillInput, setSkillInput] = useState("");

  // Status feedback
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Sync state whenever initialProfile changes
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

      let saved: UserProfile;

      if (token) {
        // Authenticated personal profile update
        saved = await saveMyProfile(token, payload);
      } else {
        // Fallback for non-authenticated testing
        const response = await fetch("http://localhost:5000/api/profiles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            name: defaultName || "Guest User",
            email: "guest@example.com",
          }),
        });
        const resData = await response.json();
        if (!response.ok) throw new Error(resData.message || "Failed to save profile");
        saved = resData.data;
      }

      setSuccessMessage("Your profile and skills have been updated in MongoDB!");
      onProfileSaved(saved);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Error saving profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card form-card">
      <div className="card-header">
        <h2>My Career Profile &amp; Skills</h2>
        <p className="card-subtitle">
          Define your target role, education, and current skill set for your personal skill gap analysis
        </p>
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

      <form onSubmit={handleSubmit} className="profile-form">
        {/* Target Career Role */}
        <div className="form-group">
          <label htmlFor="target-role-input">
            Target Dream Role <span className="required">*</span>
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

        {/* Experience Level */}
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

        {/* Skills Section */}
        <div className="form-group">
          <label htmlFor="skill-input">
            My Current Skills{" "}
            <span className="helper-text">(Type &amp; press Enter or click popular tags)</span>
          </label>
          <div className="skill-input-row">
            <input
              id="skill-input"
              type="text"
              className="form-control"
              placeholder="e.g. React, Node.js, Python, SQL"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleKeyDownSkill}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleAddSkill(skillInput)}
            >
              + Add
            </button>
          </div>

          {/* Quick Skill Suggestions */}
          <div className="quick-suggestions">
            <span className="suggestions-label">Popular:</span>
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

          {/* Selected Skills Chips */}
          <div className="selected-skills-container">
            {skills.length === 0 ? (
              <span className="no-skills-hint">
                No skills added yet. Select or type your skills above.
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

        {/* Education Sub-section */}
        <fieldset className="education-fieldset">
          <legend>Education Details (Optional)</legend>
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
        </fieldset>

        {/* Submit Button */}
        <div className="form-actions">
          <button
            id="save-profile-btn"
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? "Saving to MongoDB..." : "Save & Update Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
