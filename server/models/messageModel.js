// models/messageModel.js
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

// Text index for fast full-text search
messageSchema.index({ text: "text" });

module.exports = mongoose.model("Message", messageSchema);
