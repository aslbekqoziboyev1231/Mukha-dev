import mongoose from "mongoose";

const knowledgeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Use 'as any' to prevent OverwriteModelError in development while satisfying TS
const Knowledge = (mongoose.models.Knowledge as any) || mongoose.model("Knowledge", knowledgeSchema);
export default Knowledge;
