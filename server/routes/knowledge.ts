import express from "express";
import Knowledge from "../models/Knowledge.ts";
import User from "../models/User.ts";
import { authenticate } from "../middleware/auth.ts";

const router = express.Router();

router.get("/", authenticate, async (req: any, res) => {
  try {
    const knowledge = await Knowledge.find().sort({ createdAt: -1 });
    res.json(knowledge);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", authenticate, async (req: any, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user?.isAdmin) return res.status(403).json({ error: "Forbidden" });

    const { title, content } = req.body;
    const knowledge = new Knowledge({ title, content });
    await knowledge.save();
    res.json(knowledge);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", authenticate, async (req: any, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user?.isAdmin) return res.status(403).json({ error: "Forbidden" });

    const { title, content } = req.body;
    const knowledge = await Knowledge.findByIdAndUpdate(
      req.params.id,
      { title, content },
      { new: true }
    );
    res.json(knowledge);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", authenticate, async (req: any, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user?.isAdmin) return res.status(403).json({ error: "Forbidden" });

    await Knowledge.findByIdAndDelete(req.params.id);
    res.json({ message: "Knowledge deleted" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
