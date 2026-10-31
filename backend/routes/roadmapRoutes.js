import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import Roadmap from "../models/Roadmap.js";
import UserProfile from "../models/UserProfile.js";
import CareerRole from "../models/CareerRole.js";
import { generateCareerRoadmap } from "../services/geminiService.js";

const router = express.Router();

function normalizeSkill(s) {
  return s.trim().toLowerCase();
}

// @route   POST /api/ai/roadmap
// @desc    Generate or regenerate a personalized AI learning roadmap using Google Gemini
// @access  Private
router.post("/", protect, async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ user: req.user._id });

    if (!profile || !profile.targetRole) {
      return res.status(400).json({
        success: false,
        message: "Please configure your target career role in your profile first.",
      });
    }

    // Find benchmark role in database
    const benchmarkRole = await CareerRole.findOne({
      title: { $regex: new RegExp(`^${profile.targetRole.trim()}$`, "i") },
    });

    const userSkillSet = new Set((profile.currentSkills || []).map(normalizeSkill));

    let missingCore = [];
    let missingOptional = [];

    if (benchmarkRole) {
      missingCore = benchmarkRole.coreSkills.filter(
        (s) => !userSkillSet.has(normalizeSkill(s))
      );
      missingOptional = benchmarkRole.optionalSkills.filter(
        (s) => !userSkillSet.has(normalizeSkill(s))
      );
    } else {
      // Fallback if role is custom
      missingCore = ["Industry Best Practices", "Advanced Architecture"];
    }

    // Call Gemini Service
    const aiResult = await generateCareerRoadmap({
      userName: req.user.name,
      targetRole: profile.targetRole,
      experienceLevel: profile.experienceLevel,
      education: profile.education,
      currentSkills: profile.currentSkills,
      missingCoreSkills: missingCore,
      missingOptionalSkills: missingOptional,
    });

    // Save or update roadmap in MongoDB
    const roadmapData = {
      user: req.user._id,
      targetRole: profile.targetRole,
      experienceLevel: profile.experienceLevel,
      missingSkills: [...missingCore, ...missingOptional],
      overview: aiResult.overview,
      timelinePhases: aiResult.timelinePhases.map((phase) => ({
        ...phase,
        actionItems: phase.actionItems.map((item) => ({
          task: item.task,
          isCompleted: false,
        })),
      })),
      recommendedProjects: aiResult.recommendedProjects,
      interviewFocusAreas: aiResult.interviewFocusAreas,
    };

    const savedRoadmap = await Roadmap.findOneAndUpdate(
      { user: req.user._id },
      { $set: roadmapData },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "AI Roadmap generated successfully using Google Gemini!",
      data: savedRoadmap,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to generate AI roadmap",
      error: error.message,
    });
  }
});

// @route   GET /api/ai/roadmap
// @desc    Get the current saved AI roadmap for the logged in user
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    const roadmap = await Roadmap.findOne({ user: req.user._id });
    res.status(200).json({
      success: true,
      data: roadmap || null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch AI roadmap",
      error: error.message,
    });
  }
});

// @route   PATCH /api/ai/roadmap/task
// @desc    Toggle action item completion status in the roadmap
// @access  Private
router.patch("/task", protect, async (req, res) => {
  try {
    const { phaseNumber, taskIndex, isCompleted } = req.body;

    const roadmap = await Roadmap.findOne({ user: req.user._id });
    if (!roadmap) {
      return res.status(404).json({
        success: false,
        message: "No roadmap found to update",
      });
    }

    const phase = roadmap.timelinePhases.find((p) => p.phaseNumber === phaseNumber);
    if (!phase || !phase.actionItems[taskIndex]) {
      return res.status(400).json({
        success: false,
        message: "Specified phase or task was not found",
      });
    }

    phase.actionItems[taskIndex].isCompleted = Boolean(isCompleted);
    await roadmap.save();

    res.status(200).json({
      success: true,
      message: "Task status updated in MongoDB",
      data: roadmap,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update task",
      error: error.message,
    });
  }
});

export default router;

