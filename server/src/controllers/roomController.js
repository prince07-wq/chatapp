const roomService = require("../services/roomService");
const conversationDetailsService = require("../services/conversationDetailsService");

async function details(req, res, next) { try { res.json(await roomService.getRoomDetails(req.user.id, req.params.room)); } catch (error) { next(error); } }
async function update(req, res, next) { try { res.json(await roomService.updateRoom(req.user.id, req.params.room, req.body)); } catch (error) { next(error); } }
async function addMembers(req, res, next) { try { res.json(await roomService.addMembers(req.user.id, req.params.room, req.body?.userIds)); } catch (error) { next(error); } }
async function removeMember(req, res, next) { try { res.json(await roomService.removeMember(req.user.id, req.params.room, req.params.userId)); } catch (error) { next(error); } }
async function setRole(req, res, next) { try { res.json(await roomService.setMemberRole(req.user.id, req.params.room, req.params.userId, req.body?.role)); } catch (error) { next(error); } }
async function leave(req, res, next) { try { res.json(await roomService.leaveRoom(req.user.id, req.params.room)); } catch (error) { next(error); } }
async function media(req, res, next) { try { res.json(await conversationDetailsService.getSharedMedia(req.user.id, req.params.room, req.query.page, req.query.limit)); } catch (error) { next(error); } }

module.exports = { addMembers, details, leave, media, removeMember, setRole, update };
