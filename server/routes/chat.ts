import express from "express";
import Message from "../models/Message.ts";
import { authenticate } from "../middleware/auth.ts";

const router = express.Router();

router.get("/", authenticate, async (req: any, res) => {
  try {
    const messages = await Message.find({ userId: req.userId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", authenticate, async (req: any, res) => {
  try {
    const { role, text } = req.body;
    const message = new Message({ userId: req.userId, role, text });
    await message.save();
    res.json(message);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/", authenticate, async (req: any, res) => {
  try {
    await Message.deleteMany({ userId: req.userId });
    res.json({ message: "History cleared" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
