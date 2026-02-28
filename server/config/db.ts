import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.ts";

export const connectDB = async () => {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (MONGODB_URI) {
    try {
      await mongoose.connect(MONGODB_URI);
      console.log("Connected to MongoDB");
      
      // Drop problematic index if it exists to fix the duplicate key error
      try {
        const collection = mongoose.connection.collection('users');
        await collection.dropIndex('username_1');
        console.log("Dropped problematic index: username_1");
      } catch (e: any) {
        // Index might not exist, ignore the error
        if (e.codeName !== 'IndexNotFound') {
          console.warn("Could not drop index username_1 (it might not exist):", e.message);
        }
      }

      await seedAdmin();
    } catch (err) {
      console.error("MongoDB connection error:", err);
    }
  } else {
    console.warn("MONGODB_URI not found. Database features will be disabled.");
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
