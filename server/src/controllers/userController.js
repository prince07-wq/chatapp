const presenceService = require("../services/presenceService");
const friendService = require("../services/friendService");
const userService = require("../services/userService");
const tokenService = require("../services/tokenService");
const searchService = require("../services/searchService");
const EVENTS = require("../constants/events");
const { parsePagination } = require("../utils/httpValidators");

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

async function updateProfile(req, res, next) {
  try {
    const user = await userService.updateProfile(req.user.id, req.body || {});
    const accessToken = tokenService.generateAccessToken(user);
    const publicProfile = {
      userId: user.id,
      username: user.username,
      profileImage: user.profileImage,
    };

    req.app.get("io")?.emit(EVENTS.USER_PROFILE_UPDATED, publicProfile);
    res.status(200).json({ user, accessToken });
  } catch (err) {
    next(err);
  }
}

async function getConversationPins(req, res, next) {
  try {
    const pinnedConversations = await userService.getConversationPins(req.user.id);
    res.status(200).json({ pinnedConversations });
  } catch (err) {
    next(err);
  }
}

async function setConversationPin(req, res, next) {
  try {
    const pinnedConversations = await userService.setConversationPin(
      req.user.id,
      req.body?.room,
      req.body?.pinned,
    );
    res.status(200).json({ pinnedConversations });
  } catch (err) {
    next(err);
  }
}

async function getConversationDeletions(req, res, next) {
  try {
    const deletedConversations = await userService.getConversationDeletions(
      req.user.id,
    );
    res.status(200).json({ deletedConversations });
  } catch (err) {
    next(err);
  }
}

async function setConversationDeletion(req, res, next) {
  try {
    const deletedConversations = await userService.setConversationDeletion(
      req.user.id,
      req.body?.room,
      req.body?.deleted,
    );
    res.status(200).json({ deletedConversations });
  } catch (err) {
    next(err);
  }
}

async function getConversationMutes(req, res, next) {
  try {
    const mutedConversations = await userService.getConversationMutes(
      req.user.id,
    );
    res.status(200).json({ mutedConversations });
  } catch (err) {
    next(err);
  }
}

async function setConversationMute(req, res, next) {
  try {
    const mutedConversations = await userService.setConversationMute(
      req.user.id,
      req.body?.room,
      req.body?.muted,
      req.body?.duration,
    );
    res.status(200).json({ mutedConversations });
  } catch (err) {
    next(err);
  }
}

async function getConversationArchives(req, res, next) {
  try {
    const archivedConversations = await userService.getConversationArchives(
      req.user.id,
    );
    res.status(200).json({ archivedConversations });
  } catch (err) {
    next(err);
  }
}

async function setConversationArchive(req, res, next) {
  try {
    const archivedConversations = await userService.setConversationArchive(
      req.user.id,
      req.body?.room,
      req.body?.archived,
    );
    res.status(200).json({ archivedConversations });
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

async function searchChat(req, res, next) {
  try {
    const { page, limit } = parsePagination(req.query);
    const results = await searchService.searchChat(req.user.id, req.query.q, {
      page,
      limit,
    });
    res.status(200).json(results);
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
  updateProfile,
  getConversationPins,
  setConversationPin,
  getConversationDeletions,
  setConversationDeletion,
  getConversationMutes,
  setConversationMute,
  getConversationArchives,
  setConversationArchive,
  getFriends,
  searchUsers,
  searchChat,
  sendFriendRequest,
  respondToFriendRequest,
  cancelFriendRequest,
  removeFriend,
};
