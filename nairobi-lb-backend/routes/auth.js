import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../utils/database.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

const isValidEmail = (email) => typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isStrongPassword = (password) => typeof password === "string" && password.length >= 8 && /[0-9]/.test(password) && /[a-zA-Z]/.test(password);

const signAccessToken = (user) => jwt.sign(
  { userId: user.id, email: user.email, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: "1h" }
);

const signRefreshToken = (user) => jwt.sign(
  { userId: user.id },
  process.env.JWT_REFRESH_SECRET,
  { expiresIn: "7d" }
);

/**
 * Register
 */
router.post("/register", async (req, res) => {
  try {
    let { email, password, name, role = "USER" } = req.body || {};
    email = (email || "").trim().toLowerCase();
    name = (name || "").trim();

    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: "Email, password, and name are required" });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }
    if (!isStrongPassword(password)) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters and include letters and numbers" });
    }

    if (role === "ADMIN") role = "USER";

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, role: role === "ORGANIZER" ? "ORGANIZER" : "USER" },
      select: { id: true, email: true, name: true, role: true }
    });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    return res.status(201).json({ success: true, message: "User registered successfully", data: { user, accessToken, refreshToken } });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * Login
 */
router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body || {};
    email = (email || "").trim().toLowerCase();

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    return res.json({ success: true, message: "Login successful", data: { user: { id: user.id, email: user.email, name: user.name, role: user.role }, accessToken, refreshToken } });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * Refresh
 */
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) return res.status(400).json({ success: false, message: "Refresh token is required" });

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const userId = decoded.userId;
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, role: true } });
      if (!user) return res.status(401).json({ success: false, message: "Invalid refresh token" });

      const newAccessToken = jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
      return res.json({ success: true, data: { accessToken: newAccessToken } });
    } catch (err) {
      console.error("Refresh token verification failed:", err);
      return res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
    }
  } catch (error) {
    console.error("Refresh error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * Logout
 */
router.post("/logout", async (req, res) => {
  try {
    return res.json({ success: true, message: "Logged out. Please delete access and refresh tokens on client." });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

/**
 * Me
 */
router.get("/me", authenticateToken, async (req, res) => {
  try {
    return res.json({ success: true, data: { user: req.user } });
  } catch (error) {
    console.error("Get current user error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

export default router;
