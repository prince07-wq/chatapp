const jwt = require("jsonwebtoken");
const config = require("../config");

function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, config.JWT_SECRET);
}

module.exports = { generateAccessToken, verifyAccessToken };
