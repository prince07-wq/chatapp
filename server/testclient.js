// test-client.js
// Connects TWO fake clients, joins a room, tests message, presence, and typing.
// Needs: npm install socket.io-client

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

clientA.on("room_joined", (data) => console.log("[A] joined room:", data));
clientB.on("room_joined", (data) => {
  console.log("[B] joined room:", data);

  setTimeout(() => {
    clientA.emit("send_message", { room: ROOM, message: "hello from A" });
    clientA.emit("request_members", { room: ROOM });

    // Simulate spam: fire typing_start 5 times rapidly.
    // B should only see ONE typing_start (spam prevention working).
    console.log("--- A spamming typing_start x5 ---");
    for (let i = 0; i < 5; i++) {
      clientA.emit("typing_start", { room: ROOM });
    }

    // Do NOT call typing_stop — wait for auto-clear (3s) instead.
  }, 500);
});

clientA.on("user_joined", (data) => console.log("[A] saw user join:", data));
clientB.on("user_joined", (data) => console.log("[B] saw user join:", data));

clientA.on("new_message", (data) => console.log("[A] received message:", data));
clientB.on("new_message", (data) => console.log("[B] received message:", data));

clientA.on("room_members", (data) => console.log("[A] member list:", data));

clientB.on("typing_start", (data) => console.log("[B] saw typing_start:", data));
clientB.on("typing_stop", (data) => console.log("[B] saw typing_stop (auto-clear expected ~3s after spam):", data));

clientA.on("user_left", (data) => console.log("[A] saw user leave:", data));

clientA.on("error", (err) => console.log("[A] error:", err));
clientB.on("error", (err) => console.log("[B] error:", err));

// Invalid payload — should NOT crash server
setTimeout(() => {
  console.log("--- sending invalid payload ---");
  clientA.emit("send_message", { room: "", message: "" });
  clientA.emit("typing_start", { room: 123 });
}, 1500);

// Disconnect B abruptly
setTimeout(() => {
  console.log("--- disconnecting B abruptly ---");
  clientB.disconnect();
}, 5500);

setTimeout(() => {
  console.log("--- done ---");
  clientA.disconnect();
  process.exit(0);
}, 6500);
