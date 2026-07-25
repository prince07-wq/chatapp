const { io } = require("socket.io-client");

// 👇 Paste the JWT you got from login here
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9......";

const socket = io("http://localhost:5000", {
  auth: {
    token,
  },
});

socket.on("connect", () => {
  console.log("✅ Connected!");
  console.log("Socket ID:", socket.id);
});

socket.on("connect_error", (err) => {
  console.log("❌ Connection failed:");
  console.log(err.message);
});

socket.on("disconnect", () => {
  console.log("Disconnected");
});