const express = require("express");
const { getOnlineUsers } = require("../../controllers/userController");
const authenticate = require("../../middleware/authMiddleware");

const router = express.Router();

router.get("/online", authenticate, getOnlineUsers);

module.exports = router;
