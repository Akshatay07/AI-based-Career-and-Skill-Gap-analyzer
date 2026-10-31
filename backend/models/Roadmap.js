import mongoose from "mongoose";

const roadmapSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    targetRole: {
      type: String,
      required: true,
      trim: true,
    },
    experienceLevel: {
      type: String,
      default: "Fresher/Student",
    },
    missingSkills: {
      type: [String],
      default: [],
    },
    overview: {
      type: String,
      required: true,
    },
    timelinePhases: [
      {
        phaseNumber: { type: Number, required: true },
        title: { type: String, required: true },
        duration: { type: String, required: true },
        focusSkills: { type: [String], default: [] },
        actionItems: [
          {
            task: { type: String, required: true },
            isCompleted: { type: Boolean, default: false },
          },
        ],
        resources: [
          {
            title: { type: String, required: true },
            type: { type: String, default: "Documentation" },
            urlOrPlatform: { type: String, required: true },
          },
        ],
      },
    ],
    recommendedProjects: [
      {
        title: { type: String, required: true },
        difficulty: {
          type: String,
          enum: ["Beginner", "Intermediate", "Advanced"],
          default: "Intermediate",
        },
        description: { type: String, required: true },
        demonstratesSkills: { type: [String], default: [] },
        architectureHighlights: { type: [String], default: [] },
      },
    ],
    interviewFocusAreas: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Roadmap = mongoose.model("Roadmap", roadmapSchema);

export default Roadmap;

