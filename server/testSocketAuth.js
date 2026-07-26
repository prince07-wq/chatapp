
console.log("Starting test...");
const { io } = require("socket.io-client");

// Paste your FULL JWT here
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhNjRmZDdkODE5YzU0NDY5ZThjMDAwMyIsInVzZXJuYW1lIjoidGVzdCIsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsImlhdCI6MTc4NTAzNTg3OSwiZXhwIjoxNzg1MTIyMjc5fQ.UMIZ63IVh7aaJ1ybre_hGhRiHNy9p5p6j8HG5U9holE";

const socket = io("http://localhost:5000", {
  auth: { token },
});

const messages = [
  "Hello 1",
  "Hello 2",
  "Hello 3",
  "Hello 4",
  "Hello 5",
];

socket.on("connect", () => {
  console.log("✅ Connected");
  console.log("Socket ID:", socket.id);

  socket.emit("join_room", {
    room: "test-room",
  });

  console.log("📥 Joined room: test-room");

  messages.forEach((msg, index) => {
    setTimeout(() => {
      console.log(`📤 Sending: ${msg}`);

      socket.emit("send_message", {
        room: "test-room",
        message: msg,
      });
    }, (index + 1) * 1000);
  });

  // Disconnect after all messages are sent
  setTimeout(() => {
    console.log("✅ Test complete. Disconnecting...");
    socket.disconnect();
  }, 7000);
});

socket.on("receive_message", (data) => {
  console.log("📩 Received:", data);
});

socket.on("error", (err) => {
  console.log("❌ Error:", err);
});

socket.on("disconnect", () => {
  console.log("🔌 Disconnected");
});