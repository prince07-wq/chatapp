const { isNonEmptyString } = require("./socketValidators");

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

module.exports = { isValidEmail, isValidRegisterPayload, isValidLoginPayload };
