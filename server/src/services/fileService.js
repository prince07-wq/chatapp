const File = require("../models/File");

async function saveFileMetadata({ filename, originalName, mimeType, size, uploaderId, url }) {
  const saved = await File.create({ filename, originalName, mimeType, size, uploaderId, url });
  return saved;
}

module.exports = { saveFileMetadata };
