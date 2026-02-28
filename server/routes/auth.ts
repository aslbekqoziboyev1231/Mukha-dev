import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.ts";
import { authenticate } from "../middleware/auth.ts";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

router.post("/register", async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    // Display name validation
    if (displayName) {
      if (displayName.length > 12) return res.status(400).json({ error: "Display name max 12 characters" });
      if (!/^[a-zA-Z0-9']+$/.test(displayName)) {
        return res.status(400).json({ error: "Only letters, numbers and ' allowed in display name" });
      }
    }

    const restrictedEmails = ["admin@mukhaweb.com", "admin@mukha.com", "admin@it.com"];
    if (restrictedEmails.includes(email.toLowerCase())) {
      return res.status(403).json({ error: "Bu e-mailga ruhsat yo'q" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "User already exists" });

    const userCount = await User.countDocuments();
    const isAdmin = userCount === 0 || 
                    email.toLowerCase() === "mukha-bot@admin.com";

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword, displayName, isAdmin });
    await user.save();

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" });
    res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none" });
    res.json({ message: "Registered successfully", user: { email: user.email, displayName: user.displayName } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/update-profile", authenticate, async (req: any, res) => {
  try {
    const { email, password, displayName } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (displayName) {
      if (displayName.length > 12) return res.status(400).json({ error: "Display name max 12 characters" });
      if (!/^[a-zA-Z0-9']+$/.test(displayName)) {
        return res.status(400).json({ error: "Only letters, numbers and ' allowed in display name" });
      }
      user.displayName = displayName;
    }

    if (email) user.email = email;
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();
    res.json({ message: "Profile updated successfully", user: { email: user.email, displayName: user.displayName, isAdmin: user.isAdmin } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, (user as any).password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" });
    res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none" });
    res.json({ message: "Logged in successfully", user: { email: user.email } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
});

router.get("/me", authenticate, async (req: any, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user: { email: user.email, displayName: user.displayName, isAdmin: user.isAdmin } });
});

export default router;
