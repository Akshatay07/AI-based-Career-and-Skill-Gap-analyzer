import express from "express";
import CareerRole from "../models/CareerRole.js";

const router = express.Router();

// Helper to normalize skills for case-insensitive and whitespace-safe matching
function normalizeSkill(skill) {
  return skill.trim().toLowerCase();
}

// @route   GET /api/roles
// @desc    Get all career benchmark roles
// @access  Public
router.get("/", async (req, res) => {
  try {
    const roles = await CareerRole.find().sort({ category: 1, title: 1 });
    res.status(200).json({
      success: true,
      count: roles.length,
      data: roles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch career roles",
      error: error.message,
    });
  }
});

// @route   GET /api/roles/:id
// @desc    Get single career role by ID
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const role = await CareerRole.findById(req.params.id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Career role not found",
      });
    }

    res.status(200).json({
      success: true,
      data: role,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch career role",
      error: error.message,
    });
  }
});

// @route   POST /api/roles/analyze
// @desc    Perform comprehensive skill gap analysis against a benchmark role
// @access  Public
router.post("/analyze", async (req, res) => {
  try {
    const { roleTitle, roleId, currentSkills = [] } = req.body;

    let role = null;

    if (roleId) {
      role = await CareerRole.findById(roleId);
    } else if (roleTitle) {
      // Find case-insensitively
      role = await CareerRole.findOne({
        title: { $regex: new RegExp(`^${roleTitle.trim()}$`, "i") },
      });
    }

    if (!role) {
      return res.status(404).json({
        success: false,
        message: `No benchmark role found matching "${roleTitle || roleId}"`,
      });
    }

    // Set of normalized user skills
    const userSkillSet = new Set(
      (Array.isArray(currentSkills) ? currentSkills : [])
        .map(normalizeSkill)
        .filter(Boolean)
    );

    // Core skills comparison
    const matchedCore = role.coreSkills.filter((s) =>
      userSkillSet.has(normalizeSkill(s))
    );
    const missingCore = role.coreSkills.filter(
      (s) => !userSkillSet.has(normalizeSkill(s))
    );

    // Optional skills comparison
    const matchedOptional = role.optionalSkills.filter((s) =>
      userSkillSet.has(normalizeSkill(s))
    );
    const missingOptional = role.optionalSkills.filter(
      (s) => !userSkillSet.has(normalizeSkill(s))
    );

    // Calculations
    const coreCount = role.coreSkills.length;
    const optionalCount = role.optionalSkills.length;

    const coreScore = coreCount > 0 ? (matchedCore.length / coreCount) * 100 : 0;
    const optionalScore = optionalCount > 0 ? (matchedOptional.length / optionalCount) * 100 : 0;

    // Weighted match: 75% core requirements + 25% bonus competencies
    const overallScore = Math.round(coreScore * 0.75 + optionalScore * 0.25);

    // Determine status label
    let readinessStatus = "Foundational";
    let statusTone = "warning";
    if (overallScore >= 80) {
      readinessStatus = "Job Ready";
      statusTone = "success";
    } else if (overallScore >= 50) {
      readinessStatus = "Intermediate";
      statusTone = "info";
    }

    res.status(200).json({
      success: true,
      data: {
        role: {
          _id: role._id,
          title: role.title,
          category: role.category,
          description: role.description,
          demandLevel: role.demandLevel,
        },
        scores: {
          overallMatch: overallScore,
          coreMatch: Math.round(coreScore),
          bonusMatch: Math.round(optionalScore),
          readinessStatus,
          statusTone,
        },
        breakdown: {
          core: {
            total: coreCount,
            matchedCount: matchedCore.length,
            missingCount: missingCore.length,
            matched: matchedCore,
            missing: missingCore,
          },
          optional: {
            total: optionalCount,
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
      message: "Failed to perform skill gap analysis",
      error: error.message,
    });
  }
});

export default router;

