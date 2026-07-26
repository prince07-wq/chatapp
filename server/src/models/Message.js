const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    room: { type: String, required: true, trim: true, index: true },
    isPrivate: { type: Boolean, default: false },
    senderId: { type: String, required: true },
    senderUsername: { type: String, required: true },
    message: {
      type: String,
      trim: true,
      required: function () {
        return !this.attachment || !this.attachment.fileUrl;
      },
    },
    attachment: {
      fileUrl: { type: String },
      fileName: { type: String },
      mimeType: { type: String },
    },
    status: { type: String, enum: ["sent", "delivered", "seen"], default: "sent" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
