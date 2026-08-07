import { io } from "socket.io-client";

/**
 * InternetTransport
 *
 * Wraps the existing Socket.IO connection. This is a lift-and-shift of
 * the connection logic previously inline in useSocketLifecycle — no
 * event names, payloads, or reconnect behavior changed.
 */
export default class InternetTransport {
  constructor() {
    this.socket = null;
  }

  connect({ url, auth }) {
    if (this.socket) {
      this.socket.connect();
      return this.socket;
    }
    this.socket = io(url, { auth });
    return this.socket;
  }

  disconnect() {
    this.socket?.disconnect();
  }

  emit(event, payload) {
    this.socket?.emit(event, payload);
  }

  on(event, handler) {
    this.socket?.on(event, handler);
  }

  off(event, handler) {
    this.socket?.off(event, handler);
  }

  getStatus() {
    return this.socket?.connected ? "connected" : "disconnected";
  }

  joinConversation(room) {
    this.emit("join_room", { room });
  }

  leaveConversation(room) {
    this.emit("leave_room", { room });
  }
}