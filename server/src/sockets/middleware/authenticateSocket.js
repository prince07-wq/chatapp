const tokenService = require("../../services/tokenService");

/**
 * Authenticates the socket handshake using a JWT.
 * Client must send the token via socket auth payload:
 *   io(URL, { auth: { token: "<jwt>" } })
 *
 * On success, socket.data.user = { id, username } — all handlers
 * from this point on should identify the actor via socket.data.user,
 * not socket.id.
 */
function authenticateSocket(socket, next) {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error("Authentication required."));
  }

  try {
    socket.data.user = tokenService.verifyAccessToken(token);
    next();
  } catch (err) {
    next(new Error("Invalid or expired token."));
  }
}

module.exports = authenticateSocket;
