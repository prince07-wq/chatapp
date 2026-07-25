const User = require("../models/User");
const tokenService = require("./tokenService");
const AppError = require("../utils/AppError");

async function registerUser({ username, email, password }) {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError("Email already registered.", 409);
  }

  const user = await User.create({ username, email, password });
  const token = tokenService.generateAccessToken(user.toSafeObject());

  return { user: user.toSafeObject(), token };
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

  const token = tokenService.generateAccessToken(user.toSafeObject());
  return { user: user.toSafeObject(), token };
}

module.exports = { registerUser, loginUser };
