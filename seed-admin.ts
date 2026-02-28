import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./server/models/User.ts";
import { connectDB } from "./server/config/db.ts";

dotenv.config();

async function seedAdmin() {
  try {
    await connectDB();
    
    const email = "admin@mukhadev.coom._admin_mukha";
    const password = "admin";
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("Admin user already exists. Updating to admin status...");
      existingUser.isAdmin = true;
      await existingUser.save();
      console.log("Admin status updated.");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const adminUser = new User({
      email,
      password: hashedPassword,
      isAdmin: true
    });

    await adminUser.save();
    console.log("Admin user created successfully!");
    console.log("Email:", email);
    console.log("Password:", password);
    
    process.exit(0);
  } catch (error) {
    console.error("Error seeding admin:", error);
    process.exit(1);
  }
}

seedAdmin();
