/**
 * Utility functions for emoji handling
 */

// Emoji regex pattern to detect emojis
const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{238C}]|[\u{2194}-\u{2199}]|[\u{21A9}-\u{21AA}]|[\u{231A}-\u{231B}]|[\u{23E9}-\u{23EC}]|[\u{23F0}]|[\u{23F3}]|[\u{25FD}-\u{25FE}]|[\u{2614}-\u{2615}]|[\u{2648}-\u{2653}]|[\u{267F}]|[\u{2693}]|[\u{26A1}]|[\u{26AA}-\u{26AB}]|[\u{26BD}-\u{26BE}]|[\u{26C4}-\u{26C5}]|[\u{26CE}]|[\u{26D4}]|[\u{26EA}]|[\u{26F2}-\u{26F3}]|[\u{26F5}]|[\u{26FA}]|[\u{26FD}]|[\u{2705}]|[\u{270A}-\u{270B}]|[\u{2728}]|[\u{274C}]|[\u{274E}]|[\u{2753}-\u{2755}]|[\u{2757}]|[\u{2795}-\u{2797}]|[\u{27B0}]|[\u{27BF}]|[\u{2B1B}-\u{2B1C}]|[\u{2B50}]|[\u{2B55}]/gu;

/**
 * Check if a string contains only emojis and whitespace
 * @param {string} text - The text to check
 * @returns {boolean} - True if the text contains only emojis and whitespace
 */
export const isEmojiOnly = (text) => {
  if (!text || typeof text !== 'string') return false;
  
  // Remove all whitespace
  const trimmedText = text.replace(/\s/g, '');
  
  // If empty after removing whitespace, it's not emoji-only
  if (!trimmedText) return false;
  
  // Replace all emojis with empty string
  const withoutEmojis = trimmedText.replace(emojiRegex, '');
  
  // If nothing left after removing emojis, it's emoji-only
  return withoutEmojis.length === 0;
};

/**
 * Count the number of emojis in a text
 * @param {string} text - The text to count emojis in
 * @returns {number} - Number of emojis found
 */
export const countEmojis = (text) => {
  if (!text || typeof text !== 'string') return 0;
  
  const matches = text.match(emojiRegex);
  return matches ? matches.length : 0;
};

/**
 * Get emoji size class based on emoji count
 * @param {number} emojiCount - Number of emojis
 * @returns {string} - CSS class for emoji size
 */
export const getEmojiSizeClass = (emojiCount) => {
  if (emojiCount === 1) return 'text-6xl'; // Very large for single emoji
  if (emojiCount === 2) return 'text-5xl'; // Large for two emojis
  if (emojiCount <= 3) return 'text-4xl'; // Medium for 3 emojis
  if (emojiCount <= 5) return 'text-3xl'; // Smaller for 4-5 emojis
  return 'text-2xl'; // Default size for more emojis
};

/**
 * Check if text is a single emoji
 * @param {string} text - The text to check
 * @returns {boolean} - True if text is exactly one emoji
 */
export const isSingleEmoji = (text) => {
  return isEmojiOnly(text) && countEmojis(text) === 1;
};

/**
 * Extract all emojis from text
 * @param {string} text - The text to extract emojis from
 * @returns {string[]} - Array of emojis found
 */
export const extractEmojis = (text) => {
  if (!text || typeof text !== 'string') return [];
  
  const matches = text.match(emojiRegex);
  return matches || [];
};
