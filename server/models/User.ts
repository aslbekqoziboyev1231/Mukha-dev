import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  displayName: { type: String, maxLength: 12 },
  isAdmin: { type: Boolean, default: false },
});

// Use 'as any' to prevent OverwriteModelError in development while satisfying TS
const User = (mongoose.models.User as any) || mongoose.model("User", userSchema);
export default User;
