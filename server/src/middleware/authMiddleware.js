const tokenService = require("../services/tokenService");
const AppError = require("../utils/AppError");

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("Missing or invalid authorization header.", 401));
  }

  const token = authHeader.split(" ")[1];

  try {
    req.user = tokenService.verifyAccessToken(token);
    next();
  } catch (err) {
    next(new AppError("Invalid or expired token.", 401));
  }
}

module.exports = authenticate;
