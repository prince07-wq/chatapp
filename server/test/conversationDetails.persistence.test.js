const assert = require("node:assert/strict");
const { afterEach, describe, it, mock } = require("node:test");

const Conversation = require("../src/models/Conversation");
const Friendship = require("../src/models/Friendship");
const User = require("../src/models/User");
const conversationService = require("../src/services/conversationService");
const conversationDetailsService = require("../src/services/conversationDetailsService");
const roomService = require("../src/services/roomService");
const userService = require("../src/services/userService");

const ownerId = "64b000000000000000000001";
const memberId = "64b000000000000000000002";

afterEach(() => mock.restoreAll());

function queryResult(value) {
  return {
    select() { return this; },
    lean: async () => value,
  };
}

describe("room details persistence", () => {
  it("returns fields, membership, and roles from the saved conversation", async () => {
    const savedConversation = {
      _id: "64c000000000000000000001",
      room: "persistence-room",
      type: "room",
      isPublic: true,
      memberIds: [ownerId],
      name: "Original",
      description: "",
      avatar: "",
      ownerId,
      adminIds: [],
      createdAt: new Date("2025-01-01T00:00:00.000Z"),
    };
    const users = [
      { _id: ownerId, username: "owner", displayName: "Owner", profileImage: "" },
      { _id: memberId, username: "member", displayName: "Member", profileImage: "" },
    ];

    mock.method(conversationService, "assertConversationAccess", async () => savedConversation);
    mock.method(User, "find", (filter) => queryResult(
      users.filter((user) => filter._id.$in.map(String).includes(String(user._id))),
    ));
    mock.method(Conversation, "findOneAndUpdate", async (_filter, update, options) => {
      assert.equal(options.returnDocument, "after");
      assert.equal(options.runValidators, true);
      if (update.$set) Object.assign(savedConversation, update.$set);
      if (update.$addToSet?.memberIds?.$each) {
        savedConversation.memberIds = [...new Set([
          ...savedConversation.memberIds,
          ...update.$addToSet.memberIds.$each,
        ])];
      }
      if (update.$addToSet?.adminIds) {
        savedConversation.adminIds = [...new Set([
          ...savedConversation.adminIds,
          update.$addToSet.adminIds,
        ])];
      }
      return savedConversation;
    });

    await roomService.updateRoom(ownerId, savedConversation.room, {
      name: "Saved name",
      description: "Saved description",
      avatar: "/uploads/saved.png",
    });
    await roomService.addMembers(ownerId, savedConversation.room, [memberId, memberId]);
    await roomService.setMemberRole(ownerId, savedConversation.room, memberId, "admin");
    const reloaded = await roomService.getRoomDetails(ownerId, savedConversation.room);

    assert.equal(reloaded.name, "Saved name");
    assert.equal(reloaded.description, "Saved description");
    assert.equal(reloaded.avatar, "/uploads/saved.png");
    assert.equal(reloaded.memberCount, 2);
    assert.equal(reloaded.members.find((member) => member.userId === memberId).role, "admin");
  });
});

describe("per-user conversation persistence", () => {
  it("saves and reloads pin and clear state after authorization", async () => {
    const savedUser = {
      pinnedConversations: [],
      clearedConversations: [],
      saveCount: 0,
      async save() { this.saveCount += 1; },
    };
    let selectQuery = false;
    mock.method(conversationService, "assertConversationAccess", async () => ({ room: "persistence-room" }));
    mock.method(User, "findById", () => selectQuery
      ? { select: async () => savedUser }
      : savedUser);

    const pins = await userService.setConversationPin(ownerId, "persistence-room", true);
    const cleared = await userService.clearConversation(ownerId, "persistence-room");
    selectQuery = true;
    const reloadedClear = await userService.getConversationClear(ownerId, "persistence-room");

    assert.equal(pins[0].room, "persistence-room");
    assert.equal(savedUser.pinnedConversations[0].room, "persistence-room");
    assert.equal(reloadedClear.getTime(), cleared.clearedAt.getTime());
    assert.equal(savedUser.saveCount, 2);
  });
});

describe("DM details privacy", () => {
  it("returns only authorized public profile fields", async () => {
    let selectedFields = "";
    mock.method(conversationService, "assertConversationAccess", async () => ({
      room: `${ownerId}_${memberId}`,
      type: "dm",
      memberIds: [ownerId, memberId],
    }));
    mock.method(User, "findById", () => ({
      select(fields) { selectedFields = fields; return this; },
      lean: async () => ({
        _id: memberId,
        username: "member",
        displayName: "Member Name",
        bio: "Public bio",
        profileImage: "/uploads/member.png",
        email: "private@example.test",
      }),
    }));
    mock.method(Friendship, "findOne", () => ({ lean: async () => null }));
    mock.method(Conversation, "find", () => queryResult([]));

    const details = await conversationDetailsService.getConversationDetails(
      ownerId,
      `${ownerId}_${memberId}`,
    );

    assert.equal(selectedFields.includes("email"), false);
    assert.equal(details.recipient.username, "member");
    assert.equal(Object.hasOwn(details.recipient, "email"), false);
  });
});
