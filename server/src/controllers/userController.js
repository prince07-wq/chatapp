const presenceService = require("../services/presenceService");
const friendService = require("../services/friendService");
const EVENTS = require("../constants/events");

function emitFriendUpdate(req, userId, notification) {
  const io = req.app.get("io");
  io?.to(`user:${userId}`).emit(EVENTS.FRIENDS_UPDATED, notification);
}

async function getOnlineUsers(req, res, next) {
  try {
    const users = await presenceService.getOnlineUsers();
    res.status(200).json({ users, count: users.length });
  } catch (err) {
    next(err);
  }
}

async function getFriends(req, res, next) {
  try {
    res.status(200).json(await friendService.getFriendLists(req.user.id));
  } catch (err) {
    next(err);
  }
}

async function searchUsers(req, res, next) {
  try {
    const users = await friendService.searchUsers(
      req.user.id,
      req.query.username,
    );
    res.status(200).json({ users });
  } catch (err) {
    next(err);
  }
}

async function sendFriendRequest(req, res, next) {
  try {
    const result = await friendService.sendFriendRequest(
      req.user.id,
      req.body?.userId,
    );
    emitFriendUpdate(req, req.user.id);
    emitFriendUpdate(req, result.recipient._id, {
      type: "friend_request",
      requestId: String(result.relationship._id),
      user: { userId: req.user.id, username: req.user.username },
      createdAt: result.relationship.createdAt,
    });
    res.status(201).json({
      requestId: String(result.relationship._id),
      userId: String(result.recipient._id),
      username: result.recipient.username,
      status: result.relationship.status,
    });
  } catch (err) {
    next(err);
  }
}

async function respondToFriendRequest(req, res, next) {
  try {
    const result = await friendService.respondToFriendRequest(
      req.user.id,
      req.params.requestId,
      req.body?.action,
    );
    emitFriendUpdate(req, req.user.id);
    emitFriendUpdate(
      req,
      result.otherUserId,
      req.body.action === "accept"
        ? {
            type: "friend_request_accepted",
            requestId: String(result.relationship._id),
            user: { userId: req.user.id, username: req.user.username },
            createdAt: result.relationship.updatedAt,
          }
        : undefined,
    );
    res.status(200).json({ success: true, status: req.body.action });
  } catch (err) {
    next(err);
  }
}

async function cancelFriendRequest(req, res, next) {
  try {
    const result = await friendService.cancelFriendRequest(
      req.user.id,
      req.params.requestId,
    );
    emitFriendUpdate(req, req.user.id);
    emitFriendUpdate(req, result.otherUserId);
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function removeFriend(req, res, next) {
  try {
    const result = await friendService.removeFriend(
      req.user.id,
      req.params.friendId,
    );
    emitFriendUpdate(req, req.user.id);
    emitFriendUpdate(req, result.otherUserId);
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getOnlineUsers,
  getFriends,
  searchUsers,
  sendFriendRequest,
  respondToFriendRequest,
  cancelFriendRequest,
  removeFriend,
};
