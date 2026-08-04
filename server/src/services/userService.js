const User = require("../models/User");
const AppError = require("../utils/AppError");
const mongoose = require("mongoose");

const USERNAME_REGEX = /^[a-zA-Z0-9_.-]{2,32}$/;
const MAX_PINNED_CONVERSATIONS = 100;
const MAX_DELETED_CONVERSATIONS = 500;

function normalizeRoom(room) {
  const normalizedRoom = typeof room === "string" ? room.trim() : "";
  if (!normalizedRoom || normalizedRoom.length > 200) {
    throw new AppError("A valid room is required.", 400);
  }
  return normalizedRoom;
}

async function serializePins(userId, pinnedConversations = []) {
  const pins = pinnedConversations
    .map(({ room, pinnedAt }) => ({ room, pinnedAt }))
    .sort((first, second) => second.pinnedAt - first.pinnedAt);
  const currentUserId = String(userId);
  const recipientIds = [
    ...new Set(
      pins.flatMap(({ room }) => {
        const roomUserIds = room.split("_");
        if (roomUserIds.length !== 2 || !roomUserIds.includes(currentUserId)) {
          return [];
        }
        const recipientId = roomUserIds.find((id) => id !== currentUserId);
        return mongoose.isValidObjectId(recipientId) ? [recipientId] : [];
      }),
    ),
  ];
  const recipients = recipientIds.length
    ? await User.find({ _id: { $in: recipientIds } })
        .select("username profileImage")
        .lean()
    : [];
  const recipientsById = new Map(
    recipients.map((recipient) => [String(recipient._id), recipient]),
  );

  return pins.map((pin) => {
    const recipientId = pin.room
      .split("_")
      .find((id) => id !== currentUserId && recipientsById.has(id));
    const recipient = recipientsById.get(recipientId);
    return recipient
      ? {
          ...pin,
          recipientId,
          username: recipient.username,
          profileImage: recipient.profileImage || "",
        }
      : pin;
  });
}

async function getConversationPins(userId) {
  const user = await User.findById(userId).select("pinnedConversations");
  if (!user) throw new AppError("User not found.", 404);
  return serializePins(userId, user.pinnedConversations);
}

async function setConversationPin(userId, room, pinned) {
  const normalizedRoom = normalizeRoom(room);
  if (typeof pinned !== "boolean") {
    throw new AppError("'pinned' must be a boolean.", 400);
  }

  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found.", 404);

  const existingIndex = user.pinnedConversations.findIndex(
    (conversation) => conversation.room === normalizedRoom,
  );

  if (pinned && existingIndex === -1) {
    if (user.pinnedConversations.length >= MAX_PINNED_CONVERSATIONS) {
      throw new AppError(
        `You can pin up to ${MAX_PINNED_CONVERSATIONS} conversations.`,
        400,
      );
    }
    user.pinnedConversations.push({ room: normalizedRoom, pinnedAt: new Date() });
  } else if (!pinned && existingIndex !== -1) {
    user.pinnedConversations.splice(existingIndex, 1);
  }

  await user.save();
  return serializePins(userId, user.pinnedConversations);
}

function serializeDeletedConversations(deletedConversations = []) {
  return deletedConversations
    .map(({ room, deletedAt }) => ({ room, deletedAt }))
    .sort((first, second) => second.deletedAt - first.deletedAt);
}

async function getConversationDeletions(userId) {
  const user = await User.findById(userId).select("deletedConversations");
  if (!user) throw new AppError("User not found.", 404);
  return serializeDeletedConversations(user.deletedConversations);
}

async function setConversationDeletion(userId, room, deleted) {
  const normalizedRoom = normalizeRoom(room);
  if (typeof deleted !== "boolean") {
    throw new AppError("'deleted' must be a boolean.", 400);
  }

  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found.", 404);

  const existingIndex = user.deletedConversations.findIndex(
    (conversation) => conversation.room === normalizedRoom,
  );

  if (deleted && existingIndex === -1) {
    if (user.deletedConversations.length >= MAX_DELETED_CONVERSATIONS) {
      throw new AppError(
        `You can delete up to ${MAX_DELETED_CONVERSATIONS} conversations from your list.`,
        400,
      );
    }
    user.deletedConversations.push({
      room: normalizedRoom,
      deletedAt: new Date(),
    });
  }

  if (deleted) {
    user.pinnedConversations = user.pinnedConversations.filter(
      (conversation) => conversation.room !== normalizedRoom,
    );
  } else if (!deleted && existingIndex !== -1) {
    user.deletedConversations.splice(existingIndex, 1);
  }

  await user.save();
  return serializeDeletedConversations(user.deletedConversations);
}

async function updateProfile(userId, { username, profileImage }) {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found.", 404);

  if (username !== undefined) {
    const normalizedUsername = String(username).trim();
    if (!USERNAME_REGEX.test(normalizedUsername)) {
      throw new AppError(
        "Username must be 2-32 characters using letters, numbers, dots, dashes, or underscores.",
        400,
      );
    }

    const existing = await User.findOne({
      _id: { $ne: userId },
      username: { $regex: `^${normalizedUsername.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
    });
    if (existing) throw new AppError("Username is already taken.", 409);
    user.username = normalizedUsername;
  }

  if (profileImage !== undefined) {
    if (typeof profileImage !== "string" || profileImage.length > 2048) {
      throw new AppError("Profile image URL is invalid.", 400);
    }
    user.profileImage = profileImage.trim();
  }

  await user.save();
  return user.toSafeObject();
}

module.exports = {
  updateProfile,
  getConversationPins,
  setConversationPin,
  getConversationDeletions,
  setConversationDeletion,
};
