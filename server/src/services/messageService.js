const Message = require("../models/Message");

async function createMessage({ room, senderId, senderUsername, message }) {
  const saved = await Message.create({ room, senderId, senderUsername, message });
  return saved;
}

module.exports = { createMessage };
