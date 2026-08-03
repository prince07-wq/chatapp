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
    replyTo: {
      messageId: { type: String },
      senderId: { type: String },
      senderUsername: { type: String },
      message: { type: String },
      attachment: {
        fileName: { type: String },
        mimeType: { type: String },
      },
    },
    reactions: {
      type: [
        {
          _id: false,
          emoji: { type: String, required: true },
          userIds: { type: [String], default: [] },
        },
      ],
      default: [],
    },
    reactionsUpdatedAt: { type: Date, default: null },
    status: { type: String, enum: ["sent", "delivered", "seen"], default: "sent" },
    editedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
