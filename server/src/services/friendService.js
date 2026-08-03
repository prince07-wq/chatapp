const mongoose = require("mongoose");
const Friendship = require("../models/Friendship");
const User = require("../models/User");
const AppError = require("../utils/AppError");

function asId(value, field = "userId") {
  if (!mongoose.isValidObjectId(value)) {
    throw new AppError(`${field} is invalid.`, 400);
  }
  return String(value);
}

function pairKey(userIdA, userIdB) {
  return [String(userIdA), String(userIdB)].sort().join(":");
}

function safeUser(user) {
  return {
    userId: String(user._id),
    username: user.username,
  };
}

async function getFriendLists(userId) {
  const relationships = await Friendship.find({
    $or: [{ requester: userId }, { recipient: userId }],
  })
    .populate("requester", "username")
    .populate("recipient", "username")
    .sort({ updatedAt: -1 });

  const result = { friends: [], incoming: [], outgoing: [] };

  relationships.forEach((relationship) => {
    const isRequester = String(relationship.requester._id) === String(userId);
    const otherUser = isRequester
      ? relationship.recipient
      : relationship.requester;
    const item = {
      requestId: String(relationship._id),
      ...safeUser(otherUser),
      createdAt: relationship.createdAt,
    };

    if (relationship.status === "accepted") result.friends.push(item);
    else if (isRequester) result.outgoing.push(item);
    else result.incoming.push(item);
  });

  return result;
}

async function searchUsers(userId, username) {
  const query = String(username || "").trim();
  if (!query) return [];

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const users = await User.find({
    _id: { $ne: userId },
    username: { $regex: escaped, $options: "i" },
  })
    .select("username")
    .sort({ username: 1 })
    .limit(20);

  const ids = users.map((user) => user._id);
  const relationships = await Friendship.find({
    pairKey: { $in: ids.map((id) => pairKey(userId, id)) },
  });
  const byPair = new Map(
    relationships.map((relationship) => [relationship.pairKey, relationship]),
  );

  return users.map((foundUser) => {
    const relationship = byPair.get(pairKey(userId, foundUser._id));
    let relationshipStatus = "none";

    if (relationship?.status === "accepted") relationshipStatus = "friend";
    else if (relationship?.status === "pending") {
      relationshipStatus =
        String(relationship.requester) === String(userId)
          ? "outgoing"
          : "incoming";
    }

    return {
      ...safeUser(foundUser),
      relationshipStatus,
      requestId: relationship ? String(relationship._id) : null,
    };
  });
}

async function sendFriendRequest(requesterId, recipientId) {
  const targetId = asId(recipientId);
  if (String(requesterId) === targetId) {
    throw new AppError("You cannot send a friend request to yourself.", 400);
  }

  const recipient = await User.findById(targetId).select("username");
  if (!recipient) throw new AppError("User not found.", 404);

  const existing = await Friendship.findOne({
    pairKey: pairKey(requesterId, targetId),
  });
  if (existing) {
    throw new AppError(
      existing.status === "accepted"
        ? "You are already friends."
        : "A friend request already exists.",
      409,
    );
  }

  const relationship = await Friendship.create({
    requester: requesterId,
    recipient: targetId,
    pairKey: pairKey(requesterId, targetId),
  });

  return { relationship, recipient };
}

async function respondToFriendRequest(userId, requestId, action) {
  asId(requestId, "requestId");
  if (!["accept", "decline"].includes(action)) {
    throw new AppError("action must be accept or decline.", 400);
  }

  const relationship = await Friendship.findOne({
    _id: requestId,
    recipient: userId,
    status: "pending",
  });
  if (!relationship) throw new AppError("Friend request not found.", 404);

  const otherUserId = String(relationship.requester);
  if (action === "decline") await relationship.deleteOne();
  else {
    relationship.status = "accepted";
    await relationship.save();
  }

  return { relationship, otherUserId };
}

async function cancelFriendRequest(userId, requestId) {
  asId(requestId, "requestId");
  const relationship = await Friendship.findOneAndDelete({
    _id: requestId,
    requester: userId,
    status: "pending",
  });
  if (!relationship) throw new AppError("Outgoing request not found.", 404);
  return { relationship, otherUserId: String(relationship.recipient) };
}

async function removeFriend(userId, friendId) {
  const targetId = asId(friendId, "friendId");
  const relationship = await Friendship.findOneAndDelete({
    pairKey: pairKey(userId, targetId),
    status: "accepted",
  });
  if (!relationship) throw new AppError("Friendship not found.", 404);
  return { relationship, otherUserId: targetId };
}

module.exports = {
  getFriendLists,
  searchUsers,
  sendFriendRequest,
  respondToFriendRequest,
  cancelFriendRequest,
  removeFriend,
};
