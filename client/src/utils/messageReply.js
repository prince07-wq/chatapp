export function getReplyPreviewText(reply) {
  if (reply?.message?.trim()) return reply.message.trim();

  const mimeType = reply?.attachment?.mimeType || "";
  if (mimeType.startsWith("audio/")) return "Voice message";
  if (mimeType.startsWith("image/")) return "Photo";
  if (reply?.attachment?.fileName) return reply.attachment.fileName;
  if (reply?.attachment) return "Attachment";

  return "Original message unavailable";
}
