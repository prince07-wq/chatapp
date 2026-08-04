const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const pinnedConversationSchema = new mongoose.Schema(
  {
    room: { type: String, required: true, trim: true },
    pinnedAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false },
);

const deletedConversationSchema = new mongoose.Schema(
  {
    room: { type: String, required: true, trim: true },
    deletedAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    profileImage: { type: String, default: "", trim: true },
    pinnedConversations: { type: [pinnedConversationSchema], default: [] },
    deletedConversations: { type: [deletedConversationSchema], default: [] },
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id.toString(),
    username: this.username,
    email: this.email,
    profileImage: this.profileImage || "",
  };
};

module.exports = mongoose.model("User", userSchema);
