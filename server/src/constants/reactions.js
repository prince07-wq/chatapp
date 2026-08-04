const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

function isReactionEmoji(value) {
  if (typeof value !== "string" || value !== value.trim() || value.length > 32) {
    return false;
  }

  const segments = [
    ...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(value),
  ];
  if (segments.length !== 1) return false;

  return (
    /\p{Extended_Pictographic}/u.test(value) ||
    /\p{Regional_Indicator}/u.test(value) ||
    /^[#*0-9]\uFE0F?\u20E3$/u.test(value)
  );
}

module.exports = { QUICK_REACTIONS, isReactionEmoji };
