// server/config/db.js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("MONGO_URI missing in .env");

    await mongoose.connect(uri, {
      dbName: "NextGenCMC",            // <-- your database name
      autoIndex: true,                 // dev: allows index creation (text index)
      serverSelectionTimeoutMS: 10000, // clearer timeout
      retryWrites: true,
      w: "majority",
    });

    console.log("✅ MongoDB connected");

    // (Optional) verify the text index once; ok if collection doesn't exist yet
    try {
      const indexes = await mongoose.connection
        .collection("messages")
        .indexes();
      console.log("Message indexes:", indexes);
    } catch {
      console.log("Message collection not created yet (no docs).");
    }
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
