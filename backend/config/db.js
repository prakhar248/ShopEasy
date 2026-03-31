// ============================================================
//  config/db.js  —  MongoDB connection using Mongoose
//  Called once on server startup from server.js
// ============================================================

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // mongoose.connect returns a promise; we await it
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    // Exit the process if we cannot connect to the database
    process.exit(1);
  }
};

module.exports = connectDB;
