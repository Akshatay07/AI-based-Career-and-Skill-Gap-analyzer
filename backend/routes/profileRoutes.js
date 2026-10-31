import express from "express";
import UserProfile from "../models/UserProfile.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

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

    const profileFields = {
      user: req.user._id,
      name: name?.trim() || req.user.name,
      email: req.user.email,
      targetRole: targetRole?.trim() || "",
      currentSkills: formattedSkills,
      experienceLevel: experienceLevel || "Fresher/Student",
      education: {
        degree: education?.degree?.trim() || "",
        fieldOfStudy: education?.fieldOfStudy?.trim() || "",
        institution: education?.institution?.trim() || "",
        graduationYear:
          education?.graduationYear && !isNaN(Number(education.graduationYear))
            ? Number(education.graduationYear)
            : undefined,
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
    res.status(400).json({
      success: false,
      message: "Failed to save career profile",
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
