/**
 * Test file for emoji utilities
 * This can be used to verify emoji detection works correctly
 */

import { isEmojiOnly, countEmojis, getEmojiSizeClass, isSingleEmoji, extractEmojis } from './emojiUtils';

// Test cases for emoji detection
const testCases = [
  // Single emoji tests
  { text: '😀', expected: { isEmojiOnly: true, count: 1, isSingle: true } },
  { text: '🎉', expected: { isEmojiOnly: true, count: 1, isSingle: true } },
  { text: '❤️', expected: { isEmojiOnly: true, count: 1, isSingle: true } },
  
  // Multiple emoji tests
  { text: '😀😂', expected: { isEmojiOnly: true, count: 2, isSingle: false } },
  { text: '🎉🎊🎈', expected: { isEmojiOnly: true, count: 3, isSingle: false } },
  { text: '😀 😂 😍', expected: { isEmojiOnly: true, count: 3, isSingle: false } },
  
  // Mixed content tests
  { text: 'Hello 😀', expected: { isEmojiOnly: false, count: 1, isSingle: false } },
  { text: '😀 Hello', expected: { isEmojiOnly: false, count: 1, isSingle: false } },
  { text: 'Hello 😀 World 😂', expected: { isEmojiOnly: false, count: 2, isSingle: false } },
  
  // Text only tests
  { text: 'Hello World', expected: { isEmojiOnly: false, count: 0, isSingle: false } },
  { text: '', expected: { isEmojiOnly: false, count: 0, isSingle: false } },
  { text: '   ', expected: { isEmojiOnly: false, count: 0, isSingle: false } },
];

// Function to run tests
export const runEmojiTests = () => {
  console.log('🧪 Running Emoji Utility Tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  testCases.forEach((testCase, index) => {
    const { text, expected } = testCase;
    
    const actualIsEmojiOnly = isEmojiOnly(text);
    const actualCount = countEmojis(text);
    const actualIsSingle = isSingleEmoji(text);
    const actualExtracted = extractEmojis(text);
    const actualSizeClass = getEmojiSizeClass(actualCount);
    
    const isCorrect = 
      actualIsEmojiOnly === expected.isEmojiOnly &&
      actualCount === expected.count &&
      actualIsSingle === expected.isSingle;
    
    if (isCorrect) {
      passed++;
      console.log(`✅ Test ${index + 1}: "${text}" - PASSED`);
    } else {
      failed++;
      console.log(`❌ Test ${index + 1}: "${text}" - FAILED`);
      console.log(`   Expected: isEmojiOnly=${expected.isEmojiOnly}, count=${expected.count}, isSingle=${expected.isSingle}`);
      console.log(`   Actual:   isEmojiOnly=${actualIsEmojiOnly}, count=${actualCount}, isSingle=${actualIsSingle}`);
    }
    
    console.log(`   Size class: ${actualSizeClass}`);
    console.log(`   Extracted emojis: [${actualExtracted.join(', ')}]\n`);
  });
  
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  return { passed, failed, total: testCases.length };
};

// Example usage in browser console:
// import { runEmojiTests } from './utils/emojiUtils.test.js';
// runEmojiTests();
