import { useState, useEffect } from "react";
import type { Roadmap } from "../../types/roadmap";
import type { UserProfile } from "../../types/profile";
import { generateAiRoadmap, toggleRoadmapTask } from "../../services/api";

interface AiRoadmapTabProps {
  token: string | null;
  profile: UserProfile | null;
  roadmap: Roadmap | null;
  onRoadmapUpdated: (updated: Roadmap) => void;
  onGoToEdit: () => void;
}

const GENERATION_STAGES = [
  {
    title: "Auditing Skill Gaps",
    desc: "Comparing your current profile against role requirements...",
    icon: "🔍",
  },
  {
    title: "Structuring Milestone Timeline",
    desc: "Sequencing core technical phases and curated tutorials...",
    icon: "⏱️",
  },
  {
    title: "Synthesizing Portfolio Projects",
    desc: "Designing resume-worthy capstones and interview focus topics...",
    icon: "🚀",
  },
  {
    title: "Finalizing Roadmap",
    desc: "Formatting learning checklist and action tasks...",
    icon: "✨",
  },
];

export default function AiRoadmapTab({
  token,
  profile,
  roadmap,
  onRoadmapUpdated,
  onGoToEdit,
}: AiRoadmapTabProps) {
  const [generating, setGenerating] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Manage timer and stages during AI roadmap generation
  useEffect(() => {
    let timer: number | undefined;
    if (generating) {
      setSecondsElapsed(0);
      setCurrentStageIndex(0);

      timer = window.setInterval(() => {
        setSecondsElapsed((prev) => {
          const next = prev + 1;
          if (next >= 6) {
            setCurrentStageIndex(3);
          } else if (next >= 4) {
            setCurrentStageIndex(2);
          } else if (next >= 2) {
            setCurrentStageIndex(1);
          }
          return next;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [generating]);

  const handleGenerate = async () => {
    if (!token) return;
    setGenerating(true);
    setErrorMessage("");

    try {
      const newRoadmap = await generateAiRoadmap(token);
      onRoadmapUpdated(newRoadmap);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to generate AI roadmap");
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleTask = async (
    phaseNumber: number,
    taskIndex: number,
    currentStatus: boolean
  ) => {
    if (!token) return;
    const taskKey = `${phaseNumber}-${taskIndex}`;
    setUpdatingTaskId(taskKey);

    try {
      const updated = await toggleRoadmapTask(token, phaseNumber, taskIndex, !currentStatus);
      onRoadmapUpdated(updated);
    } catch (err) {
      console.error("Failed to toggle task:", err);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  if (!profile || !profile.targetRole) {
    return (
      <div className="card empty-roadmap-card">
        <div className="empty-roadmap-icon">🤖</div>
        <h2>Configure Profile to Generate Roadmap</h2>
        <p>
          Select your target career role and current skills in your profile before generating your AI
          study roadmap.
        </p>
        <button type="button" className="btn btn-primary" onClick={onGoToEdit}>
          Set Up Profile ✏️
        </button>
      </div>
    );
  }

  // Calculate task completion progress
  let totalTasks = 0;
  let completedTasks = 0;

  if (roadmap && roadmap.timelinePhases) {
    roadmap.timelinePhases.forEach((p) => {
      p.actionItems.forEach((t) => {
        totalTasks += 1;
        if (t.isCompleted) completedTasks += 1;
      });
    });
  }

  const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="ai-roadmap-tab-container">
      {/* Top Banner */}
      <div className="card roadmap-banner-card">
        <div className="roadmap-banner-left">
          <div className="ai-model-tag">
            <span className="ai-sparkle-dot"></span>
            <span>Powered by Google Gemini Flash AI</span>
          </div>

          <h2 className="roadmap-title">
            Personalized Learning Roadmap: {profile.targetRole}
          </h2>

          <p className="roadmap-sub">
            AI-architected study timeline, portfolio capstone projects, and interview preparation
            crafted specifically for your experience level ({profile.experienceLevel}).
          </p>
        </div>

        <div className="roadmap-banner-actions">
          <button
            type="button"
            className="btn btn-primary btn-regenerate"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? (
              <>
                <span className="spinner-inline"></span>
                <span>Gemini is Architecting... ({secondsElapsed}s)</span>
              </>
            ) : roadmap ? (
              "🔄 Regenerate with AI"
            ) : (
              "✨ Generate AI Roadmap"
            )}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="alert alert-error">
          <span>⚠️</span>
          <div>{errorMessage}</div>
        </div>
      )}

      {/* If No Roadmap Generated Yet */}
      {!roadmap && !generating && (
        <div className="card empty-roadmap-card">
          <div className="ai-ready-illustration">✨</div>
          <h3>Ready to Bridge Your Skill Gaps with Gemini AI</h3>
          <p className="empty-sub">
            Click <strong>"Generate AI Roadmap"</strong> above. Google Gemini Flash AI will inspect your{" "}
            <strong>{profile.currentSkills.length} current skills</strong> and build a step-by-step
            learning schedule to master the missing requirements for <strong>{profile.targetRole}</strong>.
          </p>
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={handleGenerate}
          >
            🚀 Generate My Career Roadmap Now
          </button>
        </div>
      )}

      {/* Generating Stepped Loading State */}
      {generating && (
        <div className="card ai-generating-card">
          <div className="ai-pulse-orb"></div>
          <h3 className="ai-generating-title">Consulting Google Gemini Flash AI</h3>
          <p className="ai-generating-sub">
            Architecting your personalized curriculum in real-time (~3-5s response)
          </p>

          {/* Stepped progress indicators */}
          <div className="generation-steps-grid">
            {GENERATION_STAGES.map((stage, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;

              return (
                <div
                  key={stage.title}
                  className={`generation-step-item ${isPast ? "step-past" : ""} ${isCurrent ? "step-active" : ""}`}
                >
                  <div className="step-item-header">
                    <span className="step-icon">{stage.icon}</span>
                    <span className="step-item-title">{stage.title}</span>
                    {isPast && <span className="step-badge-done">✓</span>}
                    {isCurrent && <span className="step-badge-running">Processing...</span>}
                  </div>
                  <p className="step-item-desc">{stage.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="generation-timer-pill">
            <span>⏱️ Elapsed: {secondsElapsed}s</span>
            <span className="timer-separator">•</span>
            <span>Ultra-fast Flash inference</span>
          </div>
        </div>
      )}

      {/* Active Roadmap View */}
      {roadmap && !generating && (
        <div className="roadmap-content-layout">
          {/* Executive Overview & Overall Progress Card */}
          <div className="card executive-summary-card">
            <div className="summary-header-row">
              <span className="card-kicker">AI Executive Career Assessment</span>
              <span className="assessment-badge">Gemini Verified</span>
            </div>

            <p className="ai-overview-text">"{roadmap.overview}"</p>

            {/* Checklist Progress Bar */}
            <div className="roadmap-progress-section">
              <div className="progress-info-row">
                <span className="progress-title">Roadmap Action Items Completed</span>
                <span className="progress-val">
                  <strong>{completedTasks}</strong> of <strong>{totalTasks}</strong> tasks ({completionPercent}%)
                </span>
              </div>
              <div className="progress-track progress-track-lg">
                <div
                  className="progress-fill core-fill"
                  style={{ width: `${completionPercent}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Timeline Phases */}
          <div className="phases-container">
            <div className="section-title-wrap">
              <span className="card-kicker">Structured Milestones</span>
              <h3 className="section-title">Chronological Learning Phases</h3>
            </div>

            <div className="phases-list">
              {roadmap.timelinePhases.map((phase) => {
                const phaseCompleted = phase.actionItems.every((item) => item.isCompleted);

                return (
                  <div
                    key={phase.phaseNumber}
                    className={`card phase-card ${phaseCompleted ? "phase-all-done" : ""}`}
                  >
                    <div className="phase-header">
                      <div className="phase-title-left">
                        <span className="phase-number-badge">Phase {phase.phaseNumber}</span>
                        <div>
                          <h4 className="phase-heading">{phase.title}</h4>
                          <span className="phase-duration-text">⏳ {phase.duration}</span>
                        </div>
                      </div>

                      {/* Focus Skills */}
                      <div className="phase-focus-skills">
                        {phase.focusSkills.map((skill) => (
                          <span key={skill} className="focus-skill-tag">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action Items Checklist */}
                    <div className="action-items-section">
                      <span className="subsection-kicker">Concrete Action Tasks:</span>
                      <div className="action-items-list">
                        {phase.actionItems.map((item, idx) => {
                          const taskKey = `${phase.phaseNumber}-${idx}`;
                          const isUpdating = updatingTaskId === taskKey;

                          return (
                            <label
                              key={idx}
                              className={`action-item-row ${item.isCompleted ? "task-completed" : ""}`}
                            >
                              <input
                                type="checkbox"
                                className="action-checkbox"
                                checked={item.isCompleted}
                                disabled={isUpdating}
                                onChange={() =>
                                  handleToggleTask(phase.phaseNumber, idx, item.isCompleted)
                                }
                              />
                              <span className="task-text">{item.task}</span>
                              {item.isCompleted && <span className="task-done-badge">Done ✓</span>}
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Curated Resources */}
                    {phase.resources && phase.resources.length > 0 && (
                      <div className="phase-resources-section">
                        <span className="subsection-kicker">Recommended Learning Material:</span>
                        <div className="resources-grid">
                          {phase.resources.map((res, rIdx) => (
                            <div key={rIdx} className="resource-item-box">
                              <span className="resource-type-tag">{res.type}</span>
                              <strong className="resource-name">{res.title}</strong>
                              <span className="resource-platform">{res.urlOrPlatform}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommended Capstone Projects */}
          {roadmap.recommendedProjects && roadmap.recommendedProjects.length > 0 && (
            <div className="projects-container">
              <div className="section-title-wrap">
                <span className="card-kicker">Portfolio Acceleration</span>
                <h3 className="section-title">Resume-Worthy Capstone Projects</h3>
              </div>

              <div className="projects-grid">
                {roadmap.recommendedProjects.map((project, pIdx) => (
                  <div key={pIdx} className="card project-card">
                    <div className="project-header">
                      <span className={`difficulty-badge diff-${project.difficulty.toLowerCase()}`}>
                        {project.difficulty}
                      </span>
                      <h4 className="project-title">{project.title}</h4>
                    </div>

                    <p className="project-desc">{project.description}</p>

                    <div className="project-skills-row">
                      <span className="project-skills-label">Demonstrates:</span>
                      <div className="project-skills-chips">
                        {project.demonstratesSkills.map((skill) => (
                          <span key={skill} className="skill-chip acquired-skill">
                            ✓ {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {project.architectureHighlights && project.architectureHighlights.length > 0 && (
                      <div className="project-arch-section">
                        <span className="project-skills-label">Key Architecture Features:</span>
                        <ul className="arch-bullets">
                          {project.architectureHighlights.map((arch, aIdx) => (
                            <li key={aIdx}>{arch}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interview Focus Areas */}
          {roadmap.interviewFocusAreas && roadmap.interviewFocusAreas.length > 0 && (
            <div className="card interview-focus-card">
              <div className="interview-header-row">
                <span className="interview-icon">💼</span>
                <div>
                  <span className="card-kicker">Career Advisory</span>
                  <h3 className="interview-title">Technical Interview Focus Areas</h3>
                  <p className="interview-sub">
                    Key concepts and discussion points hiring managers will test for this role:
                  </p>
                </div>
              </div>

              <div className="interview-bullets-grid">
                {roadmap.interviewFocusAreas.map((point, iIdx) => (
                  <div key={iIdx} className="interview-bullet-item">
                    <span className="bullet-number">{iIdx + 1}</span>
                    <span className="bullet-text">{point}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

