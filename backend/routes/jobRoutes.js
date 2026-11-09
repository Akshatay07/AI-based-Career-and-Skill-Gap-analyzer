import express from "express";
import jwt from "jsonwebtoken";
import UserProfile from "../models/UserProfile.js";
import { protect } from "../middleware/authMiddleware.js";
import { getJobs } from "../services/jobService.js";

const router = express.Router();

/**
 * @route   GET /api/jobs
 * @desc    Fetch live job listings with optional filtering and candidate skill match scoring
 * @access  Public (Enhanced with UserProfile skills when authenticated)
 */
router.get("/", async (req, res) => {
  try {
    const { query, location, remoteOnly, skills } = req.query;

    let candidateSkills = [];

    if (skills) {
      candidateSkills = String(skills)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      try {
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const profile = await UserProfile.findOne({ user: decoded.id });
        if (profile && Array.isArray(profile.currentSkills)) {
          candidateSkills = profile.currentSkills;
        }
      } catch (err) {
        // Silently continue for unauthenticated or expired tokens on public listing
      }
    }

    const isRemote = remoteOnly === "true" || remoteOnly === true;

    const jobs = await getJobs({
      query: query || "",
      location: location || "",
      remoteOnly: isRemote,
      userSkills: candidateSkills,
    });

    return res.status(200).json({
      success: true,
      count: jobs.length,
      candidateSkillsUsed: candidateSkills,
      jobs,
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch live job opportunities",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/jobs/saved
 * @desc    Get user's saved/bookmarked jobs
 * @access  Private
 */
router.get("/saved", protect, async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ user: req.user._id });

    if (!profile) {
      return res.status(200).json({
        success: true,
        count: 0,
        savedJobs: [],
      });
    }

    return res.status(200).json({
      success: true,
      count: (profile.savedJobs || []).length,
      savedJobs: profile.savedJobs || [],
    });
  } catch (error) {
    console.error("Error fetching saved jobs:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch saved jobs",
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/jobs/save
 * @desc    Bookmark/save a job posting to user profile
 * @access  Private
 */
router.post("/save", protect, async (req, res) => {
  try {
    const { job } = req.body;

    if (!job || !job.id || !job.title || !job.company || !job.applyUrl) {
      return res.status(400).json({
        success: false,
        message: "Job details (id, title, company, applyUrl) are required to save bookmark",
      });
    }

    let profile = await UserProfile.findOne({ user: req.user._id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found. Please create a profile first.",
      });
    }

    if (!profile.savedJobs) {
      profile.savedJobs = [];
    }

    // Check if already saved
    const alreadySaved = profile.savedJobs.some((item) => item.id === job.id);
    if (alreadySaved) {
      return res.status(200).json({
        success: true,
        message: "Job is already in your saved bookmarks",
        savedJobs: profile.savedJobs,
      });
    }

    const newBookmark = {
      id: String(job.id),
      title: job.title,
      company: job.company,
      location: job.location || "Remote",
      isRemote: Boolean(job.isRemote),
      applyUrl: job.applyUrl,
      linkedinSearchUrl:
        job.linkedinSearchUrl ||
        `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(
          `${job.title} ${job.company}`
        )}`,
      tags: Array.isArray(job.tags) ? job.tags : [],
      descriptionSnippet: job.descriptionSnippet || "",
      source: job.source || "API",
      savedAt: new Date(),
    };

    profile.savedJobs.unshift(newBookmark);
    await profile.save();

    return res.status(201).json({
      success: true,
      message: "Job successfully saved to your bookmarks!",
      savedJobs: profile.savedJobs,
    });
  } catch (error) {
    console.error("Error saving job:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save job bookmark",
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/jobs/saved/:id
 * @desc    Remove a saved job from bookmarks
 * @access  Private
 */
router.delete("/saved/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;

    const profile = await UserProfile.findOne({ user: req.user._id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    if (!profile.savedJobs || profile.savedJobs.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No saved jobs found",
        savedJobs: [],
      });
    }

    profile.savedJobs = profile.savedJobs.filter((item) => item.id !== id);
    await profile.save();

    return res.status(200).json({
      success: true,
      message: "Job removed from bookmarks",
      savedJobs: profile.savedJobs,
    });
  } catch (error) {
    console.error("Error removing saved job:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove saved job",
      error: error.message,
    });
  }
});

export default router;

