const Friendship = require("../models/Friendship");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const conversationService = require("./conversationService");
const roomService = require("./roomService");
const userService = require("./userService");

function friendshipPairKey(firstUserId, secondUserId) {
  return [String(firstUserId), String(secondUserId)].sort().join(":");
}

async function getDmDetails(userId, conversation) {
  const recipientId = conversation.memberIds.find(
    (memberId) => String(memberId) !== String(userId),
  );
  if (!recipientId) throw new AppError("Direct-message recipient was not found.", 404);

  const [recipient, friendship, sharedGroups] = await Promise.all([
    User.findById(recipientId)
      .select("username displayName bio profileImage")
      .lean(),
    Friendship.findOne({ pairKey: friendshipPairKey(userId, recipientId) }).lean(),
    Conversation.find({
      type: "room",
      memberIds: { $all: [String(userId), String(recipientId)] },
    })
      .select("room name avatar")
      .lean(),
  ]);
  if (!recipient) throw new AppError("User not found.", 404);

  let friendshipStatus = "none";
  if (friendship?.status === "accepted") friendshipStatus = "friend";
  else if (friendship?.status === "pending") {
    friendshipStatus = String(friendship.requester) === String(userId)
      ? "outgoing"
      : "incoming";
  }

  return {
    type: "dm",
    room: conversation.room,
    recipient: {
      userId: String(recipient._id),
      username: recipient.username,
      displayName: recipient.displayName || "",
      bio: recipient.bio || "",
      profileImage: recipient.profileImage || "",
    },
    friendshipStatus,
    friendshipRequestId: friendship ? String(friendship._id) : null,
    sharedGroups: sharedGroups.map((group) => ({
      room: group.room,
      name: group.name || group.room,
      avatar: group.avatar || "",
    })),
  };
}

async function getConversationDetails(userId, room) {
  const conversation = await conversationService.assertConversationAccess(userId, room);
  if (conversation.type === "room") {
    return { type: "room", ...(await roomService.serializeRoom(conversation)) };
  }
  return getDmDetails(userId, conversation);
}

async function getSharedMedia(userId, room, page = 1, limit = 24) {
  await conversationService.assertConversationAccess(userId, room);
  const clearedAt = await userService.getConversationClear(userId, room);
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 24));
  const query = {
    room,
    "attachment.fileUrl": { $exists: true, $ne: "" },
    ...(clearedAt ? { createdAt: { $gt: clearedAt } } : {}),
  };
  const [items, total] = await Promise.all([
    Message.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    Message.countDocuments(query),
  ]);
  return {
    items: items.map((message) => ({
      id: String(message._id),
      senderUsername: message.senderUsername,
      createdAt: message.createdAt,
      attachment: message.attachment,
    })),
    page: safePage,
    hasMore: safePage * safeLimit < total,
  };
}

module.exports = { getConversationDetails, getSharedMedia };
