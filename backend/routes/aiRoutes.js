import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import UserProfile from "../models/UserProfile.js";
import { parseResume, parseJobDescription } from "../services/geminiService.js";

const router = express.Router();

function normalizeSkill(s) {
  return s.trim().toLowerCase();
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
    const { jobText } = req.body;

    if (!jobText || jobText.trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: "Please provide a complete job description text (minimum 20 characters).",
      });
    }

    // Extract structured role specifications from raw job text using Gemini Flash AI
    const roleProfile = await parseJobDescription({ jobText });

    // Fetch user profile to compare skills
    const userProfile = await UserProfile.findOne({ user: req.user._id });
    const userSkills = userProfile?.currentSkills || [];
    const userSkillSet = new Set(userSkills.map(normalizeSkill));

    // Core requirements evaluation
    const matchedCore = roleProfile.coreSkills.filter((s) =>
      userSkillSet.has(normalizeSkill(s))
    );
    const missingCore = roleProfile.coreSkills.filter(
      (s) => !userSkillSet.has(normalizeSkill(s))
    );

    // Optional requirements evaluation
    const matchedOptional = roleProfile.optionalSkills.filter((s) =>
      userSkillSet.has(normalizeSkill(s))
    );
    const missingOptional = roleProfile.optionalSkills.filter(
      (s) => !userSkillSet.has(normalizeSkill(s))
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
