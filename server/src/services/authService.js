const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const tokenService = require("./tokenService");
const AppError = require("../utils/AppError");
const config = require("../config");

function getRefreshExpiryDate() {
  const match = /^(\d+)([smhd])$/.exec(config.JWT_REFRESH_EXPIRES_IN);
  const now = Date.now();

  if (!match) {
    return new Date(now + 7 * 24 * 60 * 60 * 1000);
  }

  const value = Number(match[1]);
  const unit = match[2];
  const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };

  return new Date(now + value * multipliers[unit]);
}

async function issueTokens(safeUser) {
  const accessToken = tokenService.generateAccessToken(safeUser);
  const refreshToken = tokenService.generateRefreshToken(safeUser);

  await RefreshToken.create({
    token: refreshToken,
    userId: safeUser.id,
    expiresAt: getRefreshExpiryDate(),
  });

  return { accessToken, refreshToken };
}

async function registerUser({ username, email, password }) {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError("Email already registered.", 409);
  }

  const user = await User.create({ username, email, password });
  const tokens = await issueTokens(user.toSafeObject());

  return { user: user.toSafeObject(), ...tokens };
}

async function loginUser({ email, password }) {
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError("Invalid email or password.", 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError("Invalid email or password.", 401);
  }

  const tokens = await issueTokens(user.toSafeObject());
  return { user: user.toSafeObject(), ...tokens };
}

async function refreshAccessToken(refreshToken) {
  let decoded;
  try {
    decoded = tokenService.verifyRefreshToken(refreshToken);
  } catch (err) {
    throw new AppError("Invalid or expired refresh token.", 401);
  }

  const stored = await RefreshToken.findOne({ token: refreshToken, revoked: false });
  if (!stored) {
    throw new AppError("Invalid or expired refresh token.", 401);
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new AppError("User no longer exists.", 401);
  }

  const accessToken = tokenService.generateAccessToken(user.toSafeObject());
  return { accessToken };
}

async function logoutUser(refreshToken) {
  const stored = await RefreshToken.findOne({ token: refreshToken });
  if (!stored) {
    throw new AppError("Invalid refresh token.", 400);
  }

  stored.revoked = true;
  await stored.save();
}

module.exports = { registerUser, loginUser, refreshAccessToken, logoutUser };