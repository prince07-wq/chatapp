const Message = require("../models/Message");
const AppError = require("../utils/AppError");

async function createMessage({ room, senderId, senderUsername, message, isPrivate = false, attachment = null }) {
  const saved = await Message.create({ room, senderId, senderUsername, message, isPrivate, attachment });
  return saved;
}

async function getRoomMessages(room, { page, limit }) {
  const messages = await Message.find({ room })
    .sort({ createdAt: 1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return messages;
}

async function editMessage(messageId, userId, newMessage) {
  const existing = await Message.findById(messageId);

  if (!existing) {
    throw new AppError("Message not found.", 404);
  }

  if (existing.senderId !== userId) {
    throw new AppError("Not authorized to edit this message.", 403);
  }

  existing.message = newMessage;
  await existing.save();

  return existing;
}

async function deleteMessage(messageId, userId) {
  const existing = await Message.findById(messageId);

  if (!existing) {
    throw new AppError("Message not found.", 404);
  }

  if (existing.senderId !== userId) {
    throw new AppError("Not authorized to delete this message.", 403);
  }

  await existing.deleteOne();

  return existing;
}

async function markDelivered(messageId) {
  const existing = await Message.findById(messageId);
  if (!existing) return null;

  if (existing.status === "sent") {
    existing.status = "delivered";
    await existing.save();
  }

  return existing;
}

/**
 * Called when a user joins/reconnects to a room — marks any
 * still-"sent" messages (not their own) as delivered now that
 * they're present. Returns the ids that changed, for broadcasting.
 */
async function markRoomMessagesDelivered(room, userId) {
  const pending = await Message.find({
    room,
    senderId: { $ne: userId },
    status: "sent",
  }).select("_id");

  const ids = pending.map((m) => m._id);
  if (ids.length > 0) {
    await Message.updateMany({ _id: { $in: ids } }, { $set: { status: "delivered" } });
  }

  return ids.map((id) => id.toString());
}

/**
 * Called when a user opens/reads a room's chat — marks messages
 * (not their own) as seen. Returns the ids that changed.
 */
async function markRoomMessagesSeen(room, userId) {
  const unseen = await Message.find({
    room,
    senderId: { $ne: userId },
    status: { $ne: "seen" },
  }).select("_id");

  const ids = unseen.map((m) => m._id);
  if (ids.length > 0) {
    await Message.updateMany({ _id: { $in: ids } }, { $set: { status: "seen" } });
  }

  return ids.map((id) => id.toString());
}

module.exports = {
  createMessage,
  getRoomMessages,
  editMessage,
  deleteMessage,
  markDelivered,
  markRoomMessagesDelivered,
  markRoomMessagesSeen,
};
