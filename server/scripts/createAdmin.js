require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Staff = require("../models/Staff");

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("Connected Database:", mongoose.connection.name);

    const ADMIN_NAME = process.env.ADMIN_NAME?.trim();
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.toLowerCase().trim();
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
      throw new Error("Admin environment variables are missing");
    }

    if (ADMIN_PASSWORD.length < 12) {
      throw new Error("Admin password must be at least 12 characters");
    }

    const existingAdmin = await Staff.findOne({
      email: ADMIN_EMAIL,
    });

    if (existingAdmin) {
      console.log("Admin account already exists.");
      return;
    }

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

    await Staff.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: "admin",
    });

    console.log("Admin account created successfully.");
    console.log("Admin Email:", ADMIN_EMAIL);
  } catch (error) {
    console.error("Admin creation failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

createAdmin();
