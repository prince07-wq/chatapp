const express = require("express");
const { getRoomMessages, editMessage, deleteMessage, getPrivateMessages } = require("../../controllers/messageController");
const authenticate = require("../../middleware/authMiddleware");

const router = express.Router();

router.get("/private/:recipientId", authenticate, getPrivateMessages);
router.get("/:room", authenticate, getRoomMessages);
router.patch("/:id", authenticate, editMessage);
router.delete("/:id", authenticate, deleteMessage);

module.exports = router;
