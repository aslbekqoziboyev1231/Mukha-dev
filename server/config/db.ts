import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.ts";

export const connectDB = async () => {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (MONGODB_URI) {
    try {
      await mongoose.connect(MONGODB_URI);
      console.log("Connected to MongoDB");
      await seedAdmin();
    } catch (err) {
      console.error("MongoDB connection error:", err);
    }
  } else {
    console.warn("MONGODB_URI not found. Database features will be disabled.");
  }
};

async function seedAdmin() {
  const adminEmail = "admin@mukhaweb.com";
  const adminPassword = "admin2010";
  
  try {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const admin = await User.findOneAndUpdate(
      { email: adminEmail },
      { 
        email: adminEmail, 
        password: hashedPassword, 
        isAdmin: true 
      },
      { upsert: true, new: true }
    ) as any;
    console.log("Admin user seeded/updated:", admin.email);
  } catch (err) {
    console.error("Error seeding admin user:", err);
  }
}
