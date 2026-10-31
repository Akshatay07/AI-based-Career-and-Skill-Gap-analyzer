import mongoose from "mongoose";

const careerRoleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Role title is required"],
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    coreSkills: {
      type: [String],
      required: [true, "Core skills are required"],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: "At least one core skill is required",
      },
    },
    optionalSkills: {
      type: [String],
      default: [],
    },
    demandLevel: {
      type: String,
      enum: ["Moderate", "High", "Very High"],
      default: "High",
    },
  },
  {
    timestamps: true,
  }
);

const CareerRole = mongoose.model("CareerRole", careerRoleSchema);

export default CareerRole;

