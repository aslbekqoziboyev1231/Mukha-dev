import express from "express";
import { authenticate } from "../middleware/auth.ts";
import ImageRequest from "../models/ImageRequest.ts";
import User from "../models/User.ts";

const router = express.Router();

// Create a new image request
router.post("/", authenticate, async (req: any, res) => {
  try {
    const { prompt } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const request = new ImageRequest({
      userId: user._id,
      userEmail: user.email,
      prompt,
      status: "pending"
    });

    await request.save();
    res.json(request);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get all requests (Admin only)
router.get("/", authenticate, async (req: any, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.isAdmin) return res.status(403).json({ error: "Forbidden" });

    const requests = await ImageRequest.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get status of a specific request
router.get("/:id", authenticate, async (req: any, res) => {
  try {
    const request = await ImageRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: "Request not found" });
    
    // Only the user who created it or an admin can see it
    const user = await User.findById(req.userId);
    if (request.userId.toString() !== req.userId && (!user || !user.isAdmin)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    res.json(request);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Approve a request (Admin only)
router.post("/:id/approve", authenticate, async (req: any, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.isAdmin) return res.status(403).json({ error: "Forbidden" });

    const request = await ImageRequest.findByIdAndUpdate(req.params.id, { status: "approved" }, { new: true });
    if (!request) return res.status(404).json({ error: "Request not found" });

    res.json(request);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reject a request (Admin only)
router.post("/:id/reject", authenticate, async (req: any, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.isAdmin) return res.status(403).json({ error: "Forbidden" });

    const request = await ImageRequest.findByIdAndUpdate(req.params.id, { status: "rejected" }, { new: true });
    if (!request) return res.status(404).json({ error: "Request not found" });

    res.json(request);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update request with generated image URL
router.post("/:id/image", authenticate, async (req: any, res) => {
  try {
    const { imageUrl } = req.body;
    const request = await ImageRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: "Request not found" });

    if (request.userId.toString() !== req.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    request.imageUrl = imageUrl;
    await request.save();

    res.json(request);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
