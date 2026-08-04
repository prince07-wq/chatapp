const File = require("../models/File");
const AppError = require("../utils/AppError");

async function saveFileMetadata({ filename, originalName, mimeType, size, uploaderId, url }) {
  const saved = await File.create({ filename, originalName, mimeType, size, uploaderId, url });
  return saved;
}

async function assertAttachmentOwnership(url, uploaderId) {
  const file = await File.findOne({ url });

  if (!file || String(file.uploaderId) !== String(uploaderId)) {
    throw new AppError("Attachment access is not allowed.", 403);
  }
}

module.exports = { saveFileMetadata, assertAttachmentOwnership };
