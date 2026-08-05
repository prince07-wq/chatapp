const express = require("express");
const authenticate = require("../../middleware/authMiddleware");
const controller = require("../../controllers/roomController");

const router = express.Router();
router.get("/:room", authenticate, controller.details);
router.patch("/:room", authenticate, controller.update);
router.get("/:room/media", authenticate, controller.media);
router.post("/:room/members", authenticate, controller.addMembers);
router.delete("/:room/members/:userId", authenticate, controller.removeMember);
router.patch("/:room/members/:userId/role", authenticate, controller.setRole);
router.post("/:room/leave", authenticate, controller.leave);
module.exports = router;
