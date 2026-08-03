const express = require("express");
const {
  getOnlineUsers,
  updateProfile,
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
