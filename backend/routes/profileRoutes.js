import express from "express";
import UserProfile from "../models/UserProfile.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Normalize experience level to match UserProfile schema enum
function normalizeExperienceLevel(level) {
  if (!level) return "Fresher/Student";
  const l = String(level).trim().toLowerCase();
  if (l.includes("student") || l.includes("fresh") || l.includes("intern")) {
    return "Fresher/Student";
  }
  if (l.includes("entry") || l.includes("junior") || l.includes("0-2") || l.includes("associate")) {
    return "Entry Level";
  }
  if (l.includes("inter") || l.includes("mid") || l.includes("2-5")) {
    return "Intermediate";
  }
  if (l.includes("exp") || l.includes("senior") || l.includes("lead") || l.includes("5+")) {
    return "Experienced";
  }
  return "Fresher/Student";
}

// Helper to format skills from array or comma-separated string
function parseSkills(currentSkills) {
  if (Array.isArray(currentSkills)) {
    return currentSkills.map((s) => s.trim()).filter(Boolean);
  }
  if (typeof currentSkills === "string") {
    return currentSkills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

// @route   GET /api/profiles/me
// @desc    Get the personal profile of the currently logged-in user
// @access  Private
router.get("/me", protect, async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ user: req.user._id });

    if (!profile) {
      return res.status(200).json({
        success: true,
        message: "No profile created yet for this account",
        data: null,
      });
    }

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user profile",
      error: error.message,
    });
  }
});

// @route   POST /api/profiles/me
// @desc    Create or update personal profile of the currently logged-in user
// @access  Private
router.post("/me", protect, async (req, res) => {
  try {
    const { targetRole, currentSkills, experienceLevel, education, name } = req.body;

    const formattedSkills = parseSkills(currentSkills);

    let cleanGradYear = undefined;
    if (
      education?.graduationYear !== undefined &&
      education?.graduationYear !== null &&
      String(education.graduationYear).trim() !== ""
    ) {
      const parsedYear = Number(education.graduationYear);
      if (!isNaN(parsedYear) && parsedYear > 1900 && parsedYear < 2100) {
        cleanGradYear = parsedYear;
      }
    }

    const profileFields = {
      user: req.user._id,
      name: name?.trim() || req.user.name,
      email: req.user.email,
      targetRole: targetRole?.trim() || "Full Stack Developer",
      currentSkills: formattedSkills,
      experienceLevel: normalizeExperienceLevel(experienceLevel),
      education: {
        degree: education?.degree?.trim() || "",
        fieldOfStudy: education?.fieldOfStudy?.trim() || "",
        institution: education?.institution?.trim() || "",
        graduationYear: cleanGradYear,
      },
    };

    // Upsert: update existing profile if it exists, otherwise create a new one
    const profile = await UserProfile.findOneAndUpdate(
      { user: req.user._id },
      { $set: profileFields },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Career profile updated successfully!",
      data: profile,
    });
  } catch (error) {
    console.error("[Profile Update Error]:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to save career profile",
      error: error.message,
    });
  }
});

// @route   POST /api/profiles (Legacy fallback without auth)
// @desc    Create a new user profile
router.post("/", async (req, res) => {
  try {
    const { name, email, targetRole, currentSkills, experienceLevel, education } = req.body;
    const formattedSkills = parseSkills(currentSkills);

    const newProfile = new UserProfile({
      name,
      email,
      targetRole,
      currentSkills: formattedSkills,
      experienceLevel,
      education,
    });

    const savedProfile = await newProfile.save();

    res.status(201).json({
      success: true,
      message: "User profile created successfully!",
      data: savedProfile,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to create user profile",
      error: error.message,
    });
  }
});

// @route   GET /api/profiles
// @desc    Get all user profiles
router.get("/", async (req, res) => {
  try {
    const profiles = await UserProfile.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: profiles.length,
      data: profiles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user profiles",
      error: error.message,
    });
  }
});

// @route   GET /api/profiles/:id
// @desc    Get a single user profile by ID
router.get("/:id", async (req, res) => {
  try {
    const profile = await UserProfile.findById(req.params.id);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user profile",
      error: error.message,
    });
  }
});

export default router;
