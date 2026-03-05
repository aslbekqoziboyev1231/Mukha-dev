import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.ts";

export const connectDB = async () => {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (MONGODB_URI) {
    try {
      console.log("Attempting to connect to MongoDB...");
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
        socketTimeoutMS: 45000,
      });
      console.log("Successfully connected to MongoDB");
      
      // Drop problematic index if it exists
      try {
        const collection = mongoose.connection.collection('users');
        const indexes = await collection.indexes();
        if (indexes.some(idx => idx.name === 'username_1')) {
          await collection.dropIndex('username_1');
          console.log("Dropped problematic index: username_1");
        }
      } catch (e: any) {
        console.warn("Index check/drop warning:", e.message);
      }

      await seedAdmin();
    } catch (err: any) {
      console.error("CRITICAL: MongoDB connection failed!");
      console.error("Error Name:", err.name);
      console.error("Error Message:", err.message);
      
      if (err.message.includes("ETIMEDOUT") || err.message.includes("buffered")) {
        console.error("TIP: This usually means your IP address is not whitelisted in MongoDB Atlas or the password is incorrect.");
      }
    }
  } else {
    console.warn("MONGODB_URI not found in environment variables.");
  }
};

async function seedAdmin() {
  const adminEmail = "mukha-bot@admin.com";
  const adminPassword = "Admin.Mukha";
  
  try {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const admin = await User.findOneAndUpdate(
      { email: adminEmail },
      { 
        email: adminEmail, 
        password: hashedPassword, 
        displayName: "MukhaAdmin",
        isAdmin: true 
      },
      { upsert: true, new: true }
    ) as any;
    console.log("Admin user seeded/updated:", admin.email);
  } catch (err) {
    console.error("Error seeding admin user:", err);
  }
}
