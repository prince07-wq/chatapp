function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.statusCode ? err.message : "Internal server error";

  if (!err.statusCode) {
    console.error("[errorHandler] unexpected error:", err);
  }

  res.status(statusCode).json({ error: message });
}

module.exports = errorHandler;
