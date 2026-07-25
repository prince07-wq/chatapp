const authService = require("../services/authService");
const AppError = require("../utils/AppError");
const {
  isValidRegisterPayload,
  isValidLoginPayload,
} = require("../utils/httpValidators");

async function register(req, res, next) {
  try {
    if (!isValidRegisterPayload(req.body)) {
      throw new AppError(
        "username, valid email, and password (min 6 chars) are required.",
        400
      );
    }

    const result = await authService.registerUser(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    if (!isValidLoginPayload(req.body)) {
      throw new AppError("Valid email and password are required.", 400);
    }

    const result = await authService.loginUser(req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };
