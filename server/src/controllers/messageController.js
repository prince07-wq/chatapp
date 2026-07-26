const messageService = require("../services/messageService");
const AppError = require("../utils/AppError");
const { parsePagination, isValidEditPayload } = require("../utils/httpValidators");
const { getPrivateRoomId } = require("../utils/roomUtils");

async function getRoomMessages(req, res, next) {
  try {
    const { room } = req.params;

    if (!room) {
      throw new AppError("Room is required.", 400);
    }

    const { page, limit } = parsePagination(req.query);
    const messages = await messageService.getRoomMessages(room, { page, limit });

    res.status(200).json({ room, page, limit, messages });
  } catch (err) {
    next(err);
  }
}

async function editMessage(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidEditPayload(req.body)) {
      throw new AppError("'message' is required and cannot be empty.", 400);
    }

    const updated = await messageService.editMessage(id, req.user.id, req.body.message);
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

async function deleteMessage(req, res, next) {
  try {
    const { id } = req.params;
    await messageService.deleteMessage(id, req.user.id);
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { getRoomMessages, editMessage, deleteMessage, getPrivateMessages };

async function getPrivateMessages(req, res, next) {
  try {
    const { recipientId } = req.params;

    if (!recipientId) {
      throw new AppError("recipientId is required.", 400);
    }

    const room = getPrivateRoomId(req.user.id, recipientId);
    const { page, limit } = parsePagination(req.query);
    const messages = await messageService.getRoomMessages(room, { page, limit });

    res.status(200).json({ room, page, limit, messages });
  } catch (err) {
    next(err);
  }
}
