const { isNonEmptyString } = require("./socketValidators");
const AppError = require("./AppError");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email) {
  return isNonEmptyString(email) && EMAIL_REGEX.test(email);
}

function isValidRegisterPayload(body) {
  return (
    body &&
    isNonEmptyString(body.username) &&
    isValidEmail(body.email) &&
    isNonEmptyString(body.password) &&
    body.password.length >= 6
  );
}

function isValidLoginPayload(body) {
  return body && isValidEmail(body.email) && isNonEmptyString(body.password);
}

function isValidEditPayload(body) {
  return body && isNonEmptyString(body.message);
}

module.exports = {
  isValidEmail,
  isValidRegisterPayload,
  isValidLoginPayload,
  isValidEditPayload,
  parsePagination,
};

function parsePagination(query) {
  const rawPage = query.page;
  const rawLimit = query.limit;

  const page = rawPage === undefined ? 1 : Number(rawPage);
  const limit = rawLimit === undefined ? 20 : Number(rawLimit);

  const isPositiveInt = (n) => Number.isInteger(n) && n > 0;

  if (!isPositiveInt(page)) {
    throw new AppError("'page' must be a positive integer.", 400);
  }

  if (!isPositiveInt(limit) || limit > 100) {
    throw new AppError("'limit' must be a positive integer up to 100.", 400);
  }

  return { page, limit };
}