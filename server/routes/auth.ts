import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.ts";
import { authenticate } from "../middleware/auth.ts";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const restrictedEmails = ["admin@mukhaweb.com", "admin@mukha.com", "admin@it.com"];
    if (restrictedEmails.includes(email.toLowerCase())) {
      return res.status(403).json({ error: "Bu e-mailga ruhsat yo'q" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "User already exists" });

    const userCount = await User.countDocuments();
    const isAdmin = userCount === 0 || 
                    email.toLowerCase() === "admin@mukhadev.coom._admin_mukha" ||
                    email.toLowerCase() === "admin@mukhadev.coom";

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword, isAdmin });
    await user.save();

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" });
    res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none" });
    res.json({ message: "Registered successfully", user: { email: user.email } });
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
  res.json({ user: { email: user.email, isAdmin: user.isAdmin } });
});

export default router;
