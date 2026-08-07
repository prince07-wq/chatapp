import InternetTransport from "./InternetTransport.js";

/**
 * TransportManager
 *
 * Per docs/adr/001-message-transport.md: exposes one normalized
 * transport contract to chat orchestration. Currently always selects
 * InternetTransport. LanTransport and selection policy are not
 * implemented yet (future milestone).
 */
export default class TransportManager {
  constructor() {
    this.activeTransport = new InternetTransport();
  }

  connect(options) {
    return this.activeTransport.connect(options);
  }

  disconnect() {
    this.activeTransport.disconnect();
  }

  emit(event, payload) {
    this.activeTransport.emit(event, payload);
  }

  on(event, handler) {
    this.activeTransport.on(event, handler);
  }

  off(event, handler) {
    this.activeTransport.off(event, handler);
  }

  getStatus() {
    return this.activeTransport.getStatus();
  }

  joinConversation(room) {
    this.activeTransport.joinConversation(room);
  }

  leaveConversation(room) {
    this.activeTransport.leaveConversation(room);
  }
}