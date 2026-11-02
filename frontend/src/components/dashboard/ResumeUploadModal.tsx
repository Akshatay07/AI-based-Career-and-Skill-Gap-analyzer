import { useState, useRef } from "react";
import type { ParsedResumeData, UserProfile } from "../../types/profile";
import { parseResumeWithAi } from "../../services/api";

interface ResumeUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  currentProfile: UserProfile | null;
  onApplyResumeData: (data: ParsedResumeData) => void;
}

export default function ResumeUploadModal({
  isOpen,
  onClose,
  token,
  onApplyResumeData,
}: ResumeUploadModalProps) {
  const [activeTab, setActiveTab] = useState<"file" | "text">("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [parsedData, setParsedData] = useState<ParsedResumeData | null>(null);
  const [editableSkills, setEditableSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== "application/pdf" && !file.name.endsWith(".txt") && !file.name.endsWith(".pdf")) {
        setError("Please select a valid PDF (.pdf) or text (.txt) file.");
        return;
      }
      setSelectedFile(file);
      setError("");
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setError("");
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleAnalyze = async () => {
    if (!token) {
      setError("Please log in to use the AI resume parser.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      let payload: { resumeText?: string; pdfBase64?: string; mimeType?: string } = {};

      if (activeTab === "file") {
        if (!selectedFile) {
          setError("Please select or drop a PDF file first.");
          setLoading(false);
          return;
        }

        if (selectedFile.type === "application/pdf" || selectedFile.name.endsWith(".pdf")) {
          const base64 = await readFileAsBase64(selectedFile);
          payload = {
            pdfBase64: base64,
            mimeType: "application/pdf",
          };
        } else {
          // Plain text file
          const text = await readFileAsText(selectedFile);
          payload = { resumeText: text };
        }
      } else {
        if (!resumeText.trim() || resumeText.trim().length < 25) {
          setError("Please paste a meaningful portion of your resume (at least 25 characters).");
          setLoading(false);
          return;
        }
        payload = { resumeText: resumeText.trim() };
      }

      const result = await parseResumeWithAi(token, payload);
      setParsedData(result);
      setEditableSkills(result.extractedSkills || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze resume.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setEditableSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSkillInput.trim();
    if (!trimmed) return;
    if (editableSkills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setNewSkillInput("");
      return;
    }
    setEditableSkills((prev) => [...prev, trimmed]);
    setNewSkillInput("");
  };

  const handleApply = () => {
    if (!parsedData) return;
    const finalData: ParsedResumeData = {
      ...parsedData,
      extractedSkills: editableSkills,
    };
    onApplyResumeData(finalData);
    onClose();
  };

  const handleReset = () => {
    setParsedData(null);
    setEditableSkills([]);
    setSelectedFile(null);
    setResumeText("");
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card resume-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          title="Close modal"
        >
          ✕
        </button>

        <div className="modal-body resume-modal-body">
          {/* Header */}
          <div className="resume-modal-header">
            <div className="resume-header-badge">
              <span className="ai-sparkle-dot"></span>
              <span>Google Gemini Flash AI</span>
            </div>
            <h2 className="resume-modal-title">AI Resume Parser & Skill Extractor</h2>
            <p className="resume-modal-sub">
              Upload your resume or paste its text. Gemini Flash will automatically extract your
              acquired technical skills, education, and suggested role in seconds.
            </p>
          </div>

          {error && (
            <div className="alert alert-error">
              <span>⚠️</span>
              <div>{error}</div>
            </div>
          )}

          {/* Mode Tabs (Only when not viewing extracted results) */}
          {!parsedData && !loading && (
            <div className="resume-tabs-row">
              <button
                type="button"
                className={`resume-tab-btn ${activeTab === "file" ? "active" : ""}`}
                onClick={() => setActiveTab("file")}
              >
                📄 Upload PDF File
              </button>
              <button
                type="button"
                className={`resume-tab-btn ${activeTab === "text" ? "active" : ""}`}
                onClick={() => setActiveTab("text")}
              >
                ✍️ Paste Resume Text
              </button>
            </div>
          )}

          {/* UPLOAD FORM (State 1: Input) */}
          {!parsedData && !loading && (
            <div className="resume-input-container">
              {activeTab === "file" ? (
                <div
                  className="resume-dropzone"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf,.txt,application/pdf,text/plain"
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />

                  {selectedFile ? (
                    <div className="dropzone-file-selected" onClick={(e) => e.stopPropagation()}>
                      <div className="file-icon">📄</div>
                      <div className="file-info">
                        <strong>{selectedFile.name}</strong>
                        <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
                      </div>
                      <button
                        type="button"
                        className="file-remove-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                      >
                        ✕ Remove
                      </button>
                    </div>
                  ) : (
                    <div className="dropzone-empty">
                      <div className="dropzone-icon">☁️</div>
                      <h4 className="dropzone-heading">Click or drag & drop your resume PDF</h4>
                      <p className="dropzone-sub">Supports PDF documents (.pdf) up to 10MB</p>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                      >
                        Browse Files 📂
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="resume-text-input-wrap">
                  <textarea
                    className="form-control resume-textarea"
                    rows={8}
                    placeholder="Paste the text from your resume here (experience, skills, education, projects)..."
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                  />
                  <div className="textarea-footer">
                    <span>{resumeText.length} characters</span>
                    <span>Gemini analyzes markdown, plain text, and bullet points</span>
                  </div>
                </div>
              )}

              <div className="resume-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAnalyze}
                  disabled={activeTab === "file" ? !selectedFile : !resumeText.trim()}
                >
                  ✨ Extract Skills with Gemini Flash
                </button>
              </div>
            </div>
          )}

          {/* LOADING STATE */}
          {loading && (
            <div className="resume-loading-state">
              <div className="ai-pulse-orb"></div>
              <h3 className="resume-loading-title">Extracting Profile with Gemini Flash AI</h3>
              <p className="resume-loading-sub">
                Scanning document structure, normalizing technical skills, and analyzing education...
              </p>
              <div className="resume-loading-steps">
                <span>🔍 Document Scanning</span>
                <span>•</span>
                <span>⚡ Technical Skill Extraction</span>
                <span>•</span>
                <span>🎓 Academic Credentials</span>
              </div>
            </div>
          )}

          {/* RESULTS PREVIEW (State 2: Review and Apply) */}
          {parsedData && !loading && (
            <div className="resume-results-container">
              <div className="results-badge-row">
                <span className="results-success-badge">✓ Extraction Complete</span>
                <span className="results-meta-pill">
                  {editableSkills.length} Technical Skills Found
                </span>
              </div>

              {/* Extracted Profile Highlights */}
              <div className="parsed-highlights-grid">
                {parsedData.name && (
                  <div className="parsed-highlight-item">
                    <span className="highlight-label">Candidate Name</span>
                    <strong className="highlight-val">{parsedData.name}</strong>
                  </div>
                )}

                {parsedData.suggestedTargetRole && (
                  <div className="parsed-highlight-item">
                    <span className="highlight-label">Suggested Career Role</span>
                    <strong className="highlight-val role-val">🎯 {parsedData.suggestedTargetRole}</strong>
                  </div>
                )}

                {parsedData.experienceLevel && (
                  <div className="parsed-highlight-item">
                    <span className="highlight-label">Experience Level</span>
                    <strong className="highlight-val">{parsedData.experienceLevel}</strong>
                  </div>
                )}

                {parsedData.education?.degree && (
                  <div className="parsed-highlight-item">
                    <span className="highlight-label">Education</span>
                    <strong className="highlight-val">
                      🎓 {parsedData.education.degree}
                      {parsedData.education.fieldOfStudy ? ` in ${parsedData.education.fieldOfStudy}` : ""}
                      {parsedData.education.graduationYear ? ` ('${parsedData.education.graduationYear.slice(-2)})` : ""}
                    </strong>
                  </div>
                )}
              </div>

              {/* Summary */}
              {parsedData.summary && (
                <div className="parsed-summary-box">
                  <span className="summary-label">AI Profile Summary:</span>
                  <p className="summary-text">"{parsedData.summary}"</p>
                </div>
              )}

              {/* Interactive Skills Tag Cloud */}
              <div className="parsed-skills-section">
                <div className="skills-section-header">
                  <div>
                    <h4 className="skills-section-title">Extracted Skills Checklist</h4>
                    <p className="skills-section-sub">
                      Review the skills detected by Gemini. Remove any you don't want or add missing ones:
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-clear-all"
                    onClick={() => setEditableSkills([])}
                  >
                    Clear All
                  </button>
                </div>

                <div className="parsed-chips-list">
                  {editableSkills.map((skill) => (
                    <span key={skill} className="parsed-skill-chip">
                      <span>{skill}</span>
                      <button
                        type="button"
                        className="chip-remove-btn"
                        onClick={() => handleRemoveSkill(skill)}
                        title="Remove skill"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                  {editableSkills.length === 0 && (
                    <span className="no-skills-msg">No skills currently selected. Add some below!</span>
                  )}
                </div>

                {/* Quick Add Skill Form */}
                <form className="quick-add-skill-form" onSubmit={handleAddSkill}>
                  <input
                    type="text"
                    className="form-control quick-add-input"
                    placeholder="Add another skill (e.g. AWS, Docker, Next.js)..."
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                  />
                  <button type="submit" className="btn btn-secondary btn-sm">
                    + Add Skill
                  </button>
                </form>
              </div>

              {/* Action Buttons */}
              <div className="resume-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleReset}
                >
                  🔄 Analyze Another Resume
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={handleApply}
                >
                  ✓ Apply Extracted Skills to Profile
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
