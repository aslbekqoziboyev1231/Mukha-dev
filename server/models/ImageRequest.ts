import mongoose from "mongoose";

const imageRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userEmail: { type: String, required: true },
  prompt: { type: String, required: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  imageUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const ImageRequest = mongoose.models.ImageRequest || mongoose.model("ImageRequest", imageRequestSchema);
export default ImageRequest;
