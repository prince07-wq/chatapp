const express = require("express");
const authenticate = require("../../middleware/authMiddleware");
const controller = require("../../controllers/conversationDetailsController");

const router = express.Router();
router.get("/:room", authenticate, controller.details);
router.get("/:room/media", authenticate, controller.media);

module.exports = router;
