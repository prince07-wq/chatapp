const express = require("express");
const cors = require("cors");
const config = require("./config");

/**
 * Express app configuration only.
 * No server creation, no socket.io, no listening here —
 * keeps this file testable in isolation.
 */
const app = express();

app.use(cors({ origin: config.CLIENT_URL }));
app.use(express.json());

app.use("/api/v1/auth", require("./routes/v1/authRoutes"));

app.use(require("./middleware/errorHandler"));

module.exports = app;
