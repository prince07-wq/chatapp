const presenceService = require("../services/presenceService");

async function getOnlineUsers(req, res, next) {
  try {
    const users = await presenceService.getOnlineUsers();
    res.status(200).json({ users, count: users.length });
  } catch (err) {
    next(err);
  }
}

module.exports = { getOnlineUsers };
