// test-client.js
// Standalone script — connects TWO fake clients to your running server,
// joins them to a room, sends a message, confirms room-scoped broadcast works.
//
// Run this from a separate terminal WHILE your server (npm run dev) is running.
// Needs socket.io-client installed: npm install socket.io-client

const { io } = require("socket.io-client");

const SERVER_URL = "http://localhost:5000";
const ROOM = "test-room";

const clientA = io(SERVER_URL);
const clientB = io(SERVER_URL);

clientA.on("connect", () => {
  console.log("[A] connected:", clientA.id);
  clientA.emit("join_room", { room: ROOM });
});

clientB.on("connect", () => {
  console.log("[B] connected:", clientB.id);
  clientB.emit("join_room", { room: ROOM });
});

clientA.on("room_joined", (data) => {
  console.log("[A] joined room:", data.room);
});

clientB.on("room_joined", (data) => {
  console.log("[B] joined room:", data.room);

  // once B has joined, send a message from A — B should receive it
  setTimeout(() => {
    clientA.emit("send_message", { room: ROOM, message: "hello from A" });
  }, 500);
});

clientA.on("new_message", (data) => {
  console.log("[A] received message:", data);
});

clientB.on("new_message", (data) => {
  console.log("[B] received message:", data);
});

clientA.on("error", (err) => console.log("[A] error:", err));
clientB.on("error", (err) => console.log("[B] error:", err));

// Test invalid payload too — should NOT crash server, should get error back
setTimeout(() => {
  console.log("--- sending invalid payload ---");
  clientA.emit("send_message", { room: "", message: "" });
  clientA.emit("join_room", { room: 123 });
}, 1500);

setTimeout(() => {
  console.log("--- done, disconnecting ---");
  clientA.disconnect();
  clientB.disconnect();
  process.exit(0);
}, 3000);