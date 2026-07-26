const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    room: { type: String, required: true, trim: true },
    senderId: { type: String, required: true },
    senderUsername: { type: String, required: true },
    message: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
