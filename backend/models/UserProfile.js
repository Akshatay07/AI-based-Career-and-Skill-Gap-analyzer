import mongoose from "mongoose";

// Schema for user career & education profile
const userProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },
    targetRole: {
      type: String,
      required: [true, "Target career role is required"],
      trim: true,
    },
    currentSkills: {
      type: [String],
      default: [],
    },
    experienceLevel: {
      type: String,
      enum: ["Fresher/Student", "Entry Level", "Intermediate", "Experienced"],
      default: "Fresher/Student",
    },
    education: {
      degree: { type: String, trim: true, default: "" },
      fieldOfStudy: { type: String, trim: true, default: "" },
      institution: { type: String, trim: true, default: "" },
      graduationYear: { type: Number },
    },
  },
  {
    timestamps: true,
  }
);

const UserProfile = mongoose.model("UserProfile", userProfileSchema);

export default UserProfile;
