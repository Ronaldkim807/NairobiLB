import jwt from "jsonwebtoken";
import prisma from "../utils/database.js";

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ success: false, message: "Access token required" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(403).json({ success: false, message: "Invalid or expired token" });
    }

    // Use the correct field name from your JWT payload
    const userId = decoded.userId || decoded.id;
    if (!userId) {
      return res.status(403).json({ success: false, message: "Invalid token payload" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    req.user = user;
    return next();
  } catch (error) {
    console.error("authenticateToken error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions"
      });
    }
    next();
  };
};

// Specific role middleware for easier use
export const requireOrganizer = requireRole(['ORGANIZER', 'ADMIN']);
export const requireAdmin = requireRole(['ADMIN']);