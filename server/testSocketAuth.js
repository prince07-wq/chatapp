const { io } = require("socket.io-client");

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhNjRmZDdkODE5YzU0NDY5ZThjMDAwMyIsInVzZXJuYW1lIjoidGVzdCIsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSIsImlhdCI6MTc4NTAzNTg3OSwiZXhwIjoxNzg1MTIyMjc5fQ.UMIZ63IVh7aaJ1ybre_hGhRiHNy9p5p6j8HG5U9holE";

const socket = io("http://localhost:5000", {
  auth: { token },
});

socket.on("connect", () => {
  console.log("✅ Connected");

  socket.emit("join_room", {
    room: "test-room",
  });

  setTimeout(() => {
    socket.emit("send_message", {
      room: "test-room",
      message: "hello mongodb!",
    });
  }, 500);
});

socket.on("receive_message", (data) => {
  console.log("Received:", data);
});

socket.on("error", (err) => {
  console.log("Error:", err);
});