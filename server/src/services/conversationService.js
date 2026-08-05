const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const { getPrivateRoomId } = require("../utils/roomUtils");

function getDirectMemberIds(room) {
  const memberIds = String(room || "").split("_");
  return memberIds.length === 2 && memberIds.every(mongoose.isValidObjectId)
    ? memberIds.sort()
    : null;
}

async function resolveConversation(room) {
  if (!room || typeof room !== "string") {
    throw new AppError("Room is required.", 400);
  }

  const existing = await Conversation.findOne({ room });
  if (existing) return existing;

  const memberIds = getDirectMemberIds(room);

  return Conversation.findOneAndUpdate(
    { room },
    {
      $setOnInsert: {
        room,
        type: memberIds ? "dm" : "room",
        isPublic: !memberIds,
        memberIds: memberIds || [],
      },
    },
    { returnDocument: "after", upsert: true }
  );
}

async function ensurePrivateConversation(userId, recipientId) {
  if (
    !mongoose.isValidObjectId(recipientId) ||
    String(userId) === String(recipientId)
  ) {
    throw new AppError("A valid recipient is required.", 400);
  }

  const recipient = await User.exists({ _id: recipientId });
  if (!recipient) {
    throw new AppError("Recipient not found.", 404);
  }

  const memberIds = [String(userId), String(recipientId)].sort();
  const room = getPrivateRoomId(memberIds[0], memberIds[1]);
  const conversation = await Conversation.findOneAndUpdate(
    { room },
    {
      $setOnInsert: {
        room,
        type: "dm",
        isPublic: false,
        memberIds,
      },
    },
    { returnDocument: "after", upsert: true }
  );

  if (
    conversation.type !== "dm" ||
    conversation.isPublic ||
    conversation.memberIds.length !== 2 ||
    !conversation.memberIds.every((memberId) => memberIds.includes(String(memberId)))
  ) {
    throw new AppError("Conversation access is not allowed.", 403);
  }

  return conversation;
}

async function assertConversationAccess(userId, room) {
  const conversation = await resolveConversation(room);
  const isMember = conversation.memberIds.some(
    (memberId) => String(memberId) === String(userId)
  );

  if (!conversation.isPublic && !isMember) {
    throw new AppError("Conversation access is not allowed.", 403);
  }

  return conversation;
}

async function getAuthorizedConversations(userId) {
  return Conversation.find({
    $or: [{ isPublic: true }, { memberIds: String(userId) }],
  }).lean();
}

async function recordRoomMembership(userId, room) {
  const conversation = await resolveConversation(room);
  if (conversation.type !== "room") return conversation;
  const normalizedUserId = String(userId);
  if (!conversation.memberIds.includes(normalizedUserId)) {
    conversation.memberIds.push(normalizedUserId);
  }
  if (!conversation.ownerId) {
    conversation.ownerId = normalizedUserId;
  }
  await conversation.save();
  return conversation;
}

module.exports = {
  assertConversationAccess,
  ensurePrivateConversation,
  getAuthorizedConversations,
  recordRoomMembership,
  resolveConversation,
};
