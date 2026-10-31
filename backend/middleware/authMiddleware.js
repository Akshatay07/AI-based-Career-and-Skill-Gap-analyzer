import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Middleware to protect routes that require authentication
export async function protect(req, res, next) {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Extract token from "Bearer <token>"
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user to req object without the password field
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "User not found or token invalid",
        });
      }

      return next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, token failed verification",
        error: error.message,
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, no token provided",
    });
  }
}
