import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import profileRoutes from "./routes/profileRoutes.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Welcome to AI-Based Career and Skill Gap Analyzer API",
    });
});

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Career and Skill Gap Analyzer API is running!",
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/profiles", profileRoutes);


async function startServer() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB connected successfully!");

        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    }
}

startServer();