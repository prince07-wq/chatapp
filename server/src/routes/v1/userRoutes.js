const express = require("express");
const {
  getOnlineUsers,
  updateProfile,
  getConversationPins,
  setConversationPin,
  getConversationDeletions,
  setConversationDeletion,
  getFriends,
  searchUsers,
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
