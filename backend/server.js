import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import profileRoutes from "./routes/profileRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import roleRoutes from "./routes/roleRoutes.js";
import roadmapRoutes from "./routes/roadmapRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import { seedCareerRolesIfEmpty } from "./data/seedDatabase.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "15mb" }));

// Routes
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to AI-Based Career and Skill Gap Analyzer API",
  });
});

app.get("/api/health", (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.status(200).json({
    success: true,
    message: "Career and Skill Gap Analyzer API is running!",
    database: isDbConnected ? "Connected" : "Disconnected",
    dbState: mongoose.connection.readyState,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/ai/roadmap", roadmapRoutes);

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected successfully!");

    // Ensure benchmark roles are populated in MongoDB
    await seedCareerRolesIfEmpty();

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

startServer();
