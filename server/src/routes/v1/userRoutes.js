const express = require("express");
const {
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
  clearConversation,
  getFriends,
  searchUsers,
  searchChat,
  sendFriendRequest,
  respondToFriendRequest,
  cancelFriendRequest,
  removeFriend,
} = require("../../controllers/userController");
const authenticate = require("../../middleware/authMiddleware");

const router = express.Router();

router.get("/online", authenticate, getOnlineUsers);
router.patch("/profile", authenticate, updateProfile);
router.get("/conversation-pins", authenticate, getConversationPins);
router.patch("/conversation-pins", authenticate, setConversationPin);
router.get("/conversation-deletions", authenticate, getConversationDeletions);
router.patch("/conversation-deletions", authenticate, setConversationDeletion);
router.get("/conversation-mutes", authenticate, getConversationMutes);
router.patch("/conversation-mutes", authenticate, setConversationMute);
router.get("/conversation-archives", authenticate, getConversationArchives);
router.patch("/conversation-archives", authenticate, setConversationArchive);
router.patch("/conversation-clears", authenticate, clearConversation);
router.get("/chat-search", authenticate, searchChat);
router.get("/search", authenticate, searchUsers);
router.get("/friends", authenticate, getFriends);
router.post("/friend-requests", authenticate, sendFriendRequest);
router.patch(
  "/friend-requests/:requestId",
  authenticate,
  respondToFriendRequest,
);
router.delete(
  "/friend-requests/:requestId",
  authenticate,
  cancelFriendRequest,
);
router.delete("/friends/:friendId", authenticate, removeFriend);

module.exports = router;
