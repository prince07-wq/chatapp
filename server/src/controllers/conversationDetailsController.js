const conversationDetailsService = require("../services/conversationDetailsService");

async function details(req, res, next) {
  try {
    res.json(
      await conversationDetailsService.getConversationDetails(
        req.user.id,
        req.params.room,
      ),
    );
  } catch (error) {
    next(error);
  }
}

async function media(req, res, next) {
  try {
    res.json(
      await conversationDetailsService.getSharedMedia(
        req.user.id,
        req.params.room,
        req.query.page,
        req.query.limit,
      ),
    );
  } catch (error) {
    next(error);
  }
}

module.exports = { details, media };
