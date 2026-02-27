import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['user', 'model'], required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Use 'as any' to prevent OverwriteModelError in development while satisfying TS
const Message = (mongoose.models.Message as any) || mongoose.model("Message", messageSchema);
export default Message;
