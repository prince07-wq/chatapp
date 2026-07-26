const express = require("express");
const uploadSingleFile = require("../../middleware/uploadMiddleware");
const authenticate = require("../../middleware/authMiddleware");
const { uploadFile } = require("../../controllers/fileController");

const router = express.Router();

router.post("/upload", authenticate, uploadSingleFile, uploadFile);

module.exports = router;
