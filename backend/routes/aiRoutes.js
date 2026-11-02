import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import UserProfile from "../models/UserProfile.js";
import { parseResume, parseJobDescription } from "../services/geminiService.js";

const router = express.Router();

// Technical aliases and canonical mappings for resilient matching
const ALIAS_MAP = {
  js: "javascript",
  javascript: "javascript",
  ts: "typescript",
  typescript: "typescript",
  py: "python",
  python: "python",
  "node.js": "node.js",
  nodejs: "node.js",
  node: "node.js",
  express: "express.js",
  expressjs: "express.js",
  "express.js": "express.js",
  react: "react",
  reactjs: "react",
  "react.js": "react",
  next: "next.js",
  nextjs: "next.js",
  "next.js": "next.js",
  vue: "vue.js",
  vuejs: "vue.js",
  mongo: "mongodb",
  mongodb: "mongodb",
  postgres: "postgresql",
  postgresql: "postgresql",
  k8s: "kubernetes",
  kubernetes: "kubernetes",
  docker: "docker",
  aws: "aws",
  gcp: "gcp",
  azure: "azure",
  git: "git",
  github: "git",
  linux: "linux",
  ml: "machine learning",
  mlops: "mlops",
  rag: "retrieval-augmented generation",
  llm: "large language models",
  llms: "large language models",
  rest: "rest apis",
  "rest api": "rest apis",
  "rest apis": "rest apis",
  "restful api": "rest apis",
  "restful apis": "rest apis",
  sql: "sql",
  mysql: "mysql",
};

function normalizeSkill(s) {
  return (s || "").trim().toLowerCase();
}

function isAlgorithmicMatch(userSkillRaw, jobSkillRaw) {
  const u = normalizeSkill(userSkillRaw);
  const j = normalizeSkill(jobSkillRaw);
  if (!u || !j) return false;
  if (u === j) return true;
  if (ALIAS_MAP[u] && ALIAS_MAP[j] && ALIAS_MAP[u] === ALIAS_MAP[j]) return true;
  // Substring containment for multi-word or compound skill names (min length 3 to prevent false positives like 'c')
  if (u.length >= 3 && j.length >= 3) {
    if (j.includes(u) || u.includes(j)) return true;
  }
  return false;
}

// @route   POST /api/ai/parse-resume
// @desc    Parse an uploaded PDF or pasted resume text using Gemini Flash AI
// @access  Private
router.post("/parse-resume", protect, async (req, res) => {
  try {
    const { resumeText, pdfBase64, mimeType } = req.body;

    if (!resumeText && !pdfBase64) {
      return res.status(400).json({
        success: false,
        message: "Please provide resume text or upload a PDF file to analyze.",
      });
    }

    const parsedData = await parseResume({
      resumeText,
      pdfBase64,
      mimeType,
    });

    res.status(200).json({
      success: true,
      message: "Resume analyzed successfully with Google Gemini Flash AI!",
      data: parsedData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to parse resume",
      error: error.message,
    });
  }
});

// @route   POST /api/ai/analyze-job
// @desc    Parse an unstructured job posting (e.g. from LinkedIn/Indeed) and calculate skill gaps
// @access  Private
router.post("/analyze-job", protect, async (req, res) => {
  try {
    const { jobText, candidateSkills } = req.body;

    if (!jobText || jobText.trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: "Please provide a complete job description text (minimum 20 characters).",
      });
    }

    // Fetch user profile from DB if candidateSkills are not explicitly provided by client
    const userProfile = await UserProfile.findOne({ user: req.user._id });
    const userSkills =
      Array.isArray(candidateSkills) && candidateSkills.length > 0
        ? candidateSkills
        : userProfile?.currentSkills || [];

    // Extract structured role specifications and perform AI recruiter matching with Gemini Flash
    const roleProfile = await parseJobDescription({
      jobText,
      candidateSkills: userSkills,
    });

    // Combine Gemini's semantic matching with algorithmic alias/synonym normalization
    const geminiMatchedCoreSet = new Set(
      (roleProfile.matchedCore || []).map(normalizeSkill)
    );
    const matchedCore = roleProfile.coreSkills.filter((s) => {
      const normS = normalizeSkill(s);
      if (geminiMatchedCoreSet.has(normS)) return true;
      return userSkills.some((u) => isAlgorithmicMatch(u, s));
    });
    const missingCore = roleProfile.coreSkills.filter(
      (s) => !matchedCore.includes(s)
    );

    // Optional requirements evaluation
    const geminiMatchedOptionalSet = new Set(
      (roleProfile.matchedOptional || []).map(normalizeSkill)
    );
    const matchedOptional = roleProfile.optionalSkills.filter((s) => {
      const normS = normalizeSkill(s);
      if (geminiMatchedOptionalSet.has(normS)) return true;
      return userSkills.some((u) => isAlgorithmicMatch(u, s));
    });
    const missingOptional = roleProfile.optionalSkills.filter(
      (s) => !matchedOptional.includes(s)
    );

    const totalCore = roleProfile.coreSkills.length;
    const totalOptional = roleProfile.optionalSkills.length;

    const coreScore = totalCore > 0 ? (matchedCore.length / totalCore) * 100 : 100;
    const optionalScore =
      totalOptional > 0 ? (matchedOptional.length / totalOptional) * 100 : 100;

    // 75% weight on core competencies, 25% on bonus/competitive skills
    const overallMatch = Math.round(coreScore * 0.75 + optionalScore * 0.25);

    let readinessStatus = "Foundational";
    let statusTone = "warning";
    if (overallMatch >= 80) {
      readinessStatus = "Job Ready";
      statusTone = "success";
    } else if (overallMatch >= 50) {
      readinessStatus = "Intermediate";
      statusTone = "info";
    }

    res.status(200).json({
      success: true,
      message: "Job posting analyzed and skill gap calculated with Gemini Flash AI!",
      data: {
        role: {
          _id: "custom-job-" + Date.now(),
          title: roleProfile.title,
          category: roleProfile.category || "Technology",
          description: roleProfile.description,
          demandLevel: "High",
        },
        scores: {
          overallMatch,
          coreMatch: Math.round(coreScore),
          bonusMatch: Math.round(optionalScore),
          readinessStatus,
          statusTone,
        },
        breakdown: {
          core: {
            total: totalCore,
            matchedCount: matchedCore.length,
            missingCount: missingCore.length,
            matched: matchedCore,
            missing: missingCore,
          },
          optional: {
            total: totalOptional,
            matchedCount: matchedOptional.length,
            missingCount: missingOptional.length,
            matched: matchedOptional,
            missing: missingOptional,
          },
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to analyze job description",
      error: error.message,
    });
  }
});

export default router;
