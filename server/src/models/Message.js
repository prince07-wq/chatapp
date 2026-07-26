const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    room: { type: String, required: true, trim: true },
    senderId: { type: String, required: true },
    senderUsername: { type: String, required: true },
    message: { type: String, required: true, trim: true },
    status: { type: String, enum: ["sent", "delivered", "seen"], default: "sent" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
