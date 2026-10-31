import { GoogleGenAI } from "@google/genai";

// Initialize Gemini Client
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in backend/.env");
  }
  return new GoogleGenAI({ apiKey });
}

// Timeout helper to ensure API calls never hang indefinitely
function timeoutPromise(ms, message = "Operation timed out") {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
}

export async function generateCareerRoadmap({
  userName,
  targetRole,
  experienceLevel,
  education,
  currentSkills,
  missingCoreSkills,
  missingOptionalSkills,
}) {
  const allMissing = [...missingCoreSkills, ...missingOptionalSkills];
  const currentSkillsString = currentSkills.length > 0 ? currentSkills.join(", ") : "Foundational programming basics";

  const prompt = `You are a Senior Technical Career Architect.
Create a concise, high-impact learning roadmap for a candidate aiming to become a "${targetRole}".

Candidate Profile:
- Candidate: ${userName || "Candidate"} (${experienceLevel || "Fresher/Student"})
- Current Acquired Skills: ${currentSkillsString}
- Critical Missing Gaps: ${missingCoreSkills.join(", ") || "Foundational concepts"}
- Optional/Bonus Gaps: ${missingOptionalSkills.join(", ") || "None"}

Generate ONLY a JSON object adhering strictly to this schema:
{
  "overview": "Concise 2-3 sentence career transition summary and readiness assessment",
  "timelinePhases": [
    {
      "phaseNumber": 1,
      "title": "Phase title",
      "duration": "e.g. Weeks 1 - 2",
      "focusSkills": ["Skill 1", "Skill 2"],
      "actionItems": [
        { "task": "Concise, actionable task description" },
        { "task": "Concise, actionable task description" }
      ],
      "resources": [
        { "title": "Resource Name", "type": "Documentation | Video Course | Tutorial", "urlOrPlatform": "Platform name" }
      ]
    }
  ],
  "recommendedProjects": [
    {
      "title": "Project Name",
      "difficulty": "Beginner | Intermediate | Advanced",
      "description": "Concise 1-2 sentence project overview",
      "demonstratesSkills": ["Skill 1", "Skill 2"],
      "architectureHighlights": ["Highlight 1", "Highlight 2"]
    }
  ],
  "interviewFocusAreas": ["Topic 1", "Topic 2", "Topic 3"]
}

Guidelines:
- Return exactly 3 chronological phases.
- Return 2 to 3 action items per phase.
- Return 1 to 2 curated free learning resources per phase.
- Return exactly 2 resume-worthy capstone projects.
- Return exactly 3 technical interview focus topics.
- Keep output concise, professional, and directly tailored to the missing skills.`;

  // Candidate models in speed / capability priority order
  const models = ["gemini-3.1-flash-lite", "gemini-3.5-flash-lite"];

  for (const model of models) {
    try {
      const ai = getGeminiClient();

      // Enforce an 8.5-second timeout per model attempt to keep UX snappy
      const apiCall = ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          maxOutputTokens: 1500,
          temperature: 0.2,
        },
      });

      const response = await Promise.race([
        apiCall,
        timeoutPromise(8500, `Gemini model ${model} timed out after 8.5s`),
      ]);

      if (response && response.text) {
        const parsedData = JSON.parse(response.text);
        if (parsedData && parsedData.timelinePhases && parsedData.timelinePhases.length > 0) {
          console.log(`[Gemini] Generated personalized roadmap using ${model} successfully.`);
          return parsedData;
        }
      }
    } catch (modelError) {
      console.warn(`[Gemini] ${model} attempt failed: ${modelError.message}. Trying next fallback...`);
    }
  }

  // If both models fail or timeout, seamlessly return the intelligent localized fallback
  console.info("[Gemini] Engaging resilient career fallback roadmap generator.");
  return generateFallbackRoadmap({
    targetRole,
    experienceLevel,
    missingCoreSkills,
    missingOptionalSkills,
  });
}

// Resilient fallback generator to ensure demos and offline viva reviews never fail
function generateFallbackRoadmap({
  targetRole,
  experienceLevel,
  missingCoreSkills,
  missingOptionalSkills,
}) {
  const coreGaps = missingCoreSkills.length > 0 ? missingCoreSkills : ["System Architecture", "Performance Tuning"];
  const bonusGaps = missingOptionalSkills.length > 0 ? missingOptionalSkills : ["CI/CD Pipelines", "Docker"];

  return {
    overview: `Your customized pathway to transition into a ${targetRole} role as a ${experienceLevel}. By mastering ${coreGaps.join(
      ", "
    )}, you will bridge your most critical gaps and qualify for entry and junior technical interviews.`,
    timelinePhases: [
      {
        phaseNumber: 1,
        title: "Mastering Core Technical Gaps",
        duration: "Weeks 1 - 2",
        focusSkills: coreGaps.slice(0, 3),
        actionItems: coreGaps.slice(0, 3).map((skill) => ({
          task: `Deep-dive into ${skill} fundamentals, practical exercises, and syntax patterns.`,
        })),
        resources: [
          {
            title: "Official Documentation & API References",
            type: "Documentation",
            urlOrPlatform: "Official Docs & Developer Portals",
          },
          {
            title: "FreeCodeCamp / YouTube Full Course Walkthrough",
            type: "Video Course",
            urlOrPlatform: "freeCodeCamp.org / YouTube",
          },
        ],
      },
      {
        phaseNumber: 2,
        title: "Integration & Production Standards",
        duration: "Weeks 3 - 4",
        focusSkills: [...coreGaps.slice(3), ...bonusGaps.slice(0, 2)],
        actionItems: [
          {
            task: "Implement robust data validation, error handling middleware, and testing suites.",
          },
          {
            task: "Integrate containerization with Docker and setup modular code architecture.",
          },
        ],
        resources: [
          {
            title: "Roadmap.sh Developer Guides",
            type: "Tutorial",
            urlOrPlatform: "roadmap.sh",
          },
          {
            title: "Docker & Container Architecture Essentials",
            type: "Documentation",
            urlOrPlatform: "docs.docker.com",
          },
        ],
      },
      {
        phaseNumber: 3,
        title: "Capstone Portfolio & Interview Readiness",
        duration: "Weeks 5 - 6",
        focusSkills: ["System Design", "Portfolio Deployment", ...bonusGaps],
        actionItems: [
          {
            task: "Build and deploy a full-featured capstone project demonstrating all missing competencies.",
          },
          {
            task: "Write comprehensive README with architecture diagrams and live demo links.",
          },
        ],
        resources: [
          {
            title: "System Design Primer by Donne Martin",
            type: "Tutorial",
            urlOrPlatform: "GitHub / System Design Primer",
          },
        ],
      },
    ],
    recommendedProjects: [
      {
        title: `${targetRole} Capstone Platform`,
        difficulty: "Intermediate",
        description: `An end-to-end production-grade application engineered to prove hands-on mastery of ${coreGaps.join(
          ", "
        )}.`,
        demonstratesSkills: coreGaps,
        architectureHighlights: [
          "RESTful / GraphQL API with secure authentication",
          "Normalized database schema with indexing and relationships",
          "Automated CI/CD deployment on cloud infrastructure",
        ],
      },
    ],
    interviewFocusAreas: [
      `Core conceptual differences and best practices in ${coreGaps[0] || "Architecture"}`,
      "Database schema design, indexing, and query optimization",
      "State management, asynchronous event loops, and error boundaries",
      "Real-world trade-offs between monolithic and microservice approaches",
    ],
  };
}

