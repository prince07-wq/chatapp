const express = require("express");
const cors = require("cors");
const path = require("path");
const config = require("./config");
const { authLimiter, generalLimiter } = require("./middleware/rateLimiter");

const app = express();

app.use(cors({ origin: config.CLIENT_URL }));
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/v1/auth", authLimiter, require("./routes/v1/authRoutes"));
app.use("/api/v1/messages", generalLimiter, require("./routes/v1/messageRoutes"));
app.use("/api/v1/users", generalLimiter, require("./routes/v1/userRoutes"));
app.use("/api/v1/files", generalLimiter, require("./routes/v1/fileRoutes"));

app.use(require("./middleware/errorHandler"));

module.exports = app;