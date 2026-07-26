function getPrivateRoomId(userIdA, userIdB) {
  return [userIdA, userIdB].sort().join("_");
}

module.exports = { getPrivateRoomId };
