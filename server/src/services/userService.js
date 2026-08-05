const User = require("../models/User");
const AppError = require("../utils/AppError");
const mongoose = require("mongoose");
const conversationService = require("./conversationService");

const USERNAME_REGEX = /^[a-zA-Z0-9_.-]{2,32}$/;
const MAX_PINNED_CONVERSATIONS = 100;
const MAX_DELETED_CONVERSATIONS = 500;
const MAX_MUTED_CONVERSATIONS = 500;
const MAX_ARCHIVED_CONVERSATIONS = 500;
const MUTE_DURATIONS = {
  "1h": 60 * 60 * 1000,
  "8h": 8 * 60 * 60 * 1000,
  "1w": 7 * 24 * 60 * 60 * 1000,
  forever: null,
};

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
        .select("username displayName bio profileImage")
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
          displayName: recipient.displayName || "",
          bio: recipient.bio || "",
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
  await conversationService.assertConversationAccess(userId, normalizedRoom);

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
  await conversationService.assertConversationAccess(userId, normalizedRoom);

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

function removeExpiredMutes(user) {
  const now = Date.now();
  const activeMutes = user.mutedConversations.filter(
    (conversation) =>
      !conversation.mutedUntil || conversation.mutedUntil.getTime() > now,
  );
  const changed = activeMutes.length !== user.mutedConversations.length;
  if (changed) user.mutedConversations = activeMutes;
  return changed;
}

function serializeMutedConversations(mutedConversations = []) {
  return mutedConversations.map(({ room, mutedUntil }) => ({
    room,
    mutedUntil,
  }));
}

async function getConversationMutes(userId) {
  const user = await User.findById(userId).select("mutedConversations");
  if (!user) throw new AppError("User not found.", 404);
  if (removeExpiredMutes(user)) await user.save();
  return serializeMutedConversations(user.mutedConversations);
}

async function setConversationMute(userId, room, muted, duration) {
  const normalizedRoom = normalizeRoom(room);
  if (typeof muted !== "boolean") {
    throw new AppError("'muted' must be a boolean.", 400);
  }
  await conversationService.assertConversationAccess(userId, normalizedRoom);
  if (muted && !Object.hasOwn(MUTE_DURATIONS, duration)) {
    throw new AppError("'duration' must be 1h, 8h, 1w, or forever.", 400);
  }

  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found.", 404);
  removeExpiredMutes(user);

  const existingIndex = user.mutedConversations.findIndex(
    (conversation) => conversation.room === normalizedRoom,
  );

  if (muted) {
    if (existingIndex === -1 && user.mutedConversations.length >= MAX_MUTED_CONVERSATIONS) {
      throw new AppError(
        `You can mute up to ${MAX_MUTED_CONVERSATIONS} conversations.`,
        400,
      );
    }
    const mutedUntil = MUTE_DURATIONS[duration]
      ? new Date(Date.now() + MUTE_DURATIONS[duration])
      : null;
    if (existingIndex === -1) {
      user.mutedConversations.push({ room: normalizedRoom, mutedUntil });
    } else {
      user.mutedConversations[existingIndex].mutedUntil = mutedUntil;
    }
  } else if (existingIndex !== -1) {
    user.mutedConversations.splice(existingIndex, 1);
  }

  await user.save();
  return serializeMutedConversations(user.mutedConversations);
}

function serializeArchivedConversations(archivedConversations = []) {
  return archivedConversations
    .map(({ room, archivedAt }) => ({ room, archivedAt }))
    .sort((first, second) => second.archivedAt - first.archivedAt);
}

async function getConversationArchives(userId) {
  const user = await User.findById(userId).select("archivedConversations");
  if (!user) throw new AppError("User not found.", 404);
  return serializeArchivedConversations(user.archivedConversations);
}

async function setConversationArchive(userId, room, archived) {
  const normalizedRoom = normalizeRoom(room);
  if (typeof archived !== "boolean") {
    throw new AppError("'archived' must be a boolean.", 400);
  }
  await conversationService.assertConversationAccess(userId, normalizedRoom);
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found.", 404);
  const existingIndex = user.archivedConversations.findIndex(
    (conversation) => conversation.room === normalizedRoom,
  );
  if (archived && existingIndex === -1) {
    if (user.archivedConversations.length >= MAX_ARCHIVED_CONVERSATIONS) {
      throw new AppError(
        `You can archive up to ${MAX_ARCHIVED_CONVERSATIONS} conversations.`,
        400,
      );
    }
    user.archivedConversations.push({ room: normalizedRoom, archivedAt: new Date() });
  } else if (!archived && existingIndex !== -1) {
    user.archivedConversations.splice(existingIndex, 1);
  }
  await user.save();
  return serializeArchivedConversations(user.archivedConversations);
}

async function getConversationClear(userId, room) {
  const normalizedRoom = normalizeRoom(room);
  await conversationService.assertConversationAccess(userId, normalizedRoom);
  const user = await User.findById(userId).select("clearedConversations");
  if (!user) throw new AppError("User not found.", 404);
  return user.clearedConversations.find(
    (conversation) => conversation.room === normalizedRoom,
  )?.clearedAt ?? null;
}

async function clearConversation(userId, room) {
  const normalizedRoom = normalizeRoom(room);
  await conversationService.assertConversationAccess(userId, normalizedRoom);
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found.", 404);
  const clearedAt = new Date();
  const existing = user.clearedConversations.find(
    (conversation) => conversation.room === normalizedRoom,
  );
  if (existing) existing.clearedAt = clearedAt;
  else user.clearedConversations.push({ room: normalizedRoom, clearedAt });
  await user.save();
  return { room: normalizedRoom, clearedAt };
}

async function updateProfile(userId, { username, displayName, bio, profileImage }) {
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

  if (displayName !== undefined) {
    if (typeof displayName !== "string" || displayName.trim().length > 80) {
      throw new AppError("Display name must be 80 characters or fewer.", 400);
    }
    user.displayName = displayName.trim();
  }

  if (bio !== undefined) {
    if (typeof bio !== "string" || bio.trim().length > 280) {
      throw new AppError("Bio must be 280 characters or fewer.", 400);
    }
    user.bio = bio.trim();
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
  getConversationMutes,
  setConversationMute,
  getConversationArchives,
  setConversationArchive,
  getConversationClear,
  clearConversation,
};
