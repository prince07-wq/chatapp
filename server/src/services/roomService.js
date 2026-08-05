const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const conversationService = require("./conversationService");

function isManager(conversation, userId) {
  const id = String(userId);
  return String(conversation.ownerId) === id || conversation.adminIds.includes(id);
}

async function requireRoom(userId, room) {
  const conversation = await conversationService.assertConversationAccess(userId, room);
  if (conversation.type !== "room") throw new AppError("Room details are unavailable for direct messages.", 400);
  return conversation;
}

async function serializeRoom(conversation) {
  const users = await User.find({ _id: { $in: conversation.memberIds } })
    .select("username displayName profileImage")
    .lean();
  const ownerId = conversation.ownerId ? String(conversation.ownerId) : null;
  const adminIds = new Set(conversation.adminIds.map(String));
  return {
    room: conversation.room,
    name: conversation.name || conversation.room,
    description: conversation.description || "",
    avatar: conversation.avatar || "",
    createdAt: conversation.createdAt,
    ownerId,
    memberCount: users.length,
    members: users.map((user) => ({
      userId: String(user._id),
      username: user.username,
      displayName: user.displayName || "",
      profileImage: user.profileImage || "",
      role: String(user._id) === ownerId ? "owner" : adminIds.has(String(user._id)) ? "admin" : "member",
    })),
  };
}

async function getRoomDetails(userId, room) {
  return serializeRoom(await requireRoom(userId, room));
}

async function updateRoom(userId, room, changes = {}) {
  const conversation = await requireRoom(userId, room);
  if (!isManager(conversation, userId)) throw new AppError("Room management permission is required.", 403);
  const savedChanges = {};
  if (changes.name !== undefined) savedChanges.name = String(changes.name).trim();
  if (changes.description !== undefined) savedChanges.description = String(changes.description).trim();
  if (changes.avatar !== undefined) savedChanges.avatar = String(changes.avatar).trim();
  if (!Object.keys(savedChanges).length) throw new AppError("No supported room changes were provided.", 400);
  const saved = await Conversation.findOneAndUpdate(
    { _id: conversation._id },
    { $set: savedChanges },
    { returnDocument: "after", runValidators: true },
  );
  return serializeRoom(saved);
}

async function addMembers(userId, room, userIds) {
  const conversation = await requireRoom(userId, room);
  if (!isManager(conversation, userId)) throw new AppError("Room management permission is required.", 403);
  const normalizedIds = [...new Set((Array.isArray(userIds) ? userIds : []).map(String))];
  if (!normalizedIds.length || normalizedIds.some((id) => !mongoose.isValidObjectId(id))) {
    throw new AppError("Valid member IDs are required.", 400);
  }
  const existingUsers = await User.find({ _id: { $in: normalizedIds } }).select("_id").lean();
  if (existingUsers.length !== normalizedIds.length) throw new AppError("One or more users were not found.", 404);
  const saved = await Conversation.findOneAndUpdate(
    { _id: conversation._id },
    { $addToSet: { memberIds: { $each: normalizedIds } } },
    { returnDocument: "after", runValidators: true },
  );
  return serializeRoom(saved);
}

async function removeMember(userId, room, memberId) {
  const conversation = await requireRoom(userId, room);
  if (!isManager(conversation, userId)) throw new AppError("Room management permission is required.", 403);
  if (String(conversation.ownerId) === String(memberId)) throw new AppError("Transfer ownership before removing the owner.", 409);
  const saved = await Conversation.findOneAndUpdate(
    { _id: conversation._id },
    { $pull: { memberIds: String(memberId), adminIds: String(memberId) } },
    { returnDocument: "after", runValidators: true },
  );
  return serializeRoom(saved);
}

async function setMemberRole(userId, room, memberId, role) {
  const conversation = await requireRoom(userId, room);
  if (String(conversation.ownerId) !== String(userId)) throw new AppError("Only the room owner can manage admins.", 403);
  if (!conversation.memberIds.includes(String(memberId)) || String(memberId) === String(conversation.ownerId)) {
    throw new AppError("That member role cannot be changed.", 400);
  }
  if (!['admin', 'member'].includes(role)) throw new AppError("Role must be admin or member.", 400);
  const update = role === "admin"
    ? { $addToSet: { adminIds: String(memberId) } }
    : { $pull: { adminIds: String(memberId) } };
  const saved = await Conversation.findOneAndUpdate(
    { _id: conversation._id },
    update,
    { returnDocument: "after", runValidators: true },
  );
  return serializeRoom(saved);
}

async function leaveRoom(userId, room) {
  const conversation = await requireRoom(userId, room);
  const id = String(userId);
  const otherMembers = conversation.memberIds.filter((memberId) => String(memberId) !== id);
  if (String(conversation.ownerId) === id && otherMembers.length) {
    throw new AppError("Transfer ownership before leaving this room.", 409);
  }
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found.", 404);
  conversation.memberIds = otherMembers;
  conversation.adminIds = conversation.adminIds.filter((memberId) => String(memberId) !== id);
  if (String(conversation.ownerId) === id) conversation.ownerId = null;
  if (!user.deletedConversations.some((item) => item.room === room)) {
    user.deletedConversations.push({ room, deletedAt: new Date() });
  }
  user.pinnedConversations = user.pinnedConversations.filter(
    (item) => item.room !== room,
  );
  await Promise.all([conversation.save(), user.save()]);
  return {
    success: true,
    deletedConversations: user.deletedConversations
      .map(({ room: deletedRoom, deletedAt }) => ({ room: deletedRoom, deletedAt }))
      .sort((first, second) => second.deletedAt - first.deletedAt),
  };
}

module.exports = { addMembers, getRoomDetails, leaveRoom, removeMember, serializeRoom, setMemberRole, updateRoom };
