const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    room: { type: String, required: true, unique: true, trim: true, index: true },
    type: { type: String, enum: ["room", "dm"], required: true },
    isPublic: { type: Boolean, default: false },
    memberIds: { type: [String], default: [] },
    name: { type: String, trim: true, maxlength: 80, default: "" },
    description: { type: String, trim: true, maxlength: 500, default: "" },
    avatar: { type: String, trim: true, maxlength: 2048, default: "" },
    ownerId: { type: String, default: null },
    adminIds: { type: [String], default: [] },
  },
  { timestamps: true }
);

conversationSchema.index({ memberIds: 1 });

module.exports = mongoose.model("Conversation", conversationSchema);
