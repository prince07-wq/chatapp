const fileService = require("../services/fileService");
const AppError = require("../utils/AppError");

async function uploadFile(req, res, next) {
  try {
    if (!req.file) {
      throw new AppError("No file uploaded or file type rejected.", 400);
    }

    const url = `/uploads/${req.file.filename}`;

    const saved = await fileService.saveFileMetadata({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploaderId: req.user.id,
      url,
    });

    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadFile };
