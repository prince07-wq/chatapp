const Message = require("../models/Message");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const mongoose = require("mongoose");
const { isReactionEmoji } = require("../constants/reactions");
const conversationService = require("./conversationService");
const fileService = require("./fileService");

const MESSAGE_EDIT_WINDOW_MS = 15 * 60 * 1000;

async function createMessage({
  room,
  senderId,
  senderUsername,
  message,
  isPrivate = false,
  attachment = null,
  replyToMessageId = null,
}) {
  await conversationService.assertConversationAccess(senderId, room);

  if (attachment?.fileUrl) {
    await fileService.assertAttachmentOwnership(attachment.fileUrl, senderId);
  }

  let replyTo;

  if (replyToMessageId) {
    if (!mongoose.isValidObjectId(replyToMessageId)) {
      throw new AppError("The message you replied to is no longer available.", 404);
    }

    const original = await Message.findOne({
      _id: replyToMessageId,
      room,
    });

    if (!original) {
      throw new AppError("The message you replied to is no longer available.", 404);
    }

    replyTo = {
      messageId: String(original._id),
      senderId: original.senderId,
      senderUsername: original.senderUsername,
      message: original.message || "",
      attachment: original.attachment?.fileUrl
        ? {
            fileName: original.attachment.fileName,
            mimeType: original.attachment.mimeType,
          }
        : undefined,
    };
  }

  const saved = await Message.create({
    room,
    senderId,
    senderUsername,
    message,
    isPrivate,
    attachment,
    replyTo,
  });
  return saved;
}

async function getRoomMessages(room, { page, limit }) {
  const messages = await Message.find({ room })
    .sort({ createdAt: 1, _id: 1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return enrichMessagesWithReactionUsers(messages);
}

async function enrichMessagesWithReactionUsers(messages) {
  const plainMessages = messages.map((message) =>
    typeof message.toObject === "function" ? message.toObject() : message
  );
  const reactionUserIds = [
    ...new Set(
      plainMessages.flatMap((message) =>
        (message.reactions || []).flatMap((reaction) =>
          (reaction.userIds || []).map(String)
        )
      )
    ),
  ];
  const users = reactionUserIds.length
    ? await User.find({ _id: { $in: reactionUserIds } })
        .select("_id username profileImage")
        .lean()
    : [];
  const usersById = new Map(
    users.map((user) => [
      String(user._id),
      {
        userId: String(user._id),
        username: user.username || "Unknown user",
        profileImage: user.profileImage || "",
      },
    ])
  );

  return plainMessages.map((message) => {
    const seenUserIds = new Set();
    const reactions = (message.reactions || []).reduce(
      (activeReactions, reaction) => {
        const userIds = (reaction.userIds || [])
          .map(String)
          .filter((userId) => {
            if (seenUserIds.has(userId)) return false;
            seenUserIds.add(userId);
            return true;
          });
        if (userIds.length === 0) return activeReactions;

        activeReactions.push({
          emoji: reaction.emoji,
          userIds,
          users: userIds.map(
            (userId) =>
              usersById.get(userId) || {
                userId,
                username: "Unknown user",
                profileImage: "",
              }
          ),
        });
        return activeReactions;
      },
      []
    );

    return { ...message, reactions };
  });
}

async function editMessage(messageId, userId, newMessage) {
  const existing = await Message.findById(messageId);

  if (!existing) {
    throw new AppError("Message not found.", 404);
  }

  await conversationService.assertConversationAccess(userId, existing.room);

  if (existing.senderId !== userId) {
    throw new AppError("Not authorized to edit this message.", 403);
  }

  if (existing.attachment?.fileUrl) {
    throw new AppError("Attachments and voice messages cannot be edited.", 400);
  }

  const messageAge = Date.now() - existing.createdAt.getTime();
  if (messageAge > MESSAGE_EDIT_WINDOW_MS) {
    throw new AppError(
      "Messages can only be edited within 15 minutes of sending.",
      403
    );
  }

  existing.message = newMessage;
  existing.editedAt = new Date();
  await existing.save();

  return existing;
}

async function deleteMessage(messageId, userId) {
  const existing = await Message.findById(messageId);

  if (!existing) {
    throw new AppError("Message not found.", 404);
  }

  await conversationService.assertConversationAccess(userId, existing.room);

  if (existing.senderId !== userId) {
    throw new AppError("Not authorized to delete this message.", 403);
  }

  await existing.deleteOne();

  return existing;
}

async function toggleMessageReaction({
  messageId,
  room,
  userId,
  emoji,
  action = "set",
}) {
  if (!isReactionEmoji(emoji)) {
    throw new AppError("Unsupported message reaction.", 400);
  }

  if (!mongoose.isValidObjectId(messageId)) {
    throw new AppError("Message not found.", 404);
  }

  await conversationService.assertConversationAccess(userId, room);

  const existing = await Message.findOne({ _id: messageId, room });
  if (!existing) {
    throw new AppError("Message not found.", 404);
  }

  const normalizedUserId = String(userId);
  const previousReaction = existing.reactions.find((reaction) =>
    reaction.userIds.some(
      (reactionUserId) => String(reactionUserId) === normalizedUserId
    )
  );
  const userReactionCount = existing.reactions.filter((reaction) =>
    reaction.userIds.some(
      (reactionUserId) => String(reactionUserId) === normalizedUserId
    )
  ).length;
  const unchanged =
    (action === "set" &&
      previousReaction?.emoji === emoji &&
      userReactionCount === 1) ||
    (action === "remove" && previousReaction?.emoji !== emoji);

  if (unchanged) {
    return { message: existing, reactionAction: "unchanged" };
  }

  existing.reactions.forEach((reaction) => {
    reaction.userIds = reaction.userIds.filter(
      (reactionUserId) => String(reactionUserId) !== normalizedUserId
    );
  });
  existing.reactions = existing.reactions.filter(
    (reaction) => reaction.userIds.length > 0
  );

  if (action === "set") {
    const nextReaction = existing.reactions.find(
      (reaction) => reaction.emoji === emoji
    );
    if (nextReaction) {
      nextReaction.userIds.push(normalizedUserId);
    } else {
      existing.reactions.push({ emoji, userIds: [normalizedUserId] });
    }
  }

  existing.reactionsUpdatedAt = new Date();
  await existing.save();
  return {
    message: existing,
    reactionAction: action === "remove" ? "removed" : "added",
  };
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
  enrichMessagesWithReactionUsers,
  editMessage,
  deleteMessage,
  toggleMessageReaction,
  markDelivered,
  markRoomMessagesDelivered,
  markRoomMessagesSeen,
};
